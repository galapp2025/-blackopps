import { type AnalyzedVoter, metricsList } from "@/lib/metrics";

export function buildLocalVoters(names: string[], startIndex = 0): AnalyzedVoter[] {
  return names.map((name, index) => {
    const metrics: Record<string, number> = {};
    metricsList.forEach((metric) => {
      metrics[metric] = Math.floor(Math.random() * 41) + 60;
    });

    const absoluteIndex = startIndex + index;
    return {
      id: `V-${absoluteIndex + 1}`,
      name,
      metrics,
      recommendations: {
        channel: absoluteIndex % 2 === 0 ? "WhatsApp (הודעה מותאמת)" : "שיחת טלפון אישית מנציג",
        trigger: "להדגיש יציבות פיננסית וביטחון קהילתי על בסיס פרופיל 30 הנקודות המלא.",
        avoid: "להימנע לחלוטין ממסרים אידאולוגיים כלליים שלא נוגעים לפרט.",
      },
    };
  });
}

export function normalizeVoterIds(voters: AnalyzedVoter[]): AnalyzedVoter[] {
  return voters.map((voter, index) => ({ ...voter, id: `V-${index + 1}` }));
}

export function analyzeLocally(names: string[]): AnalyzedVoter[] {
  return normalizeVoterIds(buildLocalVoters(names));
}
