from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import Base, engine, get_db
from app.models import Voter
from app.predictive import predict_label, predict_probability
from app.schemas import (
    EnrichmentTriggerRequest,
    HealthResponse,
    PredictiveScoreRequest,
    PredictiveScoreResponse,
    VoterCreate,
    VoterListItem,
    VoterRead,
    VoterUpdate,
)
from app.tasks import ENRICHMENT_AGENTS, dispatch_enrichment, ensure_enrichment_rows

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", service="election-enrichment-engine")


@app.get("/agents")
def list_agents() -> dict[str, str]:
    return ENRICHMENT_AGENTS


@app.get("/voters", response_model=list[VoterListItem])
def list_voters(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)) -> list[Voter]:
    return db.query(Voter).offset(skip).limit(limit).all()


@app.post("/voters", response_model=VoterRead, status_code=status.HTTP_201_CREATED)
def create_voter(payload: VoterCreate, db: Session = Depends(get_db)) -> Voter:
    existing = db.query(Voter).filter(Voter.national_id == payload.national_id).one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="Voter with this national_id already exists")

    voter = Voter(**payload.model_dump())
    db.add(voter)
    db.commit()
    db.refresh(voter)
    return voter


@app.get("/voters/{voter_id}", response_model=VoterRead)
def get_voter(voter_id: int, db: Session = Depends(get_db)) -> Voter:
    voter = db.get(Voter, voter_id)
    if voter is None:
        raise HTTPException(status_code=404, detail="Voter not found")
    return voter


@app.patch("/voters/{voter_id}", response_model=VoterRead)
def update_voter(voter_id: int, payload: VoterUpdate, db: Session = Depends(get_db)) -> Voter:
    voter = db.get(Voter, voter_id)
    if voter is None:
        raise HTTPException(status_code=404, detail="Voter not found")

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(voter, key, value)

    db.commit()
    db.refresh(voter)
    return voter


@app.post("/voters/{voter_id}/enrich")
def enrich_voter(
    voter_id: int,
    payload: EnrichmentTriggerRequest,
    db: Session = Depends(get_db),
) -> dict[str, list[str] | int]:
    voter = db.get(Voter, voter_id)
    if voter is None:
        raise HTTPException(status_code=404, detail="Voter not found")

    ensure_enrichment_rows(db, voter_id, payload.agent_keys)
    task_ids = dispatch_enrichment(voter_id, payload.agent_keys)
    return {"voter_id": voter_id, "task_ids": task_ids}


@app.post("/predict", response_model=PredictiveScoreResponse)
def predict(payload: PredictiveScoreRequest) -> PredictiveScoreResponse:
    score = predict_probability(payload.features)
    return PredictiveScoreResponse(
        score=score,
        label=predict_label(score, payload.threshold),
        threshold=payload.threshold,
    )
