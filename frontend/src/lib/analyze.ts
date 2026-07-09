import { chunkNames } from "@/lib/fileParser";
import { type AnalyzedVoter } from "@/lib/metrics";

type ProgressCallback = (current: number, total: number) => void;

export async function analyzeInChunks(
  names: string[],
  onProgress?: ProgressCallback,
): Promise<AnalyzedVoter[]> {
  const chunks = chunkNames(names);
  let allAnalyzedVoters: AnalyzedVoter[] = [];

  for (let i = 0; i < chunks.length; i++) {
    onProgress?.(i + 1, chunks.length);

    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ names: chunks[i] }),
    });

    const data = (await response.json()) as { voters?: AnalyzedVoter[] };
    if (!data.voters || data.voters.length === 0) {
      throw new Error(`Failed to analyze chunk ${i + 1}`);
    }

    const mappedVoters = data.voters.map((voter, idx) => ({
      ...voter,
      id: `V-${allAnalyzedVoters.length + idx + 1}`,
    }));

    allAnalyzedVoters = [...allAnalyzedVoters, ...mappedVoters];
  }

  return allAnalyzedVoters;
}
