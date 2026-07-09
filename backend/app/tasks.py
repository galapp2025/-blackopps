from __future__ import annotations

from datetime import UTC, datetime
from typing import Any, Callable

from celery import Celery
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import SessionLocal
from app.models import Enrichment, EnrichmentStatus, Voter
from app.predictive import predict_probability

settings = get_settings()

celery_app = Celery(
    "election_enrichment",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
)
celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="Asia/Jerusalem",
    enable_utc=True,
    task_track_started=True,
)


ENRICHMENT_AGENTS: dict[str, str] = {
    "demographics": "Demographics normalization",
    "geography": "City and neighborhood mapping",
    "contact_validation": "Phone and email validation",
    "address_standardization": "Address standardization",
    "age_segmentation": "Age cohort segmentation",
    "gender_inference": "Gender signal enrichment",
    "language_preference": "Language preference detection",
    "household_clustering": "Household clustering",
    "polling_station": "Polling station assignment",
    "historical_turnout": "Historical turnout lookup",
    "party_affinity": "Party affinity estimation",
    "issue_priorities": "Issue priority scoring",
    "social_engagement": "Social engagement index",
    "donation_propensity": "Donation propensity",
    "volunteer_propensity": "Volunteer propensity",
    "persuadability": "Persuadability scoring",
    "mobilization_risk": "Mobilization risk",
    "contact_window": "Best contact window",
    "channel_preference": "Preferred outreach channel",
    "message_tone": "Recommended message tone",
    "event_proximity": "Nearby event proximity",
    "peer_influence": "Peer influence graph",
    "sentiment_signal": "Public sentiment signal",
    "predictive_turnout": "Predictive turnout score",
}


def _with_enrichment(agent_key: str, handler: Callable[[Voter], dict[str, Any]]) -> Callable[[int], dict[str, Any]]:
    def task(voter_id: int) -> dict[str, Any]:
        db = SessionLocal()
        try:
            voter = db.get(Voter, voter_id)
            if voter is None:
                return {"status": "failed", "error": "voter_not_found"}

            enrichment = (
                db.query(Enrichment)
                .filter(Enrichment.voter_id == voter_id, Enrichment.agent_key == agent_key)
                .one_or_none()
            )
            if enrichment is None:
                enrichment = Enrichment(voter_id=voter_id, agent_key=agent_key)
                db.add(enrichment)

            enrichment.status = EnrichmentStatus.RUNNING.value
            enrichment.started_at = datetime.now(UTC)
            enrichment.error_message = None
            db.commit()

            try:
                payload = handler(voter)
                enrichment.status = EnrichmentStatus.COMPLETED.value
                enrichment.payload = payload
                enrichment.confidence = float(payload.get("confidence", 0.75))
                enrichment.completed_at = datetime.now(UTC)

                if agent_key == "predictive_turnout":
                    voter.turnout_score = float(payload.get("turnout_score", 0.0))
                if agent_key == "party_affinity":
                    voter.support_score = float(payload.get("support_score", 0.0))

                db.commit()
                return {"status": "completed", "agent_key": agent_key, "payload": payload}
            except Exception as exc:  # noqa: BLE001
                enrichment.status = EnrichmentStatus.FAILED.value
                enrichment.error_message = str(exc)
                enrichment.completed_at = datetime.now(UTC)
                db.commit()
                return {"status": "failed", "agent_key": agent_key, "error": str(exc)}
        finally:
            db.close()

    return task


def _base_payload(voter: Voter, **extra: Any) -> dict[str, Any]:
    return {
        "voter_id": voter.id,
        "national_id": voter.national_id,
        "confidence": extra.pop("confidence", 0.8),
        **extra,
    }


@celery_app.task(name="enrichment.demographics")
def enrich_demographics(voter_id: int) -> dict[str, Any]:
    return _with_enrichment(
        "demographics",
        lambda voter: _base_payload(
            voter,
            full_name=f"{voter.first_name} {voter.last_name}",
            age_group=_age_group(voter.age),
        ),
    )(voter_id)


@celery_app.task(name="enrichment.geography")
def enrich_geography(voter_id: int) -> dict[str, Any]:
    return _with_enrichment(
        "geography",
        lambda voter: _base_payload(voter, city=voter.city, neighborhood=voter.neighborhood, region=_region(voter.city)),
    )(voter_id)


@celery_app.task(name="enrichment.contact_validation")
def enrich_contact_validation(voter_id: int) -> dict[str, Any]:
    return _with_enrichment(
        "contact_validation",
        lambda voter: _base_payload(
            voter,
            phone_valid=bool(voter.phone and len(voter.phone) >= 9),
            email_valid=bool(voter.email and "@" in voter.email),
        ),
    )(voter_id)


