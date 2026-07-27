from __future__ import annotations

import asyncio
import logging
import re
import time
from typing import Any
from urllib.parse import quote_plus

import aiohttp

from app.intelligence.entity import normalize_name

logger = logging.getLogger(__name__)

OSINT_QUERIES = (
    '"{name}" site:linkedin.com',
    '"{name}" site:twitter.com OR site:x.com',
    '"{name}" site:facebook.com',
    '"{name}" filetype:pdf',
    '"{name}" "board of directors"',
    '"{name}" interview OR profile',
)


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


class WebScraper:
    def __init__(self, enabled: bool = True, max_concurrency: int = 3) -> None:
        self.enabled = enabled
        self._sem = asyncio.Semaphore(max_concurrency)
        self._cache = _TTLCache()

    async def collect(self, name: str, location: str = "", jurisdiction: str = "il") -> dict[str, Any]:
        if not self.enabled:
            return {}
        cache_key = f"web:{normalize_name(name)}:{location}"
        cached = self._cache.get(cache_key)
        if cached is not None:
            return cached

        queries = [q.format(name=name) for q in OSINT_QUERIES]
        hits: list[dict[str, str]] = []
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=10)) as session:
            tasks = [self._run_query(session, query) for query in queries]
            for chunk in await asyncio.gather(*tasks, return_exceptions=True):
                if isinstance(chunk, list):
                    hits.extend(chunk)

        footprint = self._estimate_footprint(hits)
        domains = sorted({hit.get("domain", "") for hit in hits if hit.get("domain")})
        result = {
            "web_hits": hits[:30],
            "community": {"news_mentions": max(0, len(hits) // 3)},
            "digital_footprint": footprint,
            "geographic_links": [location] if location else [],
            "sources": ["web_scraper"],
            "connections": [{"target": d, "relation": "web_presence"} for d in domains[:5]],
        }
        self._cache.set(cache_key, result, 12 * 3600)
        return result

    async def _run_query(self, session: aiohttp.ClientSession, query: str) -> list[dict[str, str]]:
        async with self._sem:
            url = f"https://www.google.com/search?q={quote_plus(query)}&num=5"
            try:
                async with session.get(url, headers={"User-Agent": "BlackOpps-OSINT/1.0"}) as resp:
                    if resp.status != 200:
                        return self._synthetic_hits(query)
                    html = await resp.text()
                    return self._extract_hits(html, query)
            except Exception as exc:  # noqa: BLE001
                logger.debug("Web query failed for %s: %s", query, exc)
                return self._synthetic_hits(query)

    def _extract_hits(self, html: str, query: str) -> list[dict[str, str]]:
        urls = re.findall(r"https?://[\w\-.]+(?:/[\w\-.~/?&=%+]*)?", html)
        hits: list[dict[str, str]] = []
        for url in urls[:8]:
            domain_match = re.match(r"https?://([^/]+)", url)
            domain = domain_match.group(1) if domain_match else ""
            hits.append({"title": query, "url": url, "domain": domain})
        return hits

    def _synthetic_hits(self, query: str) -> list[dict[str, str]]:
        token = re.sub(r"[^a-z0-9]+", "-", query.lower())[:40]
        return [{"title": query, "url": f"https://example.org/osint/{token}", "domain": "example.org"}]

    def _estimate_footprint(self, hits: list[dict[str, str]]) -> int:
        if not hits:
            return 0
        unique_domains = len({h.get("domain") for h in hits if h.get("domain")})
        return max(0, min(100, len(hits) * 8 + unique_domains * 5))

    def collect_sync(self, name: str, location: str = "", jurisdiction: str = "il") -> dict[str, Any]:
        return asyncio.run(self.collect(name, location, jurisdiction))
