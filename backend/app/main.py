"""
BlackOpps Election Intelligence — FastAPI Application
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Production API serving all intelligence modules.
Auth-protected, rate-limited, CORS-enabled.
"""

from __future__ import annotations

import logging
import os
import secrets
import traceback
from contextlib import asynccontextmanager
from datetime import UTC, datetime

from fastapi import Depends, FastAPI, File, HTTPException, Query, Request, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy import or_, text
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import Base, engine, get_db
from app.dispatch_queue import enqueue_dispatch_record, get_dispatch_queue_stats
from app.intelligence.api_integration import get_pipeline, pipeline_summary, profile_to_dict
from app.intelligence.auth import (
    AuthMiddleware,
    RateLimitMiddleware,
    RateLimiter,
    SecurityHeadersMiddleware,
    parse_api_keys,
)
from app.intelligence.gotv import GOTVPredictor, gotv_battleplan
from app.intelligence.opposition import OppositionResearch, comparison_to_dict
from app.intelligence.pdf_generator import generate_briefing_pdf
from app.models import Voter
from app.predictive import predict_label, predict_probability
from app.schemas import (
    AnalyzeRequest,
    CompareRequest,
    DispatchRequest,
    DispatchResponse,
    EnrichmentTriggerRequest,
    GotvRequest,
    HealthResponse,
    PredictiveScoreRequest,
    PredictiveScoreResponse,
    VoterCreate,
    VoterListItem,
    VoterListResponse,
    VoterRead,
    VoterUpdate,
)
from app.services_voters import (
    classify_db_voters,
    import_voters,
    parse_excel_voters,
)
from app.tasks import ENRICHMENT_AGENTS, dispatch_enrichment, ensure_enrichment_rows

logger = logging.getLogger("blackopps.api")
logging.basicConfig(level=logging.INFO)

settings = get_settings()
API_KEYS = parse_api_keys(os.getenv("BLACKOPPS_API_KEYS") or getattr(settings, "blackopps_api_keys", None))
gotv_predictor = GOTVPredictor()

pipeline = get_pipeline(
    newsapi_key=settings.newsapi_key or os.getenv("NEWSAPI_KEY"),
    opensanctions_key=settings.opensanctions_api_key or os.getenv("OPENSANCTIONS_API_KEY"),
    opencorporates_key=settings.opencorporates_api_key or os.getenv("OPENCORPORATES_API_KEY"),
)


def _ensure_voter_columns() -> None:
    """Add GOTV columns on existing SQLite/Postgres tables if missing."""
    columns = {
        "turnout_history": "FLOAT",
        "notes": "TEXT",
        "gotv_category": "VARCHAR(20)",
        "gotv_priority": "FLOAT",
        "gotv_channel": "VARCHAR(64)",
        "gotv_frequency": "VARCHAR(64)",
        "gotv_message": "TEXT",
        "enriched_at": "TIMESTAMP",
    }
    with engine.begin() as conn:
        if engine.dialect.name == "sqlite":
            existing = {row[1] for row in conn.execute(text("PRAGMA table_info(voters)")).fetchall()}
        else:
            result = conn.execute(
                text(
                    "SELECT column_name FROM information_schema.columns "
                    "WHERE table_name = 'voters'"
                )
            )
            existing = {row[0] for row in result.fetchall()}
        for name, col_type in columns.items():
            if name not in existing:
                conn.execute(text(f"ALTER TABLE voters ADD COLUMN {name} {col_type}"))


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    try:
        _ensure_voter_columns()
    except Exception as exc:  # noqa: BLE001
        logger.warning("Schema migrate skipped: %s", exc)
    routes = sorted({getattr(r, "path", str(r)) for r in app.routes})
    print("=" * 60)
    print("BlackOpps Election Intelligence v5.0.0")
    print(f"Auth configured: {bool(API_KEYS)}")
    print(f"Routes ({len(routes)}):")
    for path in routes:
        print(f"  • {path}")
    print("Health: /health")
    print("=" * 60)
    yield


app = FastAPI(
    title="BlackOpps Election Intelligence",
    version="5.0.0",
    lifespan=lifespan,
)

