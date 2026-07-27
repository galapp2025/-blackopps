import { analyzeOsint } from "@/lib/api";
import type { EnrichmentResult } from "@/lib/types";
import type { AnalyzeSummary, OsintProfile } from "@/lib/types/osint";
import { type DashboardEntity, profileToDashboardEntity } from "@/lib/types/dashboard";

const BATCH_SIZE = 3;

type ProgressCallback = (current: number, total: number) => void;

function toOsintProfile(p: EnrichmentResult): OsintProfile {
  return {
    name: p.name,
    scores: {
      political: p.scores.political ?? 0,
      community: p.scores.community ?? 0,
      voter: p.scores.voter ?? 0,
      financial: p.scores.financial ?? 0,
      composite: p.scores.composite ?? 0,
    },
    tier: p.tier,
    confidence: p.confidence ?? 0,
    recommendation: p.recommendation,
    engagement_strategy: p.engagement_strategy ?? p.recommendation,
    risks: p.risks ?? [],
    opportunities: p.opportunities ?? [],
    evidence: p.evidence ?? [],
    sources: p.sources ?? [],
  };
}

export async function analyzeWithIntelligence(
  names: string[],
  onProgress?: ProgressCallback,
): Promise<{ entities: DashboardEntity[]; summary: AnalyzeSummary | null }> {
  const cleaned = names.map((n) => n.trim()).filter(Boolean);
  if (cleaned.length === 0) {
    return { entities: [], summary: null };
  }

  const batches: string[][] = [];
  for (let i = 0; i < cleaned.length; i += BATCH_SIZE) {
    batches.push(cleaned.slice(i, i + BATCH_SIZE));
  }

  const entities: DashboardEntity[] = [];
  let summary: AnalyzeSummary | null = null;

  for (let i = 0; i < batches.length; i += 1) {
    onProgress?.(i + 1, batches.length);
    const { profiles, summary: batchSummary } = await analyzeOsint(batches[i]);
    summary = {
      total_profiles: batchSummary.total_profiles ?? batchSummary.total ?? profiles.length,
      tier_distribution: batchSummary.tier_distribution ?? batchSummary.tiers ?? {},
      average_composite: batchSummary.average_composite ?? 0,
      alerts: batchSummary.alerts,
      network: batchSummary.network,
    };
    for (const profile of profiles) {
      entities.push(profileToDashboardEntity(toOsintProfile(profile), entities.length));
    }
  }

  return { entities, summary };
}
