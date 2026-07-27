from __future__ import annotations

import hashlib
import json
import uuid
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any

from app.intelligence.scoring import InfluenceProfile


@dataclass
class Alert:
    alert_id: str
    name: str
    severity: str
    message: str
    created_at: datetime
    acknowledged: bool = False
    metadata: dict[str, Any] = field(default_factory=dict)


class AlertManager:
    def __init__(self) -> None:
        self._snapshots: dict[str, list[dict[str, Any]]] = {}
        self._alerts: list[Alert] = []

    def take_snapshot(self, profile: InfluenceProfile) -> None:
        payload = profile.raw_data or {}
        raw_hash = hashlib.sha256(json.dumps(payload, sort_keys=True, default=str).encode()).hexdigest()
        snap = {
            "ts": datetime.now(UTC).isoformat(),
            "composite": profile.composite_score,
            "tier": profile.tier.value,
            "political": profile.political_score,
            "community": profile.community_score,
            "voter": profile.voter_score,
            "financial": profile.financial_score,
            "raw_data_hash": raw_hash,
        }
        self._snapshots.setdefault(profile.name, []).append(snap)

    def detect_changes(self, profile: InfluenceProfile) -> list[Alert]:
        history = self._snapshots.get(profile.name, [])
        if len(history) < 2:
            return []
        prev = history[-2]
        alerts: list[Alert] = []
        delta = profile.composite_score - float(prev["composite"])
        if abs(delta) >= 15:
            severity = "HIGH" if abs(delta) >= 25 else "MEDIUM"
            alerts.append(self._create_alert(profile.name, severity, f"Composite score shifted by {delta:+.1f} points"))
        if prev["tier"] != profile.tier.value:
            alerts.append(
                self._create_alert(
                    profile.name,
                    "HIGH",
                    f"Influence tier changed {prev['tier']} → {profile.tier.value}",
                )
            )
        self._alerts.extend(alerts)
        return alerts

    def check_sanctions_alert(self, profile: InfluenceProfile) -> list[Alert]:
        political = profile.raw_data.get("political", {})
        alerts: list[Alert] = []
        sanctions = int(political.get("sanctions_count") or 0)
        if sanctions >= 1:
            lists = political.get("sanctions_lists") or []
            list_names = ", ".join(str(x) for x in lists[:5]) or "unknown lists"
            alerts.append(
                self._create_alert(
                    profile.name,
                    "CRITICAL",
                    f"Sanctions match ({sanctions}) on: {list_names}",
                    {"sanctions_count": sanctions},
                )
            )
        if political.get("is_pep") and political.get("pep_confirmed"):
            alerts.append(self._create_alert(profile.name, "HIGH", "PEP status confirmed in OSINT sources"))
        self._alerts.extend(alerts)
        return alerts

    def check_news_surge(self, profile: InfluenceProfile) -> list[Alert]:
        history = self._snapshots.get(profile.name, [])
        community = profile.raw_data.get("community", {})
        mentions = int(community.get("news_mentions") or 0)
        prev_mentions = 0
        if len(history) >= 2:
            prev_mentions = int(history[-2].get("news_mentions") or 0)
        alerts: list[Alert] = []
        if mentions >= 10 and prev_mentions > 0 and mentions >= prev_mentions * 3:
            severity = "CRITICAL" if mentions >= 25 else "HIGH"
            alerts.append(
                self._create_alert(
                    profile.name,
                    severity,
                    f"News surge detected: {mentions} mentions (prev {prev_mentions})",
                    {"mentions": mentions},
                )
            )
        if history:
            history[-1]["news_mentions"] = mentions
        self._alerts.extend(alerts)
        return alerts

    def check_data_age(self, profile: InfluenceProfile, max_age_days: int = 14) -> list[Alert]:
        collected_at = profile.raw_data.get("collected_at")
        alerts: list[Alert] = []
        if not collected_at:
            return alerts
        try:
            ts = datetime.fromisoformat(str(collected_at).replace("Z", "+00:00"))
        except ValueError:
            return alerts
        age_days = (datetime.now(UTC) - ts).days
        if age_days > max_age_days:
            alerts.append(
                self._create_alert(
                    profile.name,
                    "LOW",
                    f"OSINT data stale ({age_days} days) — refresh recommended",
                )
            )
        self._alerts.extend(alerts)
        return alerts

    def get_active_alerts(self, severity: str | None = None, acknowledged: bool = False) -> list[dict[str, Any]]:
        items = [a for a in self._alerts if a.acknowledged == acknowledged]
        if severity:
            items = [a for a in items if a.severity.upper() == severity.upper()]
        return [
            {
                "alert_id": a.alert_id,
                "name": a.name,
                "severity": a.severity,
                "message": a.message,
                "created_at": a.created_at.isoformat(),
                "acknowledged": a.acknowledged,
                "metadata": a.metadata,
            }
            for a in sorted(items, key=lambda x: x.created_at, reverse=True)
        ]

    def acknowledge(self, alert_id: str) -> bool:
        for alert in self._alerts:
            if alert.alert_id == alert_id:
                alert.acknowledged = True
                return True
        return False

    def get_timeline(self, name: str) -> list[dict[str, Any]]:
        return list(self._snapshots.get(name, []))

    def summary(self) -> dict[str, Any]:
        active = [a for a in self._alerts if not a.acknowledged]
        by_severity: dict[str, int] = {}
        for alert in active:
            by_severity[alert.severity] = by_severity.get(alert.severity, 0) + 1
        return {"active_count": len(active), "by_severity": by_severity, "tracked_entities": len(self._snapshots)}

    def _create_alert(self, name: str, severity: str, message: str, metadata: dict[str, Any] | None = None) -> Alert:
        return Alert(
            alert_id=str(uuid.uuid4()),
            name=name,
            severity=severity,
            message=message,
            created_at=datetime.now(UTC),
            metadata=metadata or {},
        )
