from __future__ import annotations

import json
import logging
from datetime import UTC, datetime
from typing import Any

import redis

from app.config import get_settings

logger = logging.getLogger(__name__)

DISPATCH_QUEUE_KEY = "blackopps:dispatch:queue"


def get_redis_client() -> redis.Redis:
    settings = get_settings()
    return redis.from_url(settings.redis_url, decode_responses=True)


def enqueue_dispatch_record(record: dict[str, Any]) -> str:
    """Push outbound message metadata to the Redis dispatch list."""
    client = get_redis_client()
    message_id = str(record["message_id"])
    queued_at = record.get("queued_at") or datetime.now(UTC).isoformat()
    payload = {**record, "queued_at": queued_at}
    client.lpush(DISPATCH_QUEUE_KEY, json.dumps(payload, ensure_ascii=False))
    client.hset(f"blackopps:dispatch:{message_id}", mapping={k: str(v) for k, v in payload.items()})
    return message_id


def get_dispatch_queue_stats() -> dict[str, Any]:
    """Return queue depth and status counters from Redis (or local zeros)."""
    try:
        client = get_redis_client()
        queued = int(client.llen(DISPATCH_QUEUE_KEY))
        completed = int(client.get("blackopps:dispatch:completed") or 0)
        failed = int(client.get("blackopps:dispatch:failed") or 0)
        in_progress = int(client.get("blackopps:dispatch:in_progress") or 0)
        return {
            "queued": queued,
            "in_progress": in_progress,
            "completed": completed,
            "failed": failed,
            "agents_active": 1 if queued or in_progress else 0,
            "channels_used": ["WhatsApp", "SMS", "Phone", "door_knock"],
            "queue_key": DISPATCH_QUEUE_KEY,
        }
    except Exception as exc:  # noqa: BLE001
        logger.debug("Dispatch stats unavailable: %s", exc)
        return {
            "queued": 0,
            "in_progress": 0,
            "completed": 0,
            "failed": 0,
            "agents_active": 0,
            "channels_used": [],
            "queue_key": DISPATCH_QUEUE_KEY,
            "offline": True,
        }
