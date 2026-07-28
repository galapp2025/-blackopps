export type WarRoomOverview = {
  timestamp: string;
  totals: {
    voters: number;
    contacted_today: number;
    contacted_this_week: number;
    remaining: number;
  };
  gotv_distribution: Record<string, number>;
  gotv_trend: Record<string, { "7d_ago": number; now: number; delta: number }>;
  dispatch_queue: {
    pending: number;
    in_progress: number;
    completed_today: number;
    overdue: number;
  };
  alerts: { type: string; detail: string; severity: string; time: string }[];
  field_agents: { active: number; total: number; avg_contacts_per_hour: number };
  neighborhood_heatmap: { name: string; gotv: string; sentiment: string; trend: string }[];
  top_priorities: { type: string; target: string; deadline: string; urgency: string }[];
};

export type EmergencyDispatchResult = {
  dispatched: number;
  tasks: string[];
  mode: string;
  target_voters: { voter_id: unknown; name: string; gotv_category: string | null }[];
  estimated_completion: string;
};

export type GeneratedMessageBundle = {
  voter_id: string;
  full_name: string;
  gotv_category: string;
  neighborhood: string;
  osint_signals: string[];
  channels: Record<string, string>;
  target_topic: string;
  confidence: number;
};

export type BatchMessagesResult = {
  generated: number;
  voters: GeneratedMessageBundle[];
  topics_used: Record<string, number>;
};

export type MessageHistoryItem = {
  timestamp: string;
  channel: string;
  text: string;
};

export type InfluenceHub = {
  hub_id: string;
  full_name: string;
  neighborhood: string;
  age: number;
  influence_score: number;
  cluster: string;
  reach: number;
  cluster_voters: number;
  top_gotv_in_cluster: string;
  recommended_approach: string;
};

export type InfluenceScanResult = {
  hubs_found: number;
  hubs: InfluenceHub[];
  clusters_found: number;
  scan_duration_ms: number;
};

export type InfluenceMapGraph = {
  nodes: {
    id: string;
    label: string;
    influence_score: number;
    cluster: string;
    gotv: string;
  }[];
  edges: { from: string; to: string; weight: number; connection_type: string }[];
  stats: { nodes: number; edges: number; hubs: number; clusters: number };
};

export type InfluenceScoreResult = {
  voter_id: string;
  influence_score: number;
  reach: number;
  cluster: string;
  is_hub: boolean;
  percentile: number;
};

export type SentimentTrackResult = {
  sentiment_id: string;
  voter_id: string;
  previous_score: number;
  new_score: number;
  delta: number;
  source: string;
  alert_triggered: boolean;
  alert_type?: string;
  neighborhood_impact?: { name: string; score_change: number };
};

export type SentimentDashboard = {
  overall_score: number;
  trend: string;
  neighborhoods: {
    name: string;
    score: number;
    trend: string;
    voters_tracked: number;
    alert?: boolean;
  }[];
  alerts: {
    type: string;
    neighborhood: string;
    delta_7d: number;
    severity: string;
    timestamp: string;
  }[];
  score_distribution: Record<string, number>;
};

export type SentimentTrendResult = {
  voter_id: string;
  timeline: { date: string; score: number }[];
  trend_line: string;
  delta_30d: number;
};

export const GOTV_COLORS: Record<string, string> = {
  SAFE: "#22c55e",
  LEANING: "#3b82f6",
  SWING: "#eab308",
  AT_RISK: "#ef4444",
  LOST: "#64748b",
};

export function gotvLabel(cat: string): string {
  const m: Record<string, string> = {
    SAFE: "בטוח",
    LEANING: "נוטה",
    SWING: "מתנדנד",
    AT_RISK: "בסיכון",
    LOST: "אבוד",
  };
  return m[cat.toUpperCase()] || cat;
}

export function urgencyClass(u: string): string {
  if (u === "CRITICAL") return "border-red-500/60 bg-red-950/40";
  if (u === "HIGH") return "border-amber-500/50 bg-amber-950/30";
  return "border-slate-500/40 bg-slate-900/50";
}
