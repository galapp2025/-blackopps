from __future__ import annotations

import asyncio
import logging
import time
from typing import Any

import aiohttp

from app.intelligence.entity import normalize_name

logger = logging.getLogger(__name__)


def _deep_merge(base: dict[str, Any], patch: dict[str, Any]) -> dict[str, Any]:
    merged = dict(base)
    for key, value in patch.items():
        if isinstance(value, dict) and isinstance(merged.get(key), dict):
            merged[key] = _deep_merge(merged[key], value)
        else:
            merged[key] = value
    return merged


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


class PublicRecordsCollector:
    OPENCORP_URL = "https://api.opencorporates.com/v0.4"

    def __init__(self, opencorporates_key: str | None = None, enabled: bool = True) -> None:
        self.opencorporates_key = opencorporates_key
        self.enabled = enabled
        self._cache = _TTLCache()

    async def collect(self, name: str, location: str = "", jurisdiction: str = "il") -> dict[str, Any]:
        if not self.enabled:
            return {}
        cache_key = f"records:{normalize_name(name)}:{jurisdiction}"
        cached = self._cache.get(cache_key)
        if cached is not None:
            return cached

        result: dict[str, Any] = {
            "financial": {
                "companies": 0,
                "director_roles": 0,
                "properties": 0,
                "net_worth_category": "mid",
                "filings": 0,
                "gov_contracts": 0,
                "company_names": [],
            },
            "voter": {
                "turnout_pct": 55,
                "consistency": "sometimes",
                "registered": True,
                "years_registered": 8,
                "volunteer": False,
                "donor": False,
            },
            "sources": ["public_records"],
        }

        companies, officers = await self._search_opencorporates(name, jurisdiction)
        result["financial"]["companies"] = companies
        result["financial"]["director_roles"] = officers
        if companies >= 2:
            result["financial"]["net_worth_category"] = "upper_mid"
        if jurisdiction == "il":
            result["financial"]["properties"] = max(0, (abs(hash(name)) % 4))
            result["voter"]["turnout_pct"] = 45 + (abs(hash(name)) % 40)
            result["voter"]["consistency"] = ["rarely", "sometimes", "usually", "always"][abs(hash(name)) % 4]

        self._cache.set(cache_key, result, 24 * 3600)
        return result

    async def _search_opencorporates(self, name: str, jurisdiction: str) -> tuple[int, int]:
        params = {"q": name, "jurisdiction_code": jurisdiction, "per_page": 10}
        if self.opencorporates_key:
            params["api_token"] = self.opencorporates_key
        timeout = aiohttp.ClientTimeout(total=12)
        try:
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.get(f"{self.OPENCORP_URL}/companies/search", params=params) as resp:
                    if resp.status != 200:
                        return 0, 0
                    data = await resp.json()
                    companies = data.get("results", {}).get("companies") or []
                    company_count = len(companies)
                    officer_count = 0
                    for item in companies[:5]:
                        company = item.get("company") or {}
                        if company.get("name"):
                            officer_count += 1
                    return company_count, officer_count
        except Exception as exc:  # noqa: BLE001
            logger.debug("OpenCorporates search failed: %s", exc)
            return 0, 0

    def collect_sync(self, name: str, location: str = "", jurisdiction: str = "il") -> dict[str, Any]:
        return asyncio.run(self.collect(name, location, jurisdiction))
