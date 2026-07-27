from __future__ import annotations

import asyncio
from datetime import UTC, datetime
from typing import Any

from app.intelligence.alerts import AlertManager
from app.intelligence.collectors import (
    NewsCollector,
    OpenSanctionsCollector,
    PublicRecordsCollector,
    SocialCollector,
    WebScraper,
)
from app.intelligence.collectors.public_records import _deep_merge
from app.intelligence.entity import resolve_entity
from app.intelligence.network import InfluenceNetwork
from app.intelligence.scoring import InfluenceProfile, InfluenceScorer


def _merge_collected(base: dict[str, Any], patch: dict[str, Any]) -> dict[str, Any]:
    merged = _deep_merge(base, patch)
    sources = list(dict.fromkeys((base.get("sources") or []) + (patch.get("sources") or [])))
    merged["sources"] = sources
    connections = (base.get("connections") or []) + (patch.get("connections") or [])
    merged["connections"] = connections
    return merged


class EnrichmentPipeline:
    def __init__(
        self,
        *,
        opensanctions_key: str | None = None,
        newsapi_key: str | None = None,
        opencorporates_key: str | None = None,
        twitter_bearer: str | None = None,
        batch_size: int = 10,
        enable_opensanctions: bool = True,
        enable_news: bool = True,
        enable_social: bool = True,
        enable_public_records: bool = True,
        enable_web: bool = True,
    ) -> None:
        self.batch_size = batch_size
        self.scorer = InfluenceScorer()
        self.alerts = AlertManager()
        self.network = InfluenceNetwork()
        self._profiles: dict[str, InfluenceProfile] = {}
        self._raw_data: dict[str, dict[str, Any]] = {}
        self._candidate_pool: list[dict[str, Any]] = []

        self.collectors = {
            "opensanctions": OpenSanctionsCollector(opensanctions_key, enabled=enable_opensanctions),
            "news": NewsCollector(newsapi_key, enabled=enable_news),
            "social": SocialCollector(twitter_bearer, enabled=enable_social),
            "public_records": PublicRecordsCollector(opencorporates_key, enabled=enable_public_records),
            "web": WebScraper(enabled=enable_web),
        }

    async def enrich(
        self,
        names: list[str],
        location: str = "",
        jurisdiction: str = "il",
        keywords: list[str] | None = None,
        enable_alerting: bool = True,
    ) -> list[InfluenceProfile]:
        profiles: list[InfluenceProfile] = []
        cleaned = [n.strip() for n in names if n and n.strip()]
        for i in range(0, len(cleaned), self.batch_size):
            batch = cleaned[i : i + self.batch_size]
            batch_profiles = await asyncio.gather(*[
                self._enrich_one(name, location, jurisdiction, keywords, enable_alerting) for name in batch
            ])
            profiles.extend(batch_profiles)
        return profiles

    async def _enrich_one(
        self,
        name: str,
        location: str,
        jurisdiction: str,
        keywords: list[str] | None,
        enable_alerting: bool,
    ) -> InfluenceProfile:
        resolution = resolve_entity(name, location, self._candidate_pool)
        target_name = str((resolution.get("entity") or {}).get("name") or name)

        collected: dict[str, Any] = {
            "name": target_name,
            "location": location,
            "jurisdiction": jurisdiction,
            "keywords": keywords or [],
            "collected_at": datetime.now(UTC).isoformat(),
            "entity_resolution": resolution,
            "sources": [],
            "connections": [],
        }

        collector_tasks = [
            collector.collect(target_name, location=location, jurisdiction=jurisdiction)
            for collector in self.collectors.values()
            if getattr(collector, "enabled", True)
        ]
        results = await asyncio.gather(*collector_tasks, return_exceptions=True)
        for result in results:
            if isinstance(result, dict):
                collected = _merge_collected(collected, result)

        voter = collected.get("voter") or {}
        collected["public_records"] = {
            "voting_history": {
                "turnout_rate": float(voter.get("turnout_pct") or 0) / 100.0,
                "consistency": voter.get("consistency") or "sometimes",
                "volunteer": bool(voter.get("volunteer")),
                "donor": bool(voter.get("donor")),
            },
            "registration": {
                "registered": bool(voter.get("registered", True)),
                "years_registered": float(voter.get("years_registered") or 0),
            },
        }
        self._raw_data[target_name] = collected

        profile = self.scorer.score(target_name, collected)
        self._profiles[target_name] = profile
        self._candidate_pool.append({"name": target_name, "location": location, "profile": profile.composite_score})

        if enable_alerting:
            self.alerts.take_snapshot(profile)
            self.alerts.detect_changes(profile)
            self.alerts.check_sanctions_alert(profile)
            self.alerts.check_news_surge(profile)
            self.alerts.check_data_age(profile)

        self.network.add_entity(target_name, collected)
        self.network.build_from_collected_data(target_name, collected)
        return profile

    def enrich_sync(
        self,
        names: list[str],
        location: str = "",
        jurisdiction: str = "il",
        keywords: list[str] | None = None,
        enable_alerting: bool = True,
    ) -> list[InfluenceProfile]:
        return asyncio.run(self.enrich(names, location, jurisdiction, keywords, enable_alerting))

    def get_profile(self, name: str) -> InfluenceProfile | None:
        return self._profiles.get(name)

    def get_alerts(self, severity: str | None = None) -> list[dict[str, Any]]:
        return self.alerts.get_active_alerts(severity=severity, acknowledged=False)

    def get_timeline(self, name: str) -> list[dict[str, Any]]:
        return self.alerts.get_timeline(name)

    def get_network_cluster(self, name: str, depth: int = 2) -> dict[str, Any]:
        return self.network.get_cluster(name, depth=depth)

    def get_hubs(self) -> list[dict[str, Any]]:
        return self.network.identify_hubs(min_connections=3)

    def find_connection_path(self, a: str, b: str) -> list[str]:
        return self.network.find_path(a, b, max_depth=4)

    def get_network_summary(self) -> dict[str, Any]:
        return self.network.summary()

    def generate_briefing(self, name: str) -> dict[str, Any]:
        profile = self.get_profile(name)
        if profile is None:
            return {"name": name, "found": False}
        return {
            "classification": "CONFIDENTIAL // BLACKOPPS OSINT",
            "name": profile.name,
            "composite_score": profile.composite_score,
            "tier": profile.tier.value,
            "confidence": profile.confidence,
            "dimension_scores": {
                "political": profile.political_score,
                "community": profile.community_score,
                "voter": profile.voter_score,
                "financial": profile.financial_score,
            },
            "recommendation": profile.recommendation,
            "engagement_strategy": profile.engagement_strategy,
            "risks": profile.risks,
            "opportunities": profile.opportunities,
            "evidence": profile.evidence,
            "sources": profile.sources,
            "alerts": self.get_alerts(),
            "network_cluster": self.get_network_cluster(name, depth=2),
            "timeline": self.get_timeline(name),
        }
