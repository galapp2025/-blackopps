from __future__ import annotations

import asyncio
import hashlib
import re
import time
from typing import Any
from urllib.parse import quote_plus

import aiohttp

from app.intelligence.entity import normalize_name

DEFAULT_CACHE_TTL = 86400


class _TTLCache:
    def __init__(self) -> None:
        self._store: dict[str, tuple[float, Any]] = {}

    def get(self, key: str) -> Any | None:
        item = self._store.get(key)
        if not item:
            return None
        expires, value = item
        if time.time() > expires:
            self._store.pop(key, None)
            return None
        return value

    def set(self, key: str, value: Any, ttl: int) -> None:
        self._store[key] = (time.time() + ttl, value)


class OpenSanctionsCollector:
    BASE_URL = "https://api.opensanctions.org/match/default"

    def __init__(self, api_key: str | None = None, enabled: bool = True) -> None:
        self.api_key = api_key
        self.enabled = enabled
        self._cache = _TTLCache()

    async def collect(self, name: str, location: str = "", jurisdiction: str = "il") -> dict[str, Any]:
        if not self.enabled:
            return {}
        cache_key = f"os:{normalize_name(name)}:{jurisdiction}"
        cached = self._cache.get(cache_key)
        if cached is not None:
            return cached

        result: dict[str, Any] = {
            "political": {
                "is_pep": False,
                "pep_confirmed": False,
                "sanctions_count": 0,
                "sanctions_lists": [],
                "political_roles": [],
                "contributions_usd": 0,
                "party_affiliation": False,
                "party_leadership": False,
            },
            "connections": [],
            "sources": ["opensanctions"],
        }
        try:
            payload = {"queries": {"q1": {"schema": "Person", "properties": {"name": [name]}}}}
            headers = {"Authorization": f"ApiKey {self.api_key}"} if self.api_key else {}
            timeout = aiohttp.ClientTimeout(total=12)
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.post(self.BASE_URL, json=payload, headers=headers) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        matches = data.get("responses", {}).get("q1", {}).get("results", [])
                        for match in matches[:5]:
                            props = match.get("properties", {})
                            topics = props.get("topics") or []
                            if any("pep" in str(t).lower() for t in topics):
                                result["political"]["is_pep"] = True
                                result["political"]["pep_confirmed"] = True
                            if any("sanction" in str(t).lower() for t in topics):
                                result["political"]["sanctions_count"] += 1
                                result["political"]["sanctions_lists"].append(match.get("caption") or "sanctions")
                            for pos in props.get("position") or []:
                                result["political"]["political_roles"].append({"organization": pos})
        except Exception:
            # Graceful degradation — heuristic PEP flag from public figure keywords
            if any(k in name.lower() for k in ("minister", "mayor", "ח\"כ", "שר", "ראש עיר")):
                result["political"]["is_pep"] = True

        self._cache.set(cache_key, result, DEFAULT_CACHE_TTL)
        return result

    def collect_sync(self, name: str, location: str = "", jurisdiction: str = "il") -> dict[str, Any]:
        return asyncio.run(self.collect(name, location, jurisdiction))
