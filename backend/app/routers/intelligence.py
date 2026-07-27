from __future__ import annotations

import logging
import secrets
from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException, status

from app.config import get_settings
from app.dispatch_queue import DISPATCH_QUEUE_KEY, get_redis_client
from app.schemas import (
    AnalyzeRequest,
    AnalyzeResponse,
    DispatchRequest,
    DispatchResponse,
)

logger = logging.getLogger("blackopps.intelligence")

router = APIRouter(tags=["intelligence"])


def _analyze_sync(names: list[str]) -> list[dict]:
    from app.intelligence.analyzer import analyze_names_batch

    return analyze_names_batch(names)


def _dispatch_sync(
    *,
    message_id: str,
    channel: str,
    message: str,
    voter_id: str | None,
    voter_name: str | None,
    queued_at: str,
) -> dict:
    record = {
        "message_id": message_id,
        "channel": channel,
        "message": message,
        "voter_id": voter_id or "",
        "voter_name": voter_name or "",
        "queued_at": queued_at,
        "status": "queued",
    }
    try:
        from app.dispatch_queue import enqueue_dispatch_record

        enqueue_dispatch_record(record)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Dispatch queue unavailable (%s); accepting message without Redis", exc)
    return record


@router.get("/dispatch/queue/stats")
def dispatch_queue_stats() -> dict[str, str | int]:
    settings = get_settings()
    queue_key = settings.dispatch_redis_queue_key or DISPATCH_QUEUE_KEY
    try:
        client = get_redis_client()
        length = int(client.llen(queue_key))
    except Exception as exc:  # noqa: BLE001
        logger.warning("Redis queue stats unavailable: %s", exc)
        length = -1
    return {"queue": queue_key, "length": length}


@router.post("/analyze/voters", response_model=AnalyzeResponse)
def analyze_voters_legacy(payload: AnalyzeRequest) -> AnalyzeResponse:
    names = [n.strip() for n in payload.names if n.strip()]
    if not names:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No names provided")

    settings = get_settings()
    if settings.intelligence_sync_fallback:
        voters = _analyze_sync(names)
    else:
        from app.tasks import celery_analyze_batch

        try:
            async_result = celery_analyze_batch.apply_async(args=[names])
            voters = async_result.get(timeout=settings.analyze_task_timeout_seconds)
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Celery broker unavailable — start Redis and the celery_worker service.",
            ) from exc

    if not voters:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Empty analysis result")

    return AnalyzeResponse(voters=voters)


@router.post("/dispatch", response_model=DispatchResponse)
def dispatch_message(payload: DispatchRequest) -> DispatchResponse:
    message = payload.message.strip()
    if not message:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing message")

    message_id = f"MSG-{int(datetime.now(UTC).timestamp() * 1000)}-{secrets.token_hex(3)}"
    channel = (payload.channel or "WhatsApp").strip() or "WhatsApp"
    queued_at = datetime.now(UTC).isoformat()

    settings = get_settings()
    if settings.intelligence_sync_fallback:
        record = _dispatch_sync(
            message_id=message_id,
            channel=channel,
            message=message,
            voter_id=payload.voter_id,
            voter_name=payload.voter_name,
            queued_at=queued_at,
        )
    else:
        from app.tasks import celery_enqueue_dispatch

        try:
            async_result = celery_enqueue_dispatch.apply_async(
                kwargs={
                    "message_id": message_id,
                    "channel": channel,
                    "message": message,
                    "voter_id": payload.voter_id,
                    "voter_name": payload.voter_name,
                    "queued_at": queued_at,
                }
            )
            record = async_result.get(timeout=settings.dispatch_task_timeout_seconds)
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Celery broker unavailable — start Redis and the celery_worker service.",
            ) from exc

    if not record or record.get("status") != "queued":
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to enqueue dispatch")

    return DispatchResponse(
        status="queued",
        message_id=message_id,
        channel=channel,
        voter_id=payload.voter_id,
        voter_name=payload.voter_name,
        queued_at=datetime.fromisoformat(record["queued_at"]),
    )
