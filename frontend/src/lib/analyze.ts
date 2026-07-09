import { analyzeVoters, type AnalyzedVoter } from "@/lib/metrics";

const AI_BATCH_SIZE = 12;

export function buildLocalVoters(names: string[], startIndex = 0): AnalyzedVoter[] {
  return analyzeVoters(names).map((voter, index) => ({
    ...voter,
    id: `V-${startIndex + index + 1}`,
  }));
}

export function normalizeVoterIds(voters: AnalyzedVoter[]): AnalyzedVoter[] {
  return voters.map((voter, index) => ({ ...voter, id: `V-${index + 1}` }));
}

type ProgressCallback = (current: number, total: number) => void;

export async function analyzeWithIntelligence(
  names: string[],
  onProgress?: ProgressCallback,
): Promise<AnalyzedVoter[]> {
  onProgress?.(1, 2);

  const aiNames = names.slice(0, AI_BATCH_SIZE);
  let analyzed: AnalyzedVoter[] = [];

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ names: aiNames }),
    });

    if (response.ok) {
      const data = (await response.json()) as { voters?: AnalyzedVoter[] };
      if (data.voters && data.voters.length > 0) {
        analyzed = data.voters;
      }
    }
  } catch {
    console.log("Falling back to local intelligence layer");
  }

  onProgress?.(2, 2);

  if (analyzed.length === 0) {
    analyzed = buildLocalVoters(aiNames);
  }

  if (names.length > analyzed.length) {
    const remaining = names.slice(analyzed.length);
    const localVoters = buildLocalVoters(remaining, analyzed.length);
    analyzed = [...analyzed, ...localVoters];
  }

  return normalizeVoterIds(analyzed);
}

export function analyzeLocally(names: string[]): AnalyzedVoter[] {
  return normalizeVoterIds(buildLocalVoters(names));
}
