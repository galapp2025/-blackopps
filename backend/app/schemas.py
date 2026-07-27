from datetime import datetime
from enum import StrEnum
from typing import Any

from pydantic import AliasChoices, BaseModel, ConfigDict, Field


class EnrichmentStatus(StrEnum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class VoterBase(BaseModel):
    national_id: str | None = Field(default=None, max_length=20)
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    city: str | None = None
    neighborhood: str | None = None
    age: int | None = Field(default=None, ge=18, le=120)
    gender: str | None = None
    phone: str | None = None
    email: str | None = None
    support_score: float | None = None
    turnout_history: float | None = None
    notes: str | None = None
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
    support_score: float | None = None
    turnout_history: float | None = None
    notes: str | None = None
    raw_data: dict | None = None
    gotv_category: str | None = None
    gotv_priority: float | None = None
    gotv_channel: str | None = None
    gotv_frequency: str | None = None
    gotv_message: str | None = None


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
    turnout_score: float | None = None
    gotv_category: str | None = None
    gotv_priority: float | None = None
    gotv_channel: str | None = None
    gotv_frequency: str | None = None
    gotv_message: str | None = None
    enriched_at: datetime | None = None
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
    gotv_category: str | None = None
    gotv_priority: float | None = None


class VoterListResponse(BaseModel):
    total: int
    limit: int
    offset: int
    voters: list[VoterListItem]


class EnrichmentTriggerRequest(BaseModel):
    agent_keys: list[str] | None = None


class PredictiveScoreRequest(BaseModel):
    features: dict[str, float] | None = None
    name: str | None = None
    support_score: float | None = Field(default=None, ge=0.0, le=1.0)
    turnout_history: float | None = Field(default=None, ge=0.0, le=1.0)
    threshold: float = Field(default=0.5, ge=0.0, le=1.0)


class PredictiveScoreResponse(BaseModel):
    score: float | None = None
    label: str | None = None
    threshold: float | None = None
    name: str | None = None
    category: str | None = None
    priority_score: float | None = None
    optimal_channel: str | None = None
    contact_frequency: str | None = None
    messaging_frame: str | None = None
    turnout_probability: float | None = None
    persuasion_score: float | None = None


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str = "5.0.0"
    auth_configured: bool = False
    rate_limiter: str = "active"
    modules: list[str] = []


class VoterRecommendations(BaseModel):
    channel: str
    trigger: str
    avoid: str


class VoterOperational(BaseModel):
    flash_alert: str = Field(alias="flashAlert")
    actionable_message: str = Field(alias="actionableMessage")

    model_config = ConfigDict(populate_by_name=True)


class AnalyzedVoterProfile(BaseModel):
    id: str
    name: str
    metrics: dict[str, float | int]
    recommendations: VoterRecommendations
    operational: VoterOperational


class AnalyzeRequest(BaseModel):
    names: list[str] = Field(default_factory=list)
    voter_ids: list[int] | None = None
    location: str = ""
    jurisdiction: str = "il"
    keywords: list[str] | None = None


class GotvVoterItem(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    support_score: float | None = 0.5
    turnout_history: float | None = 0.55
    consistency: str | None = "sometimes"


class GotvRequest(BaseModel):
    names: list[str] | None = None
    voters: list[GotvVoterItem] | None = None


class CompareRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name_a: str = Field(validation_alias=AliasChoices("name_a", "candidate_a"))
    name_b: str = Field(validation_alias=AliasChoices("name_b", "candidate_b"))
    location: str = ""
    jurisdiction: str = "il"


class AnalyzeResponse(BaseModel):
    voters: list[AnalyzedVoterProfile]


class DispatchRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    voter_id: str | None = Field(default=None, validation_alias=AliasChoices("voter_id", "voterId"))
    voter_name: str | None = Field(default=None, validation_alias=AliasChoices("voter_name", "voterName"))
    channel: str | None = None
    priority: int | None = 5
    message: str = ""
    message_template: str | None = None


class DispatchResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    status: str
    message_id: str = Field(serialization_alias="messageId")
    task_id: str | None = None
    channel: str
    voter_id: str | None = Field(default=None, serialization_alias="voterId")
    voter_name: str | None = Field(default=None, serialization_alias="voterName")
    queued_at: datetime = Field(serialization_alias="queuedAt")
