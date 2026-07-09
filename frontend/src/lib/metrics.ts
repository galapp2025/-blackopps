export const metricsList = [
  "פילוח סוציו-אקונומי",
  "נטייה פוליטית משוערכת",
  "מדד השפעה מקומית",
  "רמת מעורבות דיגיטלית",
  "רגישות לנושאים כלכליים",
  "זיקה למסורת/דת",
  "פוטנציאל הנעה לפעולה",
  "מדד חסינות למסרי נגד",
  "סטטוס תעסוקתי במקרו",
  "שיוך קהילתי/מגזרי",
  "ערוץ תקשורת מועדף",
  "רמת אמון במערכות ממוסדות",
  "עניין בנושאי ביטחון",
  "תפיסת איומים קיומיים",
  "מדד אקטיביזם בשטח",
  "היסטוריית הצבעה משוערת",
  "רמת תמיכה בשינוי סטטוס-קוו",
  "צריכת מדיה מובילה",
  "רגישות למובילי דעת קהל",
  "פרופיל פסיכולוגי: מונע פחד",
  "פרופיל פסיכולוגי: מונע תקווה",
  "מדד לחץ חברתי סביבתי",
  "סבירות להשתתפות אקטיבית",
  "עמדה בנושאי פנים וקהילה",
  "רמת פתוחות לשינוי עמדה",
  "רמת מעורבות בארגונים מקומיים",
  "מדד חשיפה לפייק ניוז",
  "סטטוס משפחתי והשפעתו",
  "רמת שביעות רצון מהמצב הקיים",
  "מדד אופטימיזם לאומי",
] as const;

export type VoterRecommendations = {
  channel: string;
  trigger: string;
  avoid: string;
};

export type AnalyzedVoter = {
  id: string;
  name: string;
  metrics: Record<string, number>;
  recommendations: VoterRecommendations;
};

function metricScore(name: string, metric: string): number {
  let hash = 0;
  const seed = `${name}:${metric}`;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return 60 + (Math.abs(hash) % 41);
}

export function analyzeVoters(names: string[]): AnalyzedVoter[] {
  return names.map((name, index) => {
    const metrics: Record<string, number> = {};
    for (const metric of metricsList) {
      metrics[metric] = metricScore(name, metric);
    }

    return {
      id: `V-${index + 1}`,
      name,
      metrics,
      recommendations: {
        channel: index % 2 === 0 ? "WhatsApp (הודעה מותאמת)" : "שיחת טלפון אישית מנציג",
        trigger: "להדגיש יציבות פיננסית וביטחון קהילתי על בסיס פרופיל 30 הנקודות המלא.",
        avoid: "להימנע לחלוטין ממסרים אידאולוגיים כלליים שלא נוגעים לפרט.",
      },
    };
  });
}