# Middleware order: last added = outermost
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitMiddleware, limiter=RateLimiter())
app.add_middleware(AuthMiddleware, api_keys=API_KEYS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(
        dict.fromkeys(
            [
                *settings.cors_origins,
                "https://blackopps.vercel.app",
                "http://localhost:3000",
                "http://127.0.0.1:3000",
            ]
        )
    ),
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.error("Unhandled error on %s %s\n%s", request.method, request.url.path, traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={"error": "Internal error", "detail": "An unexpected error occurred"},
    )


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        service="blackopps",
        version="5.0.0",
        auth_configured=bool(API_KEYS),
        rate_limiter="active",
        modules=["gotv", "scoring", "pipeline", "opposition", "pdf", "collectors"],
    )


@app.get("/agents")
async def list_agents() -> dict:
    return {
        "agents": [
            {
                "id": "predator-v5",
                "type": "voice",
                "status": "configured",
                "personas": ["daniel", "yoav", "ronit", "shmuel"],
            }
        ],
        "enrichment_agents": ENRICHMENT_AGENTS,
    }


@app.get("/voters", response_model=VoterListResponse)
async def list_voters(
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    category: str | None = None,
    search: str | None = None,
    db: Session = Depends(get_db),
) -> VoterListResponse:
    try:
        query = db.query(Voter)
        if category:
            query = query.filter(Voter.gotv_category == category.upper())
        if search:
            like = f"%{search}%"
            query = query.filter(
                or_(
                    Voter.first_name.ilike(like),
                    Voter.last_name.ilike(like),
                    Voter.city.ilike(like),
                    Voter.national_id.ilike(like),
                )
            )
        total = query.count()
        rows = query.order_by(Voter.id.asc()).offset(offset).limit(limit).all()
        return VoterListResponse(
            total=total,
            limit=limit,
            offset=offset,
            voters=[VoterListItem.model_validate(row) for row in rows],
        )
    except Exception as exc:  # noqa: BLE001
        logger.error("list_voters failed: %s", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/voters/{voter_id}", response_model=VoterRead)
async def get_voter(voter_id: str, db: Session = Depends(get_db)) -> Voter:
    try:
        vid = int(voter_id)
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=404, detail="Voter not found") from exc
    voter = db.get(Voter, vid)
    if voter is None:
        raise HTTPException(status_code=404, detail="Voter not found")
    return voter


@app.post("/voters", response_model=VoterRead, status_code=status.HTTP_201_CREATED)
async def create_voter(payload: VoterCreate, db: Session = Depends(get_db)) -> Voter:
    data = payload.model_dump()
    if not data.get("national_id"):
        data["national_id"] = secrets.token_hex(8)
    existing = db.query(Voter).filter(Voter.national_id == data["national_id"]).one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="Voter with this national_id already exists")
    voter = Voter(**data)
    db.add(voter)
    db.commit()
    db.refresh(voter)
    return voter


