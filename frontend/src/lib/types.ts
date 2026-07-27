/** Shared API / UI types for BlackOpps dashboard */

export type HealthResponse = {
  status: string;
  service: string;
  version?: string;
  auth_configured?: boolean;
  rate_limiter?: string;
  modules?: string[];
};

export type PaginatedVoters = {
  voters: Voter[];
  total: number;
  limit: number;
  offset: number;
};

export type VoterQueryParams = {
  limit?: number;
  offset?: number;
  category?: string;
  search?: string;
};

export type CreateVoterInput = {
  first_name: string;
  last_name: string;
  national_id?: string;
  city?: string;
  neighborhood?: string;
  phone?: string;
  email?: string;
  support_score?: number;
  age?: number;
};

export type EnrichmentRow = {
  id: number | string;
  agent_key: string;
  status: string;
  confidence?: number | null;
  payload?: Record<string, unknown> | null;
  error_message?: string | null;
};

export type Voter = {
  id: string | number;
  national_id?: string;
  first_name: string;
  last_name: string;
  city?: string | null;
  neighborhood?: string | null;
  phone?: string | null;
  email?: string | null;
  age?: number | null;
  support_score?: number | null;
  turnout_score?: number | null;
  turnout_history?: number | null;
  gotv_category?: string | null;
  gotv_priority?: number | null;
  gotv_channel?: string | null;
  gotv_frequency?: string | null;
  gotv_message?: string | null;
  enriched_at?: string | null;
  created_at?: string;
  enrichments?: EnrichmentRow[];
};

export type ImportResult = {
  imported: number;
  duplicates: number;
  total: number;
  classified?: number;
  categories?: Record<string, number>;
  osint_enriched?: number;
  osint_samples?: Array<{
    name: string;
    composite?: number;
    tier?: string;
    political?: number;
    community?: number;
    voter_reliability?: number;
    financial?: number;
  }>;
  names?: string[];
  source?: "api" | "client";
};

export type EnrichmentScores = {
  political?: number;
  community?: number;
  voter?: number;
  financial?: number;
  composite?: number;
  [key: string]: number | undefined;
};

export type EnrichmentResult = {
  name: string;
  scores: EnrichmentScores;
  tier: string;
  confidence?: number;
  recommendation: string;
  engagement_strategy?: string;
  risks?: string[];
  opportunities?: string[];
  evidence?: string[];
  sources?: string[];
};

export type AnalysisResult = {
  profiles: EnrichmentResult[];
  summary: {
    total?: number;
    total_profiles?: number;
    tiers?: Record<string, number>;
    tier_distribution?: Record<string, number>;
    average_composite?: number;
    alerts?: unknown;
    network?: unknown;
  };
};

export type PredictInput = {
  name: string;
  support_score?: number;
  turnout_history?: number;
  first_name?: string;
  last_name?: string;
};

export type GOTVPrediction = {
  name: string;
  category: string;
  priority_score: number;
  optimal_channel: string;
  contact_frequency: string;
  messaging_frame: string;
  recommended_action?: string;
  category_confidence?: number;
  turnout_probability?: number;
  persuasion_score?: number;
};

export type GOTVBattlePlan = {
  classified: number;
  categories: Record<string, number>;
  battle_plan: {
    field_ops?: number | Record<string, number>;
    channels: Record<string, number>;
    top_swing: GOTVPrediction[];
    top_priority?: Array<{ name: string; category: string; priority_score: number }>;
  };
  voters?: GOTVPrediction[];
  raw?: unknown;
};

export type CandidateIntel = {
  name: string;
  composite: number;
  tier: string;
  dimensions: Record<string, number>;
  strengths: string[];
  weaknesses: string[];
  vulnerabilities: string[];
  attack_surface: string[];
  defensive_gaps: string[];
  advantages: string[];
};

export type ComparisonResult = {
  candidates: { a: CandidateIntel; b: CandidateIntel };
  head_to_head: {
    winner_composite: string;
    margin_composite: number;
    dimension_winners: Record<string, string>;
    dimension_margins: Record<string, number>;
  };
  network: { shared_connections: unknown[] };
  strategy: {
    recommended: string;
    key_battlegrounds: unknown[];
    escalation_scenarios: unknown[];
  };
};

export type AlertsResponse = {
  total?: number;
  by_severity?: Record<string, number>;
  alerts?: unknown[];
  recent?: unknown[];
  summary?: unknown;
};

export type NetworkGraph = {
  nodes?: unknown[];
  edges?: unknown[];
  hubs?: string[];
  [key: string]: unknown;
};

export type Timeline = {
  name?: string;
  timeline?: unknown[];
  changes?: unknown[];
};

export type Briefing = {
  name?: string;
  profile?: unknown;
  recommendations?: string[];
  [key: string]: unknown;
};

export type DispatchStats = {
  queued: number;
  in_progress: number;
  completed: number;
  failed: number;
  agents_active: number;
  queue?: string;
  length?: number;
};

export type DispatchInput = {
  voter_id?: string;
  voter_name?: string;
  channel: string;
  priority?: number;
  message?: string;
  message_template?: string;
};

export type DispatchTask = {
  task_id?: string;
  messageId?: string;
  status: string;
  channel?: string;
  voterId?: string | null;
  voterName?: string | null;
  queuedAt?: string;
};

export type DashboardTab = "osint" | "gotv" | "opposition" | "dispatch";