@celery_app.task(name="enrichment.address_standardization")
def enrich_address_standardization(voter_id: int) -> dict[str, Any]:
    return _with_enrichment(
        "address_standardization",
        lambda voter: _base_payload(voter, standardized_city=(voter.city or "").strip().title()),
    )(voter_id)


@celery_app.task(name="enrichment.age_segmentation")
def enrich_age_segmentation(voter_id: int) -> dict[str, Any]:
    return _with_enrichment(
        "age_segmentation",
        lambda voter: _base_payload(voter, segment=_age_group(voter.age)),
    )(voter_id)


@celery_app.task(name="enrichment.gender_inference")
def enrich_gender_inference(voter_id: int) -> dict[str, Any]:
    return _with_enrichment(
        "gender_inference",
        lambda voter: _base_payload(voter, gender=voter.gender or "unknown"),
    )(voter_id)


@celery_app.task(name="enrichment.language_preference")
def enrich_language_preference(voter_id: int) -> dict[str, Any]:
    return _with_enrichment(
        "language_preference",
        lambda voter: _base_payload(voter, language="he"),
    )(voter_id)


@celery_app.task(name="enrichment.household_clustering")
def enrich_household_clustering(voter_id: int) -> dict[str, Any]:
    return _with_enrichment(
        "household_clustering",
        lambda voter: _base_payload(voter, household_key=f"{voter.city}:{voter.last_name}"),
    )(voter_id)


@celery_app.task(name="enrichment.polling_station")
def enrich_polling_station(voter_id: int) -> dict[str, Any]:
    return _with_enrichment(
        "polling_station",
        lambda voter: _base_payload(voter, station_code=f"PS-{(voter.city or 'UNK')[:3].upper()}"),
    )(voter_id)


@celery_app.task(name="enrichment.historical_turnout")
def enrich_historical_turnout(voter_id: int) -> dict[str, Any]:
    return _with_enrichment(
        "historical_turnout",
        lambda voter: _base_payload(voter, prior_turnout_rate=0.62 if (voter.age or 0) > 45 else 0.48),
    )(voter_id)


@celery_app.task(name="enrichment.party_affinity")
def enrich_party_affinity(voter_id: int) -> dict[str, Any]:
    return _with_enrichment(
        "party_affinity",
        lambda voter: _base_payload(
            voter,
            support_score=0.55,
            leading_issue="economy",
        ),
    )(voter_id)


@celery_app.task(name="enrichment.issue_priorities")
def enrich_issue_priorities(voter_id: int) -> dict[str, Any]:
    return _with_enrichment(
        "issue_priorities",
        lambda voter: _base_payload(voter, priorities=["security", "cost_of_living", "education"]),
    )(voter_id)


@celery_app.task(name="enrichment.social_engagement")
def enrich_social_engagement(voter_id: int) -> dict[str, Any]:
    return _with_enrichment(
        "social_engagement",
        lambda voter: _base_payload(voter, engagement_index=0.42),
    )(voter_id)


@celery_app.task(name="enrichment.donation_propensity")
def enrich_donation_propensity(voter_id: int) -> dict[str, Any]:
    return _with_enrichment(
        "donation_propensity",
        lambda voter: _base_payload(voter, donation_score=0.31),
    )(voter_id)


@celery_app.task(name="enrichment.volunteer_propensity")
def enrich_volunteer_propensity(voter_id: int) -> dict[str, Any]:
    return _with_enrichment(
        "volunteer_propensity",
        lambda voter: _base_payload(voter, volunteer_score=0.27),
    )(voter_id)


@celery_app.task(name="enrichment.persuadability")
def enrich_persuadability(voter_id: int) -> dict[str, Any]:
    return _with_enrichment(
        "persuadability",
        lambda voter: _base_payload(voter, persuadability_score=0.58),
    )(voter_id)


@celery_app.task(name="enrichment.mobilization_risk")
def enrich_mobilization_risk(voter_id: int) -> dict[str, Any]:
    return _with_enrichment(
        "mobilization_risk",
        lambda voter: _base_payload(voter, risk_level="medium"),
    )(voter_id)


@celery_app.task(name="enrichment.contact_window")
def enrich_contact_window(voter_id: int) -> dict[str, Any]:
    return _with_enrichment(
        "contact_window",
        lambda voter: _base_payload(voter, best_hours=["18:00", "20:30"]),
    )(voter_id)


