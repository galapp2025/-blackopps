from datetime import datetime
from enum import StrEnum

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class EnrichmentStatus(StrEnum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class Voter(Base):
    __tablename__ = "voters"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    national_id: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    first_name: Mapped[str] = mapped_column(String(100))
    last_name: Mapped[str] = mapped_column(String(100))
    city: Mapped[str | None] = mapped_column(String(120), nullable=True)
    neighborhood: Mapped[str | None] = mapped_column(String(120), nullable=True)
    age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    gender: Mapped[str | None] = mapped_column(String(20), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    raw_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    turnout_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    support_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    enrichments: Mapped[list["Enrichment"]] = relationship(back_populates="voter", cascade="all, delete-orphan")


class Enrichment(Base):
    __tablename__ = "enrichments"
    __table_args__ = (UniqueConstraint("voter_id", "agent_key", name="uq_voter_agent"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    voter_id: Mapped[int] = mapped_column(ForeignKey("voters.id", ondelete="CASCADE"), index=True)
    agent_key: Mapped[str] = mapped_column(String(64), index=True)
    status: Mapped[str] = mapped_column(String(20), default=EnrichmentStatus.PENDING.value)
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    payload: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    voter: Mapped[Voter] = relationship(back_populates="enrichments")
