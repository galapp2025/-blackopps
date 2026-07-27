from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any

from app.intelligence.scoring import InfluenceProfile, InfluenceTier, tier_from_score


class VoterCategory(str, Enum):
    SAFE = "SAFE"
    LEANING = "LEANING"
    SWING = "SWING"
    AT_RISK = "AT_RISK"
    LOST = "LOST"


class OptimalChannel(str, Enum):
    WHATSAPP = "WhatsApp"
    SMS = "SMS"
    PHONE = "Phone"
    DOOR = "Door-to-door"
    EVENT = "Community event"
    DIGITAL = "Digital ads"


@dataclass
class GOTVProfile:
    name: str
    category: VoterCategory
    category_confidence: float
    turnout_probability: float
    persuasion_score: float
    priority_score: float
    optimal_channel: OptimalChannel
    contact_frequency: str
    messaging_frame: str
    dropout_risk: float
    competitor_risk: float
    disengagement_signals: list[str] = field(default_factory=list)
    volunteer_potential: float = 0.0
    donor_potential: float = 0.0
    multiplier_potential: float = 0.0
    recommended_action: str = ""


class GOTVPredictor:
    """Classifies voters for GOTV operations using influence + voting history signals."""

    def predict(self, name: str, profile: InfluenceProfile, voting_history: dict[str, Any] | None = None) -> GOTVProfile:
        vh = voting_history or {}
        turnout_rate = float(vh.get("turnout_rate") or vh.get("turnout_pct") or 0)
        if turnout_rate > 1:
            turnout_rate /= 100.0
        consistency = str(vh.get("consistency") or "sometimes").lower()
        years = float(vh.get("years_registered") or 0)

        voter_score = profile.voter_score / 100.0
        community = profile.community_score / 100.0
        political = profile.political_score / 100.0
        composite = profile.composite_score / 100.0

        turnout_probability = min(0.98, max(0.05, 0.35 * turnout_rate + 0.45 * voter_score + 0.20 * composite))
        persuasion_score = min(1.0, max(0.0, 0.5 * (1 - political) + 0.3 * community + 0.2 * (1 - turnout_probability)))

        consistency_penalty = {
            "always": 0.0,
            "usually": 0.05,
            "sometimes": 0.15,
            "rarely": 0.35,
            "never": 0.55,
        }.get(consistency, 0.2)

        dropout_risk = min(1.0, consistency_penalty + (1 - turnout_probability) * 0.4)
        competitor_risk = min(1.0, persuasion_score * 0.6 + (profile.raw_data.get("community", {}).get("sentiment_score", 0) < 0) * 0.2)

        category, confidence = self._classify(turnout_probability, persuasion_score, dropout_risk, composite)
        priority = self._priority(category, turnout_probability, persuasion_score, dropout_risk)
        channel = self._channel(category, community, profile.raw_data)
        frequency = self._frequency(category, dropout_risk)
        frame = self._frame(category, profile)
        signals = self._disengagement_signals(consistency, dropout_risk, profile)
        volunteer = min(1.0, voter_score * 0.7 + community * 0.3)
        donor = min(1.0, profile.financial_score / 100.0 * 0.8 + political * 0.2)
        multiplier = min(1.0, community * 0.6 + volunteer * 0.4)
        action = self._recommended_action(category, channel, frame)

        return GOTVProfile(
            name=name,
            category=category,
            category_confidence=round(confidence, 2),
            turnout_probability=round(turnout_probability, 3),
            persuasion_score=round(persuasion_score, 3),
            priority_score=round(priority, 2),
            optimal_channel=channel,
            contact_frequency=frequency,
            messaging_frame=frame,
            dropout_risk=round(dropout_risk, 3),
            competitor_risk=round(competitor_risk, 3),
            disengagement_signals=signals,
            volunteer_potential=round(volunteer, 2),
            donor_potential=round(donor, 2),
            multiplier_potential=round(multiplier, 2),
            recommended_action=action,
        )

    def predict_from_scores(
        self,
        name: str,
        support_score: float = 0.5,
        turnout_history: float = 0.55,
        consistency: str = "sometimes",
    ) -> GOTVProfile:
        """Fast local classification without OSINT enrichment."""
        support = max(0.0, min(1.0, float(support_score)))
        turnout = float(turnout_history)
        if turnout > 1:
            turnout /= 100.0
        turnout = max(0.0, min(1.0, turnout))
        composite = support * 100.0
        profile = InfluenceProfile(
            name=name,
            political_score=round(composite * 0.92, 2),
            community_score=round(composite * 0.88, 2),
            voter_score=round(turnout * 100.0, 2),
            financial_score=round(composite * 0.75, 2),
            composite_score=round(composite, 2),
            tier=tier_from_score(composite),
            confidence=0.62,
            recommendation="Local GOTV batch classification",
            engagement_strategy="Field ops batch",
            risks=[],
            opportunities=[],
            raw_data={"voter": {}, "community": {}, "political": {}, "financial": {}},
            sources=["gotv_local"],
        )
        return self.predict(
            name,
            profile,
            {"turnout_rate": turnout, "consistency": consistency, "years_registered": 6},
        )

    def classify_batch(self, voters: list[dict[str, Any]]) -> list[GOTVProfile]:
        """Classify thousands of voters in-process (<2s for ~3k)."""
        results: list[GOTVProfile] = []
        for item in voters:
            name = str(item.get("name") or item.get("full_name") or "").strip()
            if not name:
                first = str(item.get("first_name") or "").strip()
                last = str(item.get("last_name") or "").strip()
                name = f"{first} {last}".strip()
            if not name:
                continue
            support = item.get("support_score")
            if support is None:
                support = 0.5
            turnout = item.get("turnout_history")
            if turnout is None:
                turnout = item.get("turnout_score")
            if turnout is None:
                turnout = 0.55
            consistency = str(item.get("consistency") or "sometimes")
            results.append(
                self.predict_from_scores(
                    name,
                    support_score=float(support),
                    turnout_history=float(turnout),
                    consistency=consistency,
                )
            )
        return results

    def _classify(
        self,
        turnout_p: float,
        persuasion: float,
        dropout: float,
        composite: float,
    ) -> tuple[VoterCategory, float]:
        if turnout_p >= 0.78 and dropout <= 0.25 and composite >= 0.55:
            return VoterCategory.SAFE, 0.85 + turnout_p * 0.1
        if turnout_p >= 0.62 and dropout <= 0.35:
            return VoterCategory.LEANING, 0.75
        if persuasion >= 0.55 and 0.35 <= turnout_p < 0.62:
            return VoterCategory.SWING, 0.7 + persuasion * 0.2
        if dropout >= 0.55 or turnout_p < 0.35:
            return VoterCategory.LOST, 0.8
        return VoterCategory.AT_RISK, 0.72

    def _priority(self, category: VoterCategory, turnout_p: float, persuasion: float, dropout: float) -> float:
        base = {
            VoterCategory.SAFE: 35,
            VoterCategory.LEANING: 55,
            VoterCategory.SWING: 85,
            VoterCategory.AT_RISK: 75,
            VoterCategory.LOST: 40,
        }[category]
        return min(100.0, base + persuasion * 20 + dropout * 15 - turnout_p * 10)

    def _channel(self, category: VoterCategory, community: float, raw: dict[str, Any]) -> OptimalChannel:
        preferred = str((raw.get("voter") or {}).get("preferred_channel") or "")
        if preferred.lower().startswith("what"):
            return OptimalChannel.WHATSAPP
        if category in (VoterCategory.SAFE, VoterCategory.LEANING) and community >= 0.5:
            return OptimalChannel.WHATSAPP
        if category == VoterCategory.SWING:
            return OptimalChannel.PHONE if community < 0.4 else OptimalChannel.DOOR
        if category == VoterCategory.AT_RISK:
            return OptimalChannel.DOOR
        return OptimalChannel.SMS

    def _frequency(self, category: VoterCategory, dropout: float) -> str:
        if category == VoterCategory.SWING:
            return "3 touches / 72h"
        if category == VoterCategory.AT_RISK:
            return "Daily until pledge"
        if category == VoterCategory.SAFE:
            return "1 reminder / election week"
        if dropout > 0.5:
            return "2 touches / 48h escalation"
        return "2 touches / week"

    def _frame(self, category: VoterCategory, profile: InfluenceProfile) -> str:
        if category == VoterCategory.SWING:
            return "Hope + local impact + peer validation"
        if category == VoterCategory.AT_RISK:
            return "Urgency + personal ask + transport offer"
        if category == VoterCategory.SAFE:
            return "Mobilization captain + bring-a-friend"
        if category == VoterCategory.LOST:
            return "Issue reframe + low-friction digital pledge"
        return profile.recommendation[:120] if profile.recommendation else "Stability + community pride"

    def _disengagement_signals(self, consistency: str, dropout: float, profile: InfluenceProfile) -> list[str]:
        signals: list[str] = []
        if consistency in ("rarely", "never"):
            signals.append("Low historical turnout consistency")
        if dropout >= 0.45:
            signals.append("Elevated dropout risk score")
        if float(profile.raw_data.get("community", {}).get("sentiment_score") or 0) < -0.2:
            signals.append("Negative media sentiment")
        if not signals:
            signals.append("No critical disengagement flags")
        return signals

    def _recommended_action(self, category: VoterCategory, channel: OptimalChannel, frame: str) -> str:
        return f"{category.value}: deploy via {channel.value} with frame '{frame}'"


