export type OsintScores = {
  political: number;
  community: number;
  voter: number;
  financial: number;
  composite: number;
};

export type OsintProfile = {
  name: string;
  scores: OsintScores;
  tier: string;
  confidence: number;
  recommendation: string;
  engagement_strategy: string;
  risks: string[];
  opportunities: string[];
  evidence: string[];
  sources: string[];
};

export type AnalyzeSummary = {
  total_profiles: number;
  tier_distribution: Record<string, number>;
  average_composite: number;
  alerts?: unknown;
  network?: unknown;
  hubs?: unknown[];
};

export type AnalyzeOsintResponse = {
  profiles: OsintProfile[];
  summary: AnalyzeSummary;
};

export type IntelAlert = {
  severity?: string;
  message?: string;
  entity?: string;
  [key: string]: unknown;
};

export type NetworkCluster = {
  entity: string;
  cluster: Array<{ entity: string; via: string; relation: string; weight: number }>;
  size: number;
  hub_count: number;
};

export type TimelinePoint = {
  ts: string;
  composite: number;
  tier: string;
  political: number;
  community: number;
  voter: number;
  financial: number;
  news_mentions?: number;
};

export type Briefing = {
  classification: string;
  name: string;
  composite_score: number;
  tier: string;
  confidence: number;
  dimension_scores: OsintScores;
  recommendation: string;
  engagement_strategy: string;
  risks: string[];
  opportunities: string[];
  evidence: string[];
  sources: string[];
  alerts: IntelAlert[];
  network_cluster?: NetworkCluster;
  timeline?: TimelinePoint[];
};
