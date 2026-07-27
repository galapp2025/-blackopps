import type { DashboardEntity } from "@/lib/types/dashboard";

export function averageCompositeScore(entities: DashboardEntity[]): number {
  if (entities.length === 0) return 0;
  const total = entities.reduce((sum, e) => sum + e.profile.scores.composite, 0);
  return Math.round((total / entities.length) * 10) / 10;
}

export function highTierCount(entities: DashboardEntity[]): number {
  return entities.filter((e) => ["HIGH", "CRITICAL"].includes(e.profile.tier)).length;
}

export function tierDistribution(entities: DashboardEntity[]): Record<string, number> {
  const dist: Record<string, number> = {};
  for (const entity of entities) {
    dist[entity.profile.tier] = (dist[entity.profile.tier] ?? 0) + 1;
  }
  return dist;
}