def gotv_battleplan(profiles: list[GOTVProfile]) -> dict[str, Any]:
    if not profiles:
        return {"segments": {}, "top_priority": [], "resource_allocation": {}}

    segments: dict[str, list[str]] = {cat.value: [] for cat in VoterCategory}
    for item in profiles:
        segments[item.category.value].append(item.name)

    top = sorted(profiles, key=lambda p: p.priority_score, reverse=True)[:10]
    allocation = {
        "door_knocks": len(segments[VoterCategory.AT_RISK.value]) + len(segments[VoterCategory.SWING.value]),
        "whatsapp_blasts": len(segments[VoterCategory.LEANING.value]) + len(segments[VoterCategory.SAFE.value]),
        "phone_bank_hours": max(1, len(segments[VoterCategory.SWING.value]) * 2),
        "volunteer_recruits": sum(1 for p in profiles if p.volunteer_potential >= 0.65),
    }

    return {
        "segments": {k: v for k, v in segments.items() if v},
        "top_priority": [
            {"name": p.name, "category": p.category.value, "priority_score": p.priority_score}
            for p in top
        ],
        "resource_allocation": allocation,
        "summary": {
            "total_voters": len(profiles),
            "swing_count": len(segments[VoterCategory.SWING.value]),
            "at_risk_count": len(segments[VoterCategory.AT_RISK.value]),
        },
    }
