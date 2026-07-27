import type { OsintProfile } from "@/lib/types/osint";

export type DashboardOperational = {
  flashAlert: string;
  actionableMessage: string;
  channel: string;
  trigger: string;
  avoid: string;
};

export type DashboardEntity = {
  id: string;
  name: string;
  profile: OsintProfile;
  metrics: Record<string, number>;
  operational: DashboardOperational;
};

export function profileToDashboardEntity(profile: OsintProfile, index: number): DashboardEntity {
  const channel =
    profile.tier === "HIGH" || profile.tier === "CRITICAL"
      ? "שיחת טלפון אישית מנציג"
      : "WhatsApp (הודעה מותאמת)";

  const metrics: Record<string, number> = {
    "ציון פוליטי": Math.round(profile.scores.political),
    "השפעה קהילתית": Math.round(profile.scores.community),
    "מדד בוחר": Math.round(profile.scores.voter),
    "מדד פיננסי": Math.round(profile.scores.financial),
    "ציון מורכב": Math.round(profile.scores.composite),
  };

  return {
    id: `ENT-${String(index + 1).padStart(3, "0")}`,
    name: profile.name,
    profile,
    metrics,
    operational: {
      flashAlert:
        profile.opportunities[0] ??
        profile.risks[0] ??
        "זוהה חלון השפעה קצר — מומלץ מגע ממוקד בתוך 48 שעות",
      actionableMessage: `שלום ${profile.name.split(" ")[0] ?? profile.name}, ${profile.engagement_strategy}`,
      channel,
      trigger: profile.recommendation,
      avoid: profile.risks.length > 0 ? profile.risks.join(" · ") : "מסרים גנריים ללא הקשר מקומי או אידאולוגי",
    },
  };
}