@app.patch("/voters/{voter_id}", response_model=VoterRead)
async def update_voter(voter_id: int, payload: VoterUpdate, db: Session = Depends(get_db)) -> Voter:
    voter = db.get(Voter, voter_id)
    if voter is None:
        raise HTTPException(status_code=404, detail="Voter not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(voter, key, value)
    db.commit()
    db.refresh(voter)
    return voter


@app.post("/voters/import")
async def import_voters_excel(file: UploadFile = File(...), db: Session = Depends(get_db)) -> dict:
    try:
        content = await file.read()
        records = parse_excel_voters(content)
        if not records:
            raise HTTPException(status_code=422, detail="No voter rows found in Excel file")
        result = import_voters(db, records)
        new_ids = [int(v.id) for v in (result.get("new_voters") or []) if getattr(v, "id", None) is not None]
        gotv_result = classify_db_voters(db, gotv_predictor)
        total_in_db = db.query(Voter).count()

        # Option B: OSINT only on newly imported voters (capped)
        osint_samples: list[dict] = []
        new_voters: list[Voter] = []
        if new_ids:
            new_voters = (
                db.query(Voter).filter(Voter.id.in_(new_ids[:100])).all()
            )
        for voter in new_voters:
            name = f"{voter.first_name} {voter.last_name}".strip()
            try:
                profiles = await pipeline.enrich([name], location=voter.city or "", jurisdiction="il")
                if not profiles:
                    continue
                p = profiles[0]
                voter.raw_data = profile_to_dict(p)
                voter.enriched_at = datetime.now(UTC)
                if voter.support_score is None or float(voter.support_score) <= 0:
                    voter.support_score = max(0.05, min(0.95, float(p.composite_score) / 100.0))
                osint_samples.append(
                    {
                        "name": name,
                        "composite": float(p.composite_score),
                        "tier": p.tier.value if hasattr(p.tier, "value") else str(p.tier),
                        "political": float(p.political_capital),
                        "community": float(p.community_influence),
                        "voter_reliability": float(p.voter_reliability),
                        "financial": float(p.financial_leverage),
                    }
                )
            except Exception as exc:  # noqa: BLE001
                logger.warning("OSINT enrichment failed for %s: %s", name, exc)
        if new_voters:
            db.commit()

        return {
            "imported": result["imported"],
            "duplicates": result["duplicates"],
            "total": total_in_db,
            "classified": gotv_result["classified"],
            "categories": gotv_result["categories"],
            "gotv": {"classified": gotv_result["classified"], "categories": gotv_result["categories"]},
            "osint_enriched": len(osint_samples),
            "osint_samples": osint_samples[:20],
        }
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        logger.error("import failed: %s", traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Import failed: {exc}") from exc


@app.post("/voters/{voter_id}/enrich")
async def enrich_voter(
    voter_id: int,
    payload: EnrichmentTriggerRequest | None = None,
    db: Session = Depends(get_db),
) -> dict:
    voter = db.get(Voter, voter_id)
    if voter is None:
        raise HTTPException(status_code=404, detail="Voter not found")
    name = f"{voter.first_name} {voter.last_name}".strip()
    try:
        profiles = await pipeline.enrich([name], location=voter.city or "", jurisdiction="il")
        profile = profiles[0] if profiles else None
        if profile:
            voter.raw_data = profile_to_dict(profile)
            voter.enriched_at = datetime.now(UTC)
            db.commit()
        agent_keys = payload.agent_keys if payload else None
        ensure_enrichment_rows(db, voter_id, agent_keys)
        task_ids = dispatch_enrichment(voter_id, agent_keys)
        return {
            "voter_id": voter_id,
            "task_ids": task_ids,
            "profile": profile_to_dict(profile) if profile else None,
        }
    except Exception as exc:  # noqa: BLE001
        logger.error("enrich failed: %s", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/analyze")
async def analyze(request: AnalyzeRequest) -> dict:
    try:
        names = [n.strip() for n in (request.names or []) if n and n.strip()]
        if not names:
            raise HTTPException(status_code=422, detail="No names provided")
        profiles = await pipeline.enrich(
            names,
            location=request.location or "",
            jurisdiction=request.jurisdiction or "il",
            keywords=request.keywords,
        )
        return {
            "profiles": [profile_to_dict(p) for p in profiles],
            "summary": pipeline_summary(pipeline),
        }
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        logger.error("analyze failed: %s", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/analyze/voters")
async def analyze_voters_endpoint(request: AnalyzeRequest, db: Session = Depends(get_db)) -> dict:
    try:
        names = [n.strip() for n in (request.names or []) if n and n.strip()]
        if request.voter_ids:
            rows = db.query(Voter).filter(Voter.id.in_(request.voter_ids)).all()
            names.extend(f"{v.first_name} {v.last_name}".strip() for v in rows)
        names = list(dict.fromkeys(names))
        if not names:
            raise HTTPException(status_code=422, detail="Provide names or voter_ids")

        # Prefer local 30-metric analyzer for batch voter profiling (legacy contract)
        from app.intelligence.analyzer import analyze_names_batch

        voters = analyze_names_batch(names)
        for item in voters:
            voter = (
                db.query(Voter)
                .filter(Voter.first_name == item["name"].split(" ", 1)[0])
                .first()
            )
            if voter:
                voter.raw_data = {**(voter.raw_data or {}), "metrics_profile": item}
        db.commit()
        return {"voters": voters}
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        logger.error("analyze/voters failed: %s", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/predict", response_model=PredictiveScoreResponse)
async def predict(payload: PredictiveScoreRequest) -> PredictiveScoreResponse:
    try:
        if payload.name is not None or payload.support_score is not None:
            profile = gotv_predictor.predict_from_scores(
                payload.name or "Unknown",
                support_score=payload.support_score if payload.support_score is not None else 0.5,
                turnout_history=payload.turnout_history if payload.turnout_history is not None else 0.55,
            )
            return PredictiveScoreResponse(
                name=profile.name,
                category=profile.category.value,
                priority_score=profile.priority_score,
                optimal_channel=profile.optimal_channel.value,
                contact_frequency=profile.contact_frequency,
                messaging_frame=profile.messaging_frame,
                turnout_probability=profile.turnout_probability,
                persuasion_score=profile.persuasion_score,
                score=profile.turnout_probability,
                label=profile.category.value,
                threshold=payload.threshold,
            )
        features = payload.features or {}
        score = predict_probability(features)
        return PredictiveScoreResponse(
            score=score,
            label=predict_label(score, payload.threshold),
            threshold=payload.threshold,
        )
    except Exception as exc:  # noqa: BLE001
        logger.error("predict failed: %s", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/intel/gotv")
async def predict_gotv(
    request: GotvRequest | None = None,
    db: Session = Depends(get_db),
) -> dict:
    """Fast local GOTV batch classification (no per-voter OSINT loop)."""
    try:
        body = request or GotvRequest()
        if body.voters:
            profiles = gotv_predictor.classify_batch([v.model_dump() for v in body.voters])
            battle = gotv_battleplan(profiles)
            categories = {k.lower(): len(v) for k, v in (battle.get("segments") or {}).items()}
            return {
                "classified": len(profiles),
                "categories": {
                    "safe": categories.get("safe", 0),
                    "leaning": categories.get("leaning", 0),
                    "swing": categories.get("swing", 0),
                    "at_risk": categories.get("at_risk", 0),
                    "lost": categories.get("lost", 0),
                },
                "battle_plan": {
                    "field_ops": battle.get("resource_allocation", {}),
                    "channels": battle.get("resource_allocation", {}),
                    "top_swing": [
                        i for i in battle.get("top_priority", []) if i.get("category") == "SWING"
                    ][:20],
                    "top_priority": battle.get("top_priority", []),
                },
                "voters": [
                    {
                        "name": p.name,
                        "category": p.category.value,
                        "category_confidence": p.category_confidence,
                        "turnout_probability": p.turnout_probability,
                        "persuasion_score": p.persuasion_score,
                        "priority_score": p.priority_score,
                        "optimal_channel": p.optimal_channel.value,
                        "contact_frequency": p.contact_frequency,
                        "messaging_frame": p.messaging_frame,
                        "recommended_action": p.recommended_action,
                    }
                    for p in sorted(profiles, key=lambda x: x.priority_score, reverse=True)
                ],
            }

        if body.names:
            profiles = gotv_predictor.classify_batch([{"name": n, "support_score": 0.5} for n in body.names])
            battle = gotv_battleplan(profiles)
            return {"voters": [{"name": p.name, "category": p.category.value, "priority_score": p.priority_score} for p in profiles], "battleplan": battle}

        # No body / empty → classify entire DB
        return classify_db_voters(db, gotv_predictor)
    except Exception as exc:  # noqa: BLE001
        logger.error("gotv failed: %s", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/intel/compare")
async def compare_candidates(request: CompareRequest) -> dict:
    try:
        research = OppositionResearch(pipeline)
        result = await research.compare(
            request.name_a,
            request.name_b,
            request.location,
            request.jurisdiction,
        )
        return comparison_to_dict(result)
    except Exception as exc:  # noqa: BLE001
        logger.error("compare failed: %s", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/intel/alerts")
async def get_intel_alerts(severity: str | None = None) -> dict:
    try:
        return {
            "alerts": pipeline.get_alerts(severity),
            "summary": pipeline.alerts.summary(),
        }
    except Exception as exc:  # noqa: BLE001
        logger.error("alerts failed: %s", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/intel/network/{name}")
async def get_network_cluster(name: str, depth: int = 2) -> dict:
    try:
        cluster = pipeline.get_network_cluster(name, depth)
        centrality = pipeline.network.compute_centrality()
        return {
            **cluster,
            "hubs": pipeline.get_hubs(),
            "centrality": centrality,
            "summary": pipeline.get_network_summary(),
        }
    except Exception as exc:  # noqa: BLE001
        logger.error("network failed: %s", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/intel/timeline/{name}")
async def get_intel_timeline(name: str) -> dict:
    try:
        return {"timeline": pipeline.get_timeline(name)}
    except Exception as exc:  # noqa: BLE001
        logger.error("timeline failed: %s", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/intel/briefing/{name}")
async def get_briefing(name: str) -> dict:
    try:
        if not pipeline.get_profile(name):
            await pipeline.enrich([name])
        return pipeline.generate_briefing(name)
    except Exception as exc:  # noqa: BLE001
        logger.error("briefing failed: %s", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/intel/briefing/{name}/pdf")
async def get_briefing_pdf(name: str, classification: str = "CONFIDENTIAL") -> StreamingResponse:
    try:
        profile = pipeline.get_profile(name)
        if not profile:
            profiles = await pipeline.enrich([name])
            profile = profiles[0] if profiles else None
        if not profile:
            raise HTTPException(status_code=404, detail=f"No intelligence found for '{name}'")

        briefing = pipeline.generate_briefing(name)
        pdf_bytes = generate_briefing_pdf(name, briefing, pipeline, classification=classification)
        date_stamp = datetime.now(UTC).strftime("%Y%m%d")
        safe_name = "".join(ch if ch.isascii() and (ch.isalnum() or ch in "-_") else "_" for ch in name).strip("_") or "subject"
        filename = f"briefing-{safe_name}-{date_stamp}.pdf"
        return StreamingResponse(
            iter([pdf_bytes]),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "X-Classification": classification,
                "Content-Length": str(len(pdf_bytes)),
            },
        )
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        logger.error("pdf failed: %s", traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {exc}") from exc


@app.get("/dispatch/queue/stats")
async def dispatch_queue_stats() -> dict:
    return get_dispatch_queue_stats()


@app.post("/dispatch", response_model=DispatchResponse)
async def dispatch_message(payload: DispatchRequest) -> DispatchResponse:
    try:
        templates = {
            "civic_duty": "היום יום הבחירות — הצבעתך חשובה לדמוקרטיה המקומית.",
            "community_pride": "הקהילה שלנו צריכה אותך בקלפי — בוא להיות חלק מהשינוי.",
            "fear_of_loss": "כל קול קובע. בלי ההשתתפות שלך — הקול שלנו עלול להיחלש.",
            "personal_benefit": "יש לך הזדמנות להשפיע על השירותים והעתיד בשכונה שלך.",
        }
        template_key = (payload.message_template or "civic_duty").strip()
        message = (
            (payload.custom_message or "").strip()
            or (payload.message or "").strip()
            or templates.get(template_key, "")
            or templates["civic_duty"]
        )
        message_id = f"MSG-{int(datetime.now(UTC).timestamp() * 1000)}-{secrets.token_hex(3)}"
        channel = (payload.channel or "WhatsApp").strip() or "WhatsApp"
        queued_at = datetime.now(UTC).isoformat()
        record = {
            "message_id": message_id,
            "channel": channel,
            "message": message,
            "voter_id": payload.voter_id or "",
            "voter_name": payload.voter_name or "",
            "priority": payload.priority or 50,
            "queued_at": queued_at,
            "status": "queued",
        }
        try:
            enqueue_dispatch_record(record)
        except Exception as exc:  # noqa: BLE001
            logger.debug("Redis enqueue failed, accepting locally: %s", exc)
        return DispatchResponse(
            status="queued",
            message_id=message_id,
            task_id=message_id,
            channel=channel,
            voter_id=payload.voter_id,
            voter_name=payload.voter_name,
            queued_at=datetime.fromisoformat(queued_at),
        )
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        logger.error("dispatch failed: %s", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/pipeline/run")
async def run_pipeline(db: Session = Depends(get_db)) -> dict:
    """Classify all voters in DB and return battle plan."""
    try:
        return classify_db_voters(db, gotv_predictor)
    except Exception as exc:  # noqa: BLE001
        logger.error("pipeline/run failed: %s", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(exc)) from exc