@celery_app.task(name="enrichment.channel_preference")
def enrich_channel_preference(voter_id: int) -> dict[str, Any]:
    return _with_enrichment(
        "channel_preference",
        lambda voter: _base_payload(voter, channel="whatsapp" if voter.phone else "email"),
    )(voter_id)


@celery_app.task(name="enrichment.message_tone")
def enrich_message_tone(voter_id: int) -> dict[str, Any]:
    return _with_enrichment(
        "message_tone",
        lambda voter: _base_payload(voter, tone="pragmatic"),
    )(voter_id)


@celery_app.task(name="enrichment.event_proximity")
def enrich_event_proximity(voter_id: int) -> dict[str, Any]:
    return _with_enrichment(
        "event_proximity",
        lambda voter: _base_payload(voter, nearby_events=1),
    )(voter_id)


@celery_app.task(name="enrichment.peer_influence")
def enrich_peer_influence(voter_id: int) -> dict[str, Any]:
    return _with_enrichment(
        "peer_influence",
        lambda voter: _base_payload(voter, influence_score=0.36),
    )(voter_id)


@celery_app.task(name="enrichment.sentiment_signal")
def enrich_sentiment_signal(voter_id: int) -> dict[str, Any]:
    return _with_enrichment(
        "sentiment_signal",
        lambda voter: _base_payload(voter, sentiment="neutral"),
    )(voter_id)


@celery_app.task(name="enrichment.predictive_turnout")
def enrich_predictive_turnout(voter_id: int) -> dict[str, Any]:
    return _with_enrichment(
        "predictive_turnout",
        lambda voter: _base_payload(
            voter,
            turnout_score=predict_probability(
                {
                    "age_normalized": min((voter.age or 35) / 100, 1.0),
                    "city_turnout_history": 0.6,
                    "contactability": 0.7 if voter.phone else 0.3,
                    "past_support_signal": 0.5,
                    "engagement_index": 0.4,
                }
            ),
        ),
    )(voter_id)


AGENT_TASKS: dict[str, Any] = {
    "demographics": enrich_demographics,
    "geography": enrich_geography,
    "contact_validation": enrich_contact_validation,
    "address_standardization": enrich_address_standardization,
    "age_segmentation": enrich_age_segmentation,
    "gender_inference": enrich_gender_inference,
    "language_preference": enrich_language_preference,
    "household_clustering": enrich_household_clustering,
    "polling_station": enrich_polling_station,
    "historical_turnout": enrich_historical_turnout,
    "party_affinity": enrich_party_affinity,
    "issue_priorities": enrich_issue_priorities,
    "social_engagement": enrich_social_engagement,
    "donation_propensity": enrich_donation_propensity,
    "volunteer_propensity": enrich_volunteer_propensity,
    "persuadability": enrich_persuadability,
    "mobilization_risk": enrich_mobilization_risk,
    "contact_window": enrich_contact_window,
    "channel_preference": enrich_channel_preference,
    "message_tone": enrich_message_tone,
    "event_proximity": enrich_event_proximity,
    "peer_influence": enrich_peer_influence,
    "sentiment_signal": enrich_sentiment_signal,
    "predictive_turnout": enrich_predictive_turnout,
}


def _age_group(age: int | None) -> str:
    if age is None:
        return "unknown"
    if age < 30:
        return "18-29"
    if age < 45:
        return "30-44"
    if age < 60:
        return "45-59"
    return "60+"


def _region(city: str | None) -> str:
    if not city:
        return "unknown"
    if city in {"תל אביב", "Tel Aviv", "חיפה", "Haifa"}:
        return "coastal"
    if city in {"ירושלים", "Jerusalem", "באר שבע", "Beer Sheva"}:
        return "inland"
    return "peripheral"


def dispatch_enrichment(voter_id: int, agent_keys: list[str] | None = None) -> list[str]:
    keys = agent_keys or list(AGENT_TASKS.keys())
    task_ids: list[str] = []
    for key in keys:
        task = AGENT_TASKS.get(key)
        if task is None:
            continue
        async_result = task.delay(voter_id)
        task_ids.append(async_result.id)
    return task_ids


def ensure_enrichment_rows(db: Session, voter_id: int, agent_keys: list[str] | None = None) -> None:
    keys = agent_keys or list(AGENT_TASKS.keys())
    existing = {
        row.agent_key
        for row in db.query(Enrichment).filter(Enrichment.voter_id == voter_id).all()
    }
    for key in keys:
        if key not in existing:
            db.add(Enrichment(voter_id=voter_id, agent_key=key, status=EnrichmentStatus.PENDING.value))
    db.commit()
