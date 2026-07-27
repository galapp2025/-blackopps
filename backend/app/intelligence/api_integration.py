from __future__ import annotations

from typing import Any

from app.intelligence.pipeline import EnrichmentPipeline
from app.intelligence.scoring import InfluenceProfile

_pipeline: EnrichmentPipeline | None = None


def get_pipeline(**kwargs: Any) -> EnrichmentPipeline:
    global _pipeline
    if _pipeline is None:
        _pipeline = EnrichmentPipeline(**kwargs)
    return _pipeline


def reset_pipeline() -> None:
    global _pipeline
    _pipeline = None


def profile_to_dict(profile: InfluenceProfile) -> dict[str, Any]:
    return {
        "name": profile.name,
        "scores": {
            "political": profile.political_score,
            "community": profile.community_score,
            "voter": profile.voter_score,
            "financial": profile.financial_score,
            "composite": profile.composite_score,
        },
        "tier": profile.tier.value,
        "confidence": profile.confidence,
        "recommendation": profile.recommendation,
        "engagement_strategy": profile.engagement_strategy,
        "risks": profile.risks,
        "opportunities": profile.opportunities,
        "evidence": profile.evidence,
        "sources": profile.sources,
    }


def pipeline_summary(pipeline: EnrichmentPipeline) -> dict[str, Any]:
    profiles = list(pipeline._profiles.values())
    tier_distribution: dict[str, int] = {}
    composite_total = 0.0
    for profile in profiles:
        tier_distribution[profile.tier.value] = tier_distribution.get(profile.tier.value, 0) + 1
        composite_total += profile.composite_score
    average_composite = round(composite_total / len(profiles), 2) if profiles else 0.0
    return {
        "total_profiles": len(profiles),
        "tier_distribution": tier_distribution,
        "average_composite": average_composite,
        "alerts": pipeline.alerts.summary(),
        "network": pipeline.get_network_summary(),
        "hubs": pipeline.get_hubs()[:10],
    }
