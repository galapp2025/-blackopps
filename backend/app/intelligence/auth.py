"""
API Authentication & Rate Limiting Middleware for BlackOpps FastAPI.

- X-API-Key validation (constant-time)
- Rate limiting per API key (100/min) and IP (30/min)
- Security headers

Starlette BaseHTTPMiddleware wrappers so FastAPI `app.add_middleware(...)` works.
"""

from __future__ import annotations

import hashlib
import hmac
import logging
import os
import time
from typing import Callable, Optional

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

logger = logging.getLogger(__name__)

PUBLIC_PATHS = {"/health", "/docs", "/openapi.json", "/redoc"}


def parse_api_keys(raw: str | None) -> dict[str, str]:
    """Parse BLACKOPPS_API_KEYS as key:campaign,key2:campaign2."""
    keys: dict[str, str] = {}
    if not raw:
        return keys
    for part in raw.split(","):
        part = part.strip()
        if not part:
            continue
        if ":" in part:
            key, campaign = part.split(":", 1)
            keys[key.strip()] = campaign.strip() or "default"
        else:
            keys[part] = "default"
    return keys


class AuthCore:
    """Validates X-API-Key against known keys (constant-time compare)."""

    def __init__(self, api_keys: dict[str, str] | None = None):
        self._keys: dict[str, str] = {}
        if api_keys is not None:
            self._keys = {k.strip(): v for k, v in api_keys.items()}
        else:
            self._keys = parse_api_keys(os.getenv("BLACKOPPS_API_KEYS"))

    def validate(self, api_key: str | None) -> bool:
        if not api_key:
            return False
        normalized = api_key.strip()
        for stored_key in self._keys:
            if hmac.compare_digest(normalized.encode(), stored_key.encode()):
                return True
        return False

    def get_client(self, api_key: str) -> Optional[str]:
        return self._keys.get(api_key.strip())

    def inject_security_headers(self, response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"
        return response

    @property
    def is_configured(self) -> bool:
        return len(self._keys) > 0

    def key_count(self) -> int:
        return len(self._keys)


# Backward-compatible name used by package __init__
AuthMiddlewareCore = AuthCore


class RateLimiter:
    """Token-bucket rate limiter (in-memory)."""

    def __init__(
        self,
        requests_per_minute: int = 100,
        ip_requests_per_minute: int = 30,
        burst_multiplier: float = 1.5,
        key_limit: int | None = None,
        ip_limit: int | None = None,
    ):
        self.rpm = key_limit if key_limit is not None else requests_per_minute
        self.ip_rpm = ip_limit if ip_limit is not None else ip_requests_per_minute
        # Aliases expected by older RateLimitMiddleware wiring
        self.key_limit = self.rpm
        self.ip_limit = self.ip_rpm
        self.burst = int(self.rpm * burst_multiplier)
        self.ip_burst = int(self.ip_rpm * burst_multiplier)
        self._buckets: dict[str, tuple[float, float]] = {}
        self._ip_buckets: dict[str, tuple[float, float]] = {}
        self._last_cleanup = time.time()
        self._cleanup_interval = 300

    async def check_request(self, request) -> bool:
        """Return True if allowed."""
        now = time.time()
        self._maybe_cleanup(now)
        client_ip = self._get_client_ip(request)
        api_key = request.headers.get("X-API-Key", "") or request.headers.get("x-api-key", "")

        if api_key:
            key_bucket = f"key:{self._hash_key(api_key)}"
            if not self._consume_token(key_bucket, self.rpm, self.burst, now):
                logger.warning("Rate limit hit for API key: %s...", self._hash_key(api_key)[:8])
                return False

        ip_bucket = f"ip:{client_ip}"
        if not self._consume_token(ip_bucket, self.ip_rpm, self.ip_burst, now):
            logger.warning("Rate limit hit for IP: %s", client_ip)
            return False
        return True

    def check(self, identity: str, limit: int) -> tuple[bool, int]:
        """Sync identity check used by RateLimitMiddleware."""
        now = time.time()
        store = self._ip_buckets if identity.startswith("ip:") else self._buckets
        max_tokens = float(limit)
        refill_rate = float(limit)
        if identity not in store:
            store[identity] = (max_tokens - 1, now)
            return True, 0
        tokens, last_refill = store[identity]
        elapsed = now - last_refill
        tokens = min(max_tokens, tokens + elapsed * (refill_rate / 60.0))
        if tokens >= 1:
            store[identity] = (tokens - 1, now)
            return True, 0
        store[identity] = (tokens, now)
        retry = max(1, int(60.0 / max(refill_rate, 1.0)))
        return False, retry

    def _consume_token(self, bucket_key: str, refill_rate: float, max_tokens: float, now: float) -> bool:
        store = self._ip_buckets if bucket_key.startswith("ip:") else self._buckets
        if bucket_key not in store:
            store[bucket_key] = (max_tokens - 1, now)
            return True
        tokens, last_refill = store[bucket_key]
        elapsed = now - last_refill
        tokens = min(max_tokens, tokens + elapsed * (refill_rate / 60.0))
        if tokens >= 1:
            store[bucket_key] = (tokens - 1, now)
            return True
        store[bucket_key] = (tokens, now)
        return False

    def _maybe_cleanup(self, now: float) -> None:
        if now - self._last_cleanup < self._cleanup_interval:
            return
        cutoff = now - 600
        for store in (self._buckets, self._ip_buckets):
            stale = [k for k, (_, ts) in store.items() if ts < cutoff]
            for k in stale:
                del store[k]
        self._last_cleanup = now

    @staticmethod
    def _get_client_ip(request) -> str:
        forwarded = request.headers.get("X-Forwarded-For", "")
        if forwarded:
            return forwarded.split(",")[0].strip()
        real_ip = request.headers.get("X-Real-IP", "")
        if real_ip:
            return real_ip
        if hasattr(request, "client") and request.client:
            return request.client.host
        return "unknown"

    @staticmethod
    def _hash_key(key: str) -> str:
        return hashlib.sha256(key.encode()).hexdigest()[:16]

    def stats(self) -> dict:
        return {
            "active_api_key_buckets": len(self._buckets),
            "active_ip_buckets": len(self._ip_buckets),
            "rpm_limit": self.rpm,
            "ip_rpm_limit": self.ip_rpm,
        }


class AuthMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, api_keys: dict[str, str] | None = None) -> None:
        super().__init__(app)
        self.core = AuthCore(api_keys)
        self.api_keys = self.core._keys
        self.auth_configured = self.core.is_configured
        if not self.auth_configured:
            logger.warning("Auth disabled — set BLACKOPPS_API_KEYS")

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        path = request.url.path
        if path in PUBLIC_PATHS or path.startswith("/docs"):
            return await call_next(request)

        if not self.auth_configured:
            request.state.campaign = "dev"
            request.state.api_key = None
            return await call_next(request)

        api_key = request.headers.get("X-API-Key") or request.headers.get("x-api-key")
        if not self.core.validate(api_key):
            logger.warning("Auth failure for %s %s", request.method, path)
            return JSONResponse(
                status_code=401,
                content={"error": "Unauthorized", "detail": "Missing or invalid X-API-Key"},
            )
        request.state.campaign = self.core.get_client(api_key or "") or "default"
        request.state.api_key = api_key
        return await call_next(request)


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, limiter: RateLimiter | None = None) -> None:
        super().__init__(app)
        self.limiter = limiter or RateLimiter()

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if request.url.path in PUBLIC_PATHS:
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        api_key = getattr(request.state, "api_key", None)

        ok_ip, retry_ip = self.limiter.check(f"ip:{client_ip}", self.limiter.ip_limit)
        if not ok_ip:
            return JSONResponse(
                status_code=429,
                content={"error": "Rate limit exceeded", "retry_after": retry_ip},
                headers={"Retry-After": str(retry_ip)},
            )

        if api_key:
            ok_key, retry_key = self.limiter.check(f"key:{api_key}", self.limiter.key_limit)
            if not ok_key:
                return JSONResponse(
                    status_code=429,
                    content={"error": "Rate limit exceeded", "retry_after": retry_key},
                    headers={"Retry-After": str(retry_key)},
                )

        return await call_next(request)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["X-BlackOpps-Version"] = "5.0.0"
        return response
