"""BlackOpps auth, rate limiting, and security headers middleware."""

from __future__ import annotations

import logging
import os
import time
from collections import defaultdict, deque
from typing import Callable

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


class RateLimiter:
    """Sliding-window rate limiter: 100/min per API key, 30/min per IP."""

    def __init__(self, key_limit: int = 100, ip_limit: int = 30, window: float = 60.0) -> None:
        self.key_limit = key_limit
        self.ip_limit = ip_limit
        self.window = window
        self._buckets: dict[str, deque[float]] = defaultdict(deque)

    def _prune(self, bucket: deque[float], now: float) -> None:
        while bucket and now - bucket[0] > self.window:
            bucket.popleft()

    def check(self, identity: str, limit: int) -> tuple[bool, int]:
        now = time.monotonic()
        bucket = self._buckets[identity]
        self._prune(bucket, now)
        if len(bucket) >= limit:
            retry = int(self.window - (now - bucket[0])) + 1
            return False, max(1, retry)
        bucket.append(now)
        return True, 0


class AuthMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, api_keys: dict[str, str] | None = None) -> None:
        super().__init__(app)
        self.api_keys = api_keys if api_keys is not None else parse_api_keys(os.getenv("BLACKOPPS_API_KEYS"))
        self.auth_configured = bool(self.api_keys)
        if not self.auth_configured:
            logger.warning("⚠️ Auth disabled — set BLACKOPPS_API_KEYS")

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        path = request.url.path
        if path in PUBLIC_PATHS or path.startswith("/docs"):
            return await call_next(request)

        if not self.auth_configured:
            request.state.campaign = "dev"
            request.state.api_key = None
            return await call_next(request)

        api_key = request.headers.get("X-API-Key") or request.headers.get("x-api-key")
        if not api_key or api_key not in self.api_keys:
            logger.warning("Auth failure for %s %s", request.method, path)
            return JSONResponse(
                status_code=401,
                content={"error": "Unauthorized", "detail": "Missing or invalid X-API-Key"},
            )
        request.state.campaign = self.api_keys[api_key]
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
        response.headers["X-BlackOpps-Version"] = "5.0.0"
        return response
