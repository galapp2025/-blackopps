from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field


class EnrichmentStatus(StrEnum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class VoterBase(BaseModel):
    national_id: str = Field(min_length=5, max_length=20)
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    city: str | None = None
    neighborhood: str | None = None
    age: int | None = Field(default=None, ge=18, le=120)
    gender: str | None = None
    phone: str | None = None
    email: str | None = None
    raw_data: dict | None = None


class VoterCreate(VoterBase):
    pass


class VoterUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    city: str | None = None
    neighborhood: str | None = None
    age: int | None = Field(default=None, ge=18, le=120)
    gender: str | None = None
    phone: str | None = None
    email: str | None = None
    raw_data: dict | None = None


class EnrichmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    agent_key: str
    status: EnrichmentStatus
    confidence: float | None
    payload: dict | None
    error_message: str | None
    started_at: datetime | None
    completed_at: datetime | None


class VoterRead(VoterBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    turnout_score: float | None
    support_score: float | None
    created_at: datetime
    updated_at: datetime
    enrichments: list[EnrichmentRead] = []


class VoterListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    national_id: str
    first_name: str
    last_name: str
    city: str | None
    turnout_score: float | None
    support_score: float | None


class EnrichmentTriggerRequest(BaseModel):
    agent_keys: list[str] | None = None


class PredictiveScoreRequest(BaseModel):
    features: dict[str, float]
    threshold: float = Field(default=0.5, ge=0.0, le=1.0)


class PredictiveScoreResponse(BaseModel):
    score: float
    label: str
    threshold: float


class HealthResponse(BaseModel):
    status: str
    service: str
