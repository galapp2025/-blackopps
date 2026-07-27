from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class InfluenceTier(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MODERATE = "MODERATE"
    LOW = "LOW"
    NEGLIGIBLE = "NEGLIGIBLE"


TIER_THRESHOLDS = (85, 70, 50, 30, 0)


@dataclass
class InfluenceProfile:
    name: str
    political_score: float
    community_score: float
    voter_score: float
    financial_score: float
    composite_score: float
    tier: InfluenceTier
    confidence: float
    evidence: list[str] = field(default_factory=list)
    recommendation: str = ""
    engagement_strategy: str = ""
    risks: list[str] = field(default_factory=list)
    opportunities: list[str] = field(default_factory=list)
    raw_data: dict[str, Any] = field(default_factory=dict)
    sources: list[str] = field(default_factory=list)


def tier_from_score(score: float) -> InfluenceTier:
    if score >= 85:
        return InfluenceTier.CRITICAL
    if score >= 70:
        return InfluenceTier.HIGH
    if score >= 50:
        return InfluenceTier.MODERATE
    if score >= 30:
        return InfluenceTier.LOW
    return InfluenceTier.NEGLIGIBLE


class PoliticalCapitalScorer:
    def score(self, data: dict[str, Any]) -> tuple[float, list[str]]:
        political = data.get("political", {})
        evidence: list[str] = []
        total = 0.0

        if political.get("is_pep"):
            total += 35
            evidence.append("PEP status identified")
        sanctions = int(political.get("sanctions_count") or 0)
        if sanctions:
            total += min(20, sanctions * 5)
            evidence.append(f"{sanctions} sanctions record(s)")
        roles = political.get("political_roles") or []
        role_pts = min(30, 15 * len(roles))
        if role_pts:
            total += role_pts
            evidence.append(f"{len(roles)} political role(s)")
        contributions = float(political.get("contributions_usd") or 0)
        contrib_pts = min(15, contributions / 1000)
        if contrib_pts:
            total += contrib_pts
            evidence.append("Political contributions detected")
        if political.get("party_affiliation"):
            total += 10
            evidence.append("Party affiliation")
        if political.get("party_leadership"):
            total += 10
            evidence.append("Party leadership role")

        return min(100.0, total), evidence


class CommunityInfluenceScorer:
    def score(self, data: dict[str, Any]) -> tuple[float, list[str]]:
        community = data.get("community", {})
        evidence: list[str] = []
        total = 0.0

        twitter = int(community.get("twitter_followers") or 0)
        if twitter:
            pts = min(25, twitter / 100)
            total += pts
            evidence.append(f"Twitter reach ~{twitter}")
        facebook = int(community.get("facebook_followers") or 0)
        if facebook:
            total += min(10, facebook / 200)
            evidence.append(f"Facebook reach ~{facebook}")
        linkedin = int(community.get("linkedin_connections") or 0)
        if linkedin:
            total += min(10, linkedin / 100)
            evidence.append(f"LinkedIn network ~{linkedin}")
        mentions = int(community.get("news_mentions") or 0)
        if mentions:
            total += min(20, 5 * mentions)
            evidence.append(f"{mentions} news mention(s)")
        sentiment = float(community.get("sentiment_score") or 0)
        if sentiment > 0:
            total += min(15, sentiment * 0.15 * 100)
            evidence.append("Positive media sentiment")
        roles = community.get("community_roles") or []
        if roles:
            total += min(20, 8 * len(roles))
            evidence.append(f"{len(roles)} community role(s)")

        return min(100.0, total), evidence


class VoterReliabilityScorer:
    CONSISTENCY_BONUS = {
        "always": 20,
        "usually": 12,
        "sometimes": 5,
        "rarely": 0,
        "never": -20,
    }

    def score(self, data: dict[str, Any]) -> tuple[float, list[str]]:
        voter = data.get("voter", {})
        evidence: list[str] = []
        total = 50.0

        turnout = float(voter.get("turnout_pct") or 0)
        if turnout:
            total += turnout * 0.3
            evidence.append(f"Turnout history ~{turnout:.0f}%")
        consistency = str(voter.get("consistency") or "").lower()
        bonus = self.CONSISTENCY_BONUS.get(consistency, 0)
        total += bonus
        if consistency:
            evidence.append(f"Voting consistency: {consistency}")
        if voter.get("registered"):
            total += 5
            evidence.append("Active registration")
        years = float(voter.get("years_registered") or 0)
        if years:
            total += min(10, years * 0.5)
            evidence.append(f"{years:.0f} years registered")
        if voter.get("volunteer"):
            total += 5
            evidence.append("Volunteer activity")
        if voter.get("donor"):
            total += 5
            evidence.append("Donor activity")

        return max(0.0, min(100.0, total)), evidence


class FinancialLeverageScorer:
    NET_WORTH_BONUS = {"high": 20, "upper_mid": 12, "mid": 5}

    def score(self, data: dict[str, Any]) -> tuple[float, list[str]]:
        financial = data.get("financial", {})
        evidence: list[str] = []
        total = 0.0

        companies = int(financial.get("companies") or 0)
        if companies:
            total += min(25, 10 * companies)
            evidence.append(f"{companies} corporate entity(ies)")
        directors = int(financial.get("director_roles") or 0)
        if directors:
            total += min(20, 8 * directors)
            evidence.append(f"{directors} director role(s)")
        properties = int(financial.get("properties") or 0)
        if properties:
            total += min(16, 8 * properties)
            evidence.append(f"{properties} property record(s)")
        category = str(financial.get("net_worth_category") or "").lower()
        if category in self.NET_WORTH_BONUS:
            total += self.NET_WORTH_BONUS[category]
            evidence.append(f"Net worth band: {category}")
        filings = int(financial.get("filings") or 0)
        if filings:
            total += min(9, 3 * filings)
            evidence.append(f"{filings} regulatory filing(s)")
        contracts = int(financial.get("gov_contracts") or 0)
        if contracts:
            total += min(10, 10 * contracts)
            evidence.append(f"{contracts} government contract(s)")

        return min(100.0, total), evidence


class InfluenceScorer:
    DEFAULT_WEIGHTS = {
        "political": 0.30,
        "community": 0.25,
        "voter": 0.25,
        "financial": 0.20,
    }

    def __init__(self, weights: dict[str, float] | None = None) -> None:
        self.weights = {**self.DEFAULT_WEIGHTS, **(weights or {})}
        self.political = PoliticalCapitalScorer()
        self.community = CommunityInfluenceScorer()
        self.voter = VoterReliabilityScorer()
        self.financial = FinancialLeverageScorer()

    def score(self, name: str, raw_data: dict[str, Any]) -> InfluenceProfile:
        political_score, p_ev = self.political.score(raw_data)
        community_score, c_ev = self.community.score(raw_data)
        voter_score, v_ev = self.voter.score(raw_data)
        financial_score, f_ev = self.financial.score(raw_data)

        composite = (
            political_score * self.weights["political"]
            + community_score * self.weights["community"]
            + voter_score * self.weights["voter"]
            + financial_score * self.weights["financial"]
        )
        composite = round(composite, 2)
        tier = tier_from_score(composite)
        evidence = p_ev + c_ev + v_ev + f_ev
        confidence = min(0.95, 0.35 + 0.05 * len(evidence))

        risks = self._identify_risks(raw_data, political_score, community_score)
        opportunities = self._identify_opportunities(
            raw_data, political_score, community_score, voter_score, financial_score
        )
        recommendation = self._generate_recommendation(tier, political_score, community_score, voter_score, financial_score)
        strategy = self._engagement_strategy(political_score, community_score, voter_score, financial_score)

        return InfluenceProfile(
            name=name,
            political_score=round(political_score, 2),
            community_score=round(community_score, 2),
            voter_score=round(voter_score, 2),
            financial_score=round(financial_score, 2),
            composite_score=composite,
            tier=tier,
            confidence=round(confidence, 2),
            evidence=evidence,
            recommendation=recommendation,
            engagement_strategy=strategy,
            risks=risks,
            opportunities=opportunities,
            raw_data=raw_data,
            sources=list(raw_data.get("sources") or []),
        )

    def score_batch(self, items: list[tuple[str, dict[str, Any]]]) -> list[InfluenceProfile]:
        return [self.score(name, data) for name, data in items]

    def _generate_recommendation(
        self,
        tier: InfluenceTier,
        political: float,
        community: float,
        voter: float,
        financial: float,
    ) -> str:
        dominant = max(
            ("political", political),
            ("community", community),
            ("voter", voter),
            ("financial", financial),
            key=lambda x: x[1],
        )[0]
        tier_text = {
            InfluenceTier.CRITICAL: "Priority asset — executive-level engagement within 24h.",
            InfluenceTier.HIGH: "High-value target — assign senior field lead this week.",
            InfluenceTier.MODERATE: "Influenceable node — nurture via trusted community channels.",
            InfluenceTier.LOW: "Monitor only — lightweight touchpoints.",
            InfluenceTier.NEGLIGIBLE: "Deprioritize — batch comms only.",
        }[tier]
        dimension_text = {
            "political": "Lead with policy credibility and institutional validators.",
            "community": "Activate social proof and local amplifiers.",
            "voter": "Focus on turnout reliability and peer mobilization.",
            "financial": "Frame economic stability and partnership ROI.",
        }[dominant]
        return f"{tier_text} {dimension_text}"

    def _identify_risks(self, data: dict[str, Any], political: float, community: float) -> list[str]:
        risks: list[str] = []
        political_data = data.get("political", {})
        community_data = data.get("community", {})
        if int(political_data.get("sanctions_count") or 0) >= 1:
            risks.append("Sanctions exposure — legal review required before outreach")
        if float(community_data.get("sentiment_score") or 0) < -0.3:
            risks.append("Negative media sentiment — message testing mandatory")
        if political_data.get("conflict_of_interest"):
            risks.append("Potential conflict of interest in public records")
        if community_data.get("controversial_content"):
            risks.append("Controversial social content detected")
        if political >= 70 and int(political_data.get("sanctions_count") or 0) == 0:
            if not risks:
                risks.append("High visibility — reputational sensitivity")
        return risks

    def _identify_opportunities(
        self,
        data: dict[str, Any],
        political: float,
        community: float,
        voter: float,
        financial: float,
    ) -> list[str]:
        opportunities: list[str] = []
        if community >= 65:
            opportunities.append("Community amplifier — leverage for peer-to-peer reach")
        if political >= 60:
            opportunities.append("Political access node — coalition building potential")
        if voter >= 70:
            opportunities.append("Reliable turnout anchor — mobilization captain candidate")
        if financial >= 55:
            opportunities.append("Fundraising leverage — donor network introduction")
        if int(data.get("community", {}).get("news_mentions") or 0) >= 5:
            opportunities.append("Media visibility — timed narrative insertion")
        return opportunities

    def _engagement_strategy(self, political: float, community: float, voter: float, financial: float) -> str:
        scores = {
            "political": political,
            "community": community,
            "voter": voter,
            "financial": financial,
        }
        dominant = max(scores, key=scores.get)
        strategies = {
            "political": "Institutional briefing → policy roundtable → closed-door endorsement path.",
            "community": "Influencer co-sign → localized content drops → event invite ladder.",
            "voter": "Turnout pledge → volunteer squad → election-day shuttle priority.",
            "financial": "Economic impact brief → business council intro → partnership MOU track.",
        }
        return strategies[dominant]
