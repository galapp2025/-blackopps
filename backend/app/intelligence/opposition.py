from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from app.intelligence.pipeline import EnrichmentPipeline
from app.intelligence.scoring import InfluenceProfile


@dataclass
class ComparisonResult:
    candidate_a: str
    candidate_b: str
    location: str
    jurisdiction: str
    profile_a: InfluenceProfile
    profile_b: InfluenceProfile
    dimension_winners: dict[str, str]
    asymmetric_advantages: dict[str, list[str]]
    attack_surfaces: dict[str, list[str]]
    shared_connections: list[str]
    recommended_strategy: str
    escalation_scenarios: list[str] = field(default_factory=list)
    composite_delta: float = 0.0


class OppositionResearch:
    def __init__(self, pipeline: EnrichmentPipeline) -> None:
        self.pipeline = pipeline

    async def compare(
        self,
        candidate_a: str,
        candidate_b: str,
        location: str = "",
        jurisdiction: str = "il",
    ) -> ComparisonResult:
        profiles = await self.pipeline.enrich([candidate_a, candidate_b], location=location, jurisdiction=jurisdiction)
        by_name = {p.name: p for p in profiles}
        profile_a = by_name.get(candidate_a) or profiles[0]
        profile_b = by_name.get(candidate_b) or (profiles[1] if len(profiles) > 1 else profiles[0])

        dimensions = {
            "political": (profile_a.political_score, profile_b.political_score),
            "community": (profile_a.community_score, profile_b.community_score),
            "voter": (profile_a.voter_score, profile_b.voter_score),
            "financial": (profile_a.financial_score, profile_b.financial_score),
            "composite": (profile_a.composite_score, profile_b.composite_score),
        }
        winners = {}
        for dim, (sa, sb) in dimensions.items():
            if sa > sb:
                winners[dim] = profile_a.name
            elif sb > sa:
                winners[dim] = profile_b.name
            else:
                winners[dim] = "tie"

        advantages = {
            profile_a.name: self._advantages(profile_a, profile_b),
            profile_b.name: self._advantages(profile_b, profile_a),
        }
        attacks = {
            profile_a.name: self._attack_surface(profile_a),
            profile_b.name: self._attack_surface(profile_b),
        }
        shared = self._shared_connections(profile_a, profile_b)
        strategy = self._strategy(profile_a, profile_b, winners)
        escalation = self._escalation(profile_a, profile_b, winners)

        return ComparisonResult(
            candidate_a=profile_a.name,
            candidate_b=profile_b.name,
            location=location,
            jurisdiction=jurisdiction,
            profile_a=profile_a,
            profile_b=profile_b,
            dimension_winners=winners,
            asymmetric_advantages=advantages,
            attack_surfaces=attacks,
            shared_connections=shared,
            recommended_strategy=strategy,
            escalation_scenarios=escalation,
            composite_delta=round(profile_a.composite_score - profile_b.composite_score, 2),
        )

    def _advantages(self, subject: InfluenceProfile, opponent: InfluenceProfile) -> list[str]:
        items: list[str] = []
        if subject.community_score > opponent.community_score + 8:
            items.append("Stronger community amplifier network")
        if subject.voter_score > opponent.voter_score + 8:
            items.append("Higher mobilization reliability")
        if subject.political_score > opponent.political_score + 8:
            items.append("Superior political capital positioning")
        if subject.financial_score > opponent.financial_score + 8:
            items.append("Greater financial leverage / donor depth")
        if subject.tier.value != opponent.tier.value and subject.composite_score > opponent.composite_score:
            items.append(f"Higher influence tier ({subject.tier.value} vs {opponent.tier.value})")
        if not items:
            items.append("No decisive asymmetric advantage detected")
        return items

    def _attack_surface(self, profile: InfluenceProfile) -> list[str]:
        surfaces = list(profile.risks)
        political = profile.raw_data.get("political", {})
        if int(political.get("sanctions_count") or 0) > 0:
            surfaces.append("Sanctions / compliance exposure")
        community = profile.raw_data.get("community", {})
        if community.get("controversial_content"):
            surfaces.append("Controversial digital footprint")
        if float(community.get("sentiment_score") or 0) < -0.25:
            surfaces.append("Negative press cycle vulnerability")
        return surfaces or ["Limited public attack surface in current OSINT"]

    def _shared_connections(self, a: InfluenceProfile, b: InfluenceProfile) -> list[str]:
        conns_a = {str(c.get("target") or c) for c in (a.raw_data.get("connections") or [])}
        conns_b = {str(c.get("target") or c) for c in (b.raw_data.get("connections") or [])}
        shared = sorted(conns_a & conns_b)
        path = self.pipeline.find_connection_path(a.name, b.name)
        if len(path) > 2:
            shared.append(" → ".join(path))
        return shared[:15]

    def _strategy(self, a: InfluenceProfile, b: InfluenceProfile, winners: dict[str, str]) -> str:
        leader = a.name if a.composite_score >= b.composite_score else b.name
        lagging = b.name if leader == a.name else a.name
        swing_dim = winners.get("community") or winners.get("voter") or "composite"
        return (
            f"Lead narrative through {swing_dim} dimension; keep {leader} on offense while "
            f"containing {lagging} via targeted contrast on risks and turnout mobilization."
        )

    def _escalation(self, a: InfluenceProfile, b: InfluenceProfile, winners: dict[str, str]) -> list[str]:
        scenarios = []
        delta = abs(a.composite_score - b.composite_score)
        if delta < 5:
            scenarios.append("Statistical tie — micro-targeting skirmish in swing precincts")
        if winners.get("political") != winners.get("community"):
            scenarios.append("Cross-pressure: policy credibility vs social proof battle")
        if any(r for r in a.risks + b.risks if "sanction" in r.lower()):
            scenarios.append("Compliance escalation — legal review before negative push")
        if not scenarios:
            scenarios.append("Stable race — maintain field ops cadence without escalation")
        return scenarios


def comparison_to_dict(result: ComparisonResult) -> dict[str, Any]:
    def profile_summary(p: InfluenceProfile) -> dict[str, Any]:
        return {
            "name": p.name,
            "tier": p.tier.value,
            "composite_score": p.composite_score,
            "scores": {
                "political": p.political_score,
                "community": p.community_score,
                "voter": p.voter_score,
                "financial": p.financial_score,
            },
            "risks": p.risks,
            "opportunities": p.opportunities,
        }

    return {
        "candidate_a": result.candidate_a,
        "candidate_b": result.candidate_b,
        "location": result.location,
        "jurisdiction": result.jurisdiction,
        "composite_delta": result.composite_delta,
        "profiles": {
            result.candidate_a: profile_summary(result.profile_a),
            result.candidate_b: profile_summary(result.profile_b),
        },
        "dimension_winners": result.dimension_winners,
        "asymmetric_advantages": result.asymmetric_advantages,
        "attack_surfaces": result.attack_surfaces,
        "shared_connections": result.shared_connections,
        "recommended_strategy": result.recommended_strategy,
        "escalation_scenarios": result.escalation_scenarios,
    }
