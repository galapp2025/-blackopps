from __future__ import annotations

import asyncio
import re
import time
import xml.etree.ElementTree as ET
from typing import Any
from urllib.parse import quote_plus

import aiohttp

from app.intelligence.entity import normalize_name

POSITIVE_EN = {"success", "support", "win", "growth", "lead", "strong", "hope", "unity"}
NEGATIVE_EN = {"scandal", "corruption", "crisis", "fail", "attack", "fraud", "protest", "sanctions"}
POSITIVE_HE = {"הצלחה", "תמיכה", "ניצחון", "צמיחה", "איחוד", "ביטחון", "תקווה"}
NEGATIVE_HE = {"שחיתות", "משבר", "מחאה", "סקנדל", "התקפה", "כישלון", "סנקציות"}
POSITIVE_AR = {"نجاح", "دعم", "فوز", "نمو", "أمل"}
NEGATIVE_AR = {"فضيحة", "فساد", "أزمة", "فشل", "احتجاج", "عقوبات"}


class SentimentAnalyzer:
    def score_text(self, text: str) -> float:
        tokens = re.findall(r"[\w\u0590-\u05FF\u0600-\u06FF]+", text.lower())
        if not tokens:
            return 0.0
        pos = sum(1 for t in tokens if t in POSITIVE_EN or t in POSITIVE_HE or t in POSITIVE_AR)
        neg = sum(1 for t in tokens if t in NEGATIVE_EN or t in NEGATIVE_HE or t in NEGATIVE_AR)
        if pos + neg == 0:
            return 0.0
        return max(-1.0, min(1.0, (pos - neg) / (pos + neg)))


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


class NewsCollector:
    GDELT_URL = "https://api.gdeltproject.org/api/v2/doc/doc"
    NEWSAPI_URL = "https://newsapi.org/v2/everything"

    def __init__(self, newsapi_key: str | None = None, enabled: bool = True) -> None:
        self.newsapi_key = newsapi_key
        self.enabled = enabled
        self.sentiment = SentimentAnalyzer()
        self._cache = _TTLCache()

    async def collect(self, name: str, location: str = "", jurisdiction: str = "il") -> dict[str, Any]:
        if not self.enabled:
            return {}
        cache_key = f"news:{normalize_name(name)}:{location}:{jurisdiction}"
        cached = self._cache.get(cache_key)
        if cached is not None:
            return cached

        articles: list[dict[str, str]] = []
        query = quote_plus(f'"{name}" {location}'.strip())
        timeout = aiohttp.ClientTimeout(total=12)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            gdelt = await self._fetch_gdelt(session, name, location)
            articles.extend(gdelt)
            if self.newsapi_key:
                articles.extend(await self._fetch_newsapi(session, name, location))
            articles.extend(await self._fetch_google_rss(session, query))

        sentiments = [self.sentiment.score_text(a.get("title", "") + " " + a.get("summary", "")) for a in articles]
        avg_sentiment = sum(sentiments) / len(sentiments) if sentiments else 0.0
        result = {
            "community": {
                "news_mentions": len(articles),
                "sentiment_score": round(avg_sentiment, 3),
            },
            "news_articles": articles[:20],
            "sources": ["gdelt", "google_news_rss"] + (["newsapi"] if self.newsapi_key else []),
        }
        self._cache.set(cache_key, result, 6 * 3600)
        return result

    async def _fetch_gdelt(self, session: aiohttp.ClientSession, name: str, location: str) -> list[dict[str, str]]:
        params = {"query": f'"{name}" {location}'.strip(), "mode": "ArtList", "maxrecords": "20", "format": "json"}
        try:
            async with session.get(self.GDELT_URL, params=params) as resp:
                if resp.status != 200:
                    return []
                data = await resp.json(content_type=None)
                articles = data.get("articles") or []
                return [{"title": a.get("title", ""), "url": a.get("url", ""), "source": "gdelt"} for a in articles]
        except Exception:
            return []

    async def _fetch_newsapi(self, session: aiohttp.ClientSession, name: str, location: str) -> list[dict[str, str]]:
        params = {"q": f'"{name}" {location}'.strip(), "pageSize": 20, "apiKey": self.newsapi_key}
        try:
            async with session.get(self.NEWSAPI_URL, params=params) as resp:
                if resp.status != 200:
                    return []
                data = await resp.json()
                return [
                    {"title": a.get("title", ""), "url": a.get("url", ""), "source": "newsapi"}
                    for a in data.get("articles") or []
                ]
        except Exception:
            return []

    async def _fetch_google_rss(self, session: aiohttp.ClientSession, query: str) -> list[dict[str, str]]:
        url = f"https://news.google.com/rss/search?q={query}&hl=he-IL&gl=IL&ceid=IL:he"
        try:
            async with session.get(url) as resp:
                if resp.status != 200:
                    return []
                text = await resp.text()
                root = ET.fromstring(text)
                items = []
                for item in root.findall(".//item")[:15]:
                    title = item.findtext("title") or ""
                    link = item.findtext("link") or ""
                    items.append({"title": title, "url": link, "source": "google_news_rss"})
                return items
        except Exception:
            return []

    def collect_sync(self, name: str, location: str = "", jurisdiction: str = "il") -> dict[str, Any]:
        return asyncio.run(self.collect(name, location, jurisdiction))
