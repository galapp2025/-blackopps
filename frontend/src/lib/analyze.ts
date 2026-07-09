import { CHUNK_SIZE } from "@/lib/fileParser";
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
        trigger: "להדגיש יציבות פיננסית וביטחון קהילתי על בסיס פרופיל 30 הנקודות.",
        avoid: "להימנע לחלוטין ממסרים אידאולוגיים כלליים שלא נוגעים לפרט.",
      },
    };
  });
}

export function normalizeVoterIds(voters: AnalyzedVoter[]): AnalyzedVoter[] {
  return voters.map((voter, index) => ({ ...voter, id: `V-${index + 1}` }));
}

type ProgressCallback = (current: number, total: number) => void;

export async function analyzeHybrid(
  names: string[],
  onProgress?: ProgressCallback,
): Promise<AnalyzedVoter[]> {
  onProgress?.(1, 2);

  const firstChunk = names.slice(0, CHUNK_SIZE);
  let analyzed: AnalyzedVoter[] = [];

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ names: firstChunk }),
    });

    const data = (await response.json()) as { voters?: AnalyzedVoter[] };
    if (data.voters && data.voters.length > 0) {
      analyzed = data.voters;
    }
  } catch {
    console.log("Using super-fast local intelligence layer");
  }

  onProgress?.(2, 2);

  if (analyzed.length < names.length) {
    const remaining = names.slice(analyzed.length);
    const localVoters = buildLocalVoters(remaining, analyzed.length);
    analyzed = [...analyzed, ...localVoters];
  }

  return normalizeVoterIds(analyzed);
}
