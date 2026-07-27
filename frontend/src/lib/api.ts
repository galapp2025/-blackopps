import type {
  AlertsResponse,
  AnalysisResult,
  Briefing,
  ComparisonResult,
  CreateVoterInput,
  DispatchInput,
  DispatchStats,
  DispatchTask,
  EnrichmentResult,
  GOTVBattlePlan,
  GOTVPrediction,
  HealthResponse,
  ImportResult,
  NetworkGraph,
  PaginatedVoters,
  PredictInput,
  Timeline,
  Voter,
  VoterQueryParams,
} from "@/lib/types";

export type { Voter, CreateVoterInput, HealthResponse, PaginatedVoters };

export const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "https://blackopps-api-production.up.railway.app"
).replace(/\/$/, "");

export const API_URL = API_BASE;

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ApiOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  isFormData?: boolean;
};

function getApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("blackopps-api-key") ||
    process.env.NEXT_PUBLIC_DEFAULT_API_KEY ||
    null
  );
}

function hebrewError(status: number, code: string, detail: string): string {
  if (status === 401 || code === "unauthorized") return "מפתח API לא תקין";
  if (status === 429 || code === "rate_limited") return "חריגה ממגבלת בקשות — נסה שוב בעוד רגע";
  if (status >= 500) return "השרת לא זמין כרגע";
  if (detail && !detail.startsWith("{") && detail.length < 200) return detail;
  return `שגיאת שרת (${status || "רשת"})`;
}

async function request<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const apiKey = getApiKey();
  const headers: Record<string, string> = { ...(options.headers ?? {}) };
  if (apiKey) headers["X-API-Key"] = apiKey;
  if (!options.isFormData) headers["Content-Type"] = "application/json";

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: options.method || "GET",
      headers,
      body: options.isFormData
        ? (options.body as FormData)
        : options.body !== undefined
          ? JSON.stringify(options.body)
          : undefined,
      cache: "no-store",
    });
  } catch {
    throw new ApiError("network", "השרת לא זמין — בדוק חיבור או כתובת API");
  }

  if (res.status === 429) throw new ApiError("rate_limited", hebrewError(429, "rate_limited", ""), 429);
  if (res.status === 401) throw new ApiError("unauthorized", hebrewError(401, "unauthorized", ""), 401);

  const contentType = res.headers.get("content-type") || "";

  if (!res.ok) {
    const err = await res.json().catch(() => ({} as Record<string, unknown>));
    const detail =
      (typeof err.detail === "string" && err.detail) ||
      (typeof err.error === "string" && err.error) ||
      (Array.isArray(err.detail) ? JSON.stringify(err.detail) : "") ||
      `HTTP ${res.status}`;
    const code = typeof err.error === "string" ? err.error : "unknown";
    throw new ApiError(code, hebrewError(res.status, code, detail), res.status);
  }

  if (contentType.includes("application/pdf")) {
    return (await res.blob()) as unknown as T;
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

function normalizeVoter(raw: Record<string, unknown>): Voter {
  return {
    id: (raw.id as string | number) ?? "",
    national_id: (raw.national_id as string) || undefined,
    first_name: String(raw.first_name ?? ""),
    last_name: String(raw.last_name ?? ""),
    city: (raw.city as string) ?? null,
    neighborhood: (raw.neighborhood as string) ?? null,
    phone: (raw.phone as string) ?? null,
    email: (raw.email as string) ?? null,
    age: (raw.age as number) ?? null,
    support_score: (raw.support_score as number) ?? null,
    turnout_score: (raw.turnout_score as number) ?? null,
    turnout_history: (raw.turnout_history as number) ?? null,
    gotv_category: (raw.gotv_category as string) ?? null,
    gotv_priority: (raw.gotv_priority as number) ?? null,
    gotv_channel: (raw.gotv_channel as string) ?? null,
    gotv_frequency: (raw.gotv_frequency as string) ?? null,
    gotv_message: (raw.gotv_message as string) ?? null,
    enriched_at: (raw.enriched_at as string) ?? null,
    created_at: (raw.created_at as string) || undefined,
    enrichments: Array.isArray(raw.enrichments) ? (raw.enrichments as Voter["enrichments"]) : [],
  };
}

function normalizePaginated(data: unknown, params?: VoterQueryParams): PaginatedVoters {
  if (Array.isArray(data)) {
    const voters = data.map((v) => normalizeVoter(v as Record<string, unknown>));
    return {
      voters,
      total: voters.length,
      limit: params?.limit ?? voters.length,
      offset: params?.offset ?? 0,
    };
  }
  const obj = (data || {}) as Record<string, unknown>;
  const list = (obj.voters as unknown[]) || [];
  return {
    voters: list.map((v) => normalizeVoter(v as Record<string, unknown>)),
    total: Number(obj.total ?? list.length),
    limit: Number(obj.limit ?? params?.limit ?? 100),
    offset: Number(obj.offset ?? params?.offset ?? 0),
  };
}

function normalizeProfile(raw: Record<string, unknown>): EnrichmentResult {
  const scores = (raw.scores as Record<string, number>) || {};
  return {
    name: String(raw.name ?? ""),
    scores: {
      political: scores.political ?? 0,
      community: scores.community ?? 0,
      voter: scores.voter ?? 0,
      financial: scores.financial ?? 0,
      composite: scores.composite ?? (raw.composite_score as number) ?? 0,
    },
    tier: String(raw.tier ?? "UNKNOWN"),
    confidence: raw.confidence as number | undefined,
    recommendation: String(raw.recommendation ?? raw.engagement_strategy ?? ""),
    engagement_strategy: raw.engagement_strategy as string | undefined,
    risks: (raw.risks as string[]) || [],
    opportunities: (raw.opportunities as string[]) || [],
    evidence: (raw.evidence as string[]) || [],
    sources: (raw.sources as string[]) || [],
  };
}

function channelCountsFromBattle(battle: Record<string, unknown>, voters: GOTVPrediction[]) {
  const resource = (battle.resource_allocation as Record<string, number>) || {};
  const channels: Record<string, number> = {
    WhatsApp: Number(resource.whatsapp_blasts ?? 0),
    Phone: Number(resource.phone_bank_hours ?? 0),
    Door: Number(resource.door_knocks ?? 0),
    SMS: 0,
  };
  for (const v of voters) {
    const ch = v.optimal_channel || "WhatsApp";
    const key =
      /whatsapp/i.test(ch) ? "WhatsApp" : /phone|טלפון/i.test(ch) ? "Phone" : /door|דלת/i.test(ch) ? "Door" : /sms/i.test(ch) ? "SMS" : ch;
    channels[key] = (channels[key] || 0) + 1;
  }
  return channels;
}

function normalizeGotv(data: unknown): GOTVBattlePlan {
  const obj = (data || {}) as Record<string, unknown>;
  const battle = (obj.battle_plan as Record<string, unknown>) || (obj.battleplan as Record<string, unknown>) || {};
  const rawVoters = ((obj.voters as unknown[]) || []).map((v) => {
    const row = v as Record<string, unknown>;
    return {
      name: String(row.name ?? ""),
      category: String(row.category ?? "UNKNOWN"),
      priority_score: Number(row.priority_score ?? 0),
      optimal_channel: String(row.optimal_channel ?? "WhatsApp"),
      contact_frequency: String(row.contact_frequency ?? "—"),
      messaging_frame: String(row.messaging_frame ?? ""),
      recommended_action: row.recommended_action as string | undefined,
      category_confidence: row.category_confidence as number | undefined,
      turnout_probability: row.turnout_probability as number | undefined,
      persuasion_score: row.persuasion_score as number | undefined,
    } satisfies GOTVPrediction;
  });

  let categories = (obj.categories as Record<string, number>) || {};
  if (!Object.keys(categories).length) {
    const segments = (battle.segments as Record<string, unknown[]>) || {};
    categories = {
      safe: (segments.SAFE || []).length,
      leaning: (segments.LEANING || []).length,
      swing: (segments.SWING || []).length,
      at_risk: (segments.AT_RISK || []).length,
      lost: (segments.LOST || []).length,
    };
    if (!Object.values(categories).some(Boolean) && rawVoters.length) {
      categories = { safe: 0, leaning: 0, swing: 0, at_risk: 0, lost: 0 };
      for (const v of rawVoters) {
        const k = v.category.toLowerCase().replace("-", "_");
        categories[k] = (categories[k] || 0) + 1;
      }
    }
  }

  const topSwing =
    ((battle.top_swing as GOTVPrediction[]) || []).length > 0
      ? (battle.top_swing as GOTVPrediction[])
      : rawVoters.filter((v) => v.category.toUpperCase() === "SWING").sort((a, b) => b.priority_score - a.priority_score);

  const channels =
    (battle.channels as Record<string, number>) && Object.keys(battle.channels as object).length
      ? (battle.channels as Record<string, number>)
      : channelCountsFromBattle(battle, rawVoters);

  return {
    classified: Number(obj.classified ?? rawVoters.length),
    categories,
    battle_plan: {
      field_ops: (battle.field_ops as number | Record<string, number>) ?? battle.resource_allocation,
      channels,
      top_swing: topSwing,
      top_priority: battle.top_priority as GOTVBattlePlan["battle_plan"]["top_priority"],
    },
    voters: rawVoters,
    raw: data,
  };
}

function toCandidate(
  name: string,
  profile: Record<string, unknown> | undefined,
  advantages: string[],
  attack: string[],
): ComparisonResult["candidates"]["a"] {
  const scores = (profile?.scores as Record<string, number>) || {};
  const risks = (profile?.risks as string[]) || [];
  const opps = (profile?.opportunities as string[]) || [];
  return {
    name,
    composite: Number(profile?.composite_score ?? scores.composite ?? 0),
    tier: String(profile?.tier ?? "UNKNOWN"),
    dimensions: {
      political: Number(scores.political ?? 0),
      community: Number(scores.community ?? 0),
      voter: Number(scores.voter ?? 0),
      financial: Number(scores.financial ?? 0),
    },
    strengths: opps,
    weaknesses: risks,
    vulnerabilities: risks,
    attack_surface: attack,
    defensive_gaps: risks.length ? risks : ["לא זוהו פערים הגנתיים"],
    advantages,
  };
}

function normalizeCompare(data: unknown, nameA: string, nameB: string): ComparisonResult {
  const obj = (data || {}) as Record<string, unknown>;

  if (obj.candidates && typeof obj.candidates === "object") {
    return data as ComparisonResult;
  }

  const profiles = (obj.profiles as Record<string, Record<string, unknown>>) || {};
  const aName = String(obj.candidate_a ?? nameA);
  const bName = String(obj.candidate_b ?? nameB);
  const aProf = profiles[aName] || Object.values(profiles)[0];
  const bProf = profiles[bName] || Object.values(profiles)[1];
  const advantages = (obj.asymmetric_advantages as Record<string, string[]>) || {};
  const attacks = (obj.attack_surfaces as Record<string, string[]>) || {};
  const winners = (obj.dimension_winners as Record<string, string>) || {};
  const margin = Math.abs(Number(obj.composite_delta ?? 0));

  return {
    candidates: {
      a: toCandidate(aName, aProf, advantages[aName] || [], attacks[aName] || []),
      b: toCandidate(bName, bProf, advantages[bName] || [], attacks[bName] || []),
    },
    head_to_head: {
      winner_composite: String(winners.composite ?? (Number(obj.composite_delta ?? 0) >= 0 ? aName : bName)),
      margin_composite: margin,
      dimension_winners: winners,
      dimension_margins: {},
    },
    network: { shared_connections: (obj.shared_connections as unknown[]) || [] },
    strategy: {
      recommended: String(obj.recommended_strategy ?? ""),
      key_battlegrounds: Object.entries(winners)
        .filter(([k, v]) => k !== "composite" && v !== "tie")
        .map(([dim, who]) => `${dim}: ${who}`),
      escalation_scenarios: (obj.escalation_scenarios as unknown[]) || [],
    },
  };
}

function normalizeDispatchStats(data: unknown): DispatchStats {
  const obj = (data || {}) as Record<string, unknown>;
  const length = Number(obj.length ?? obj.queued ?? 0);
  return {
    queued: length,
    in_progress: Number(obj.in_progress ?? 0),
    completed: Number(obj.completed ?? 0),
    failed: Number(obj.failed ?? 0),
    agents_active: Number(obj.agents_active ?? (length > 0 ? 1 : 0)),
    queue: obj.queue as string | undefined,
    length,
  };
}

export const api = {
  health: () => request<HealthResponse>("/health"),

  getVoters: async (params: VoterQueryParams = {}) => {
    const qs = new URLSearchParams();
    if (params.limit != null) qs.set("limit", String(params.limit));
    if (params.offset != null) qs.set("offset", String(params.offset));
    if (params.category) qs.set("category", params.category);
    if (params.search) qs.set("search", params.search);
    const q = qs.toString();
    const data = await request<unknown>(`/voters${q ? `?${q}` : ""}`);
    return normalizePaginated(data, params);
  },

  getVoter: async (id: string | number) => {
    const data = await request<Record<string, unknown>>(`/voters/${id}`);
    return normalizeVoter(data);
  },

  createVoter: (data: CreateVoterInput) =>
    request<Voter>("/voters", { method: "POST", body: data }),

  updateVoter: (id: string | number, data: Partial<Voter>) =>
    request<Voter>(`/voters/${id}`, { method: "PATCH", body: data }),

  importVoters: async (file: File): Promise<ImportResult> => {
    const fd = new FormData();
    fd.append("file", file);
    try {
      const result = await request<ImportResult & { gotv?: { classified?: number; categories?: Record<string, number> } }>(
        "/voters/import",
        { method: "POST", body: fd, isFormData: true },
      );
      return {
        imported: result.imported ?? 0,
        duplicates: result.duplicates ?? 0,
        total: result.total ?? (result.imported ?? 0) + (result.duplicates ?? 0),
        classified: result.classified ?? result.gotv?.classified,
        categories: result.categories ?? result.gotv?.categories,
        source: "api",
      };
    } catch (err) {
      if (err instanceof ApiError && (err.status === 404 || err.status === 405)) {
        throw err;
      }
      throw err;
    }
  },

  enrichVoter: (id: string | number) =>
    request<Record<string, unknown>>(`/voters/${id}/enrich`, { method: "POST", body: {} }),

  analyze: async (names: string[]) => {
    const data = await request<AnalysisResult>("/analyze", {
      method: "POST",
      body: { names, location: "", jurisdiction: "il" },
    });
    return {
      profiles: (data.profiles || []).map((p) => normalizeProfile(p as unknown as Record<string, unknown>)),
      summary: data.summary || {},
    } satisfies AnalysisResult;
  },

  predict: (data: PredictInput) =>
    request<Record<string, unknown>>("/predict", {
      method: "POST",
      body: {
        name: data.name,
        support_score: data.support_score,
        turnout_history: data.turnout_history,
        features: {
          support: data.support_score ?? 0.5,
          turnout: data.turnout_history ?? 0.55,
        },
      },
    }),

  gotv: async (voters?: PredictInput[]) => {
    const body = voters?.length
      ? {
          voters: voters.map((v) => ({
            name: v.name,
            support_score: v.support_score ?? 0.5,
            turnout_history: v.turnout_history ?? 0.55,
          })),
        }
      : {};
    try {
      const data = await request<unknown>("/intel/gotv", { method: "POST", body });
      return normalizeGotv(data);
    } catch (err) {
      if (voters?.length && err instanceof ApiError) {
        const data = await request<unknown>("/intel/gotv", {
          method: "POST",
          body: { names: voters.map((v) => v.name) },
        });
        return normalizeGotv(data);
      }
      if (!voters?.length) {
        const listed = await api.getVoters({ limit: 200 });
        const names = listed.voters
          .map((v) => `${v.first_name} ${v.last_name}`.trim())
          .filter(Boolean)
          .slice(0, 100);
        if (!names.length) throw err;
        const data = await request<unknown>("/intel/gotv", {
          method: "POST",
          body: { names },
        });
        return normalizeGotv(data);
      }
      throw err;
    }
  },

  gotvByNames: async (names: string[]) => {
    const data = await request<unknown>("/intel/gotv", {
      method: "POST",
      body: { names },
    });
    return normalizeGotv(data);
  },

  compare: async (nameA: string, nameB: string) => {
    try {
      const data = await request<unknown>("/intel/compare", {
        method: "POST",
        body: { name_a: nameA, name_b: nameB, candidate_a: nameA, candidate_b: nameB },
      });
      return normalizeCompare(data, nameA, nameB);
    } catch {
      const qs = new URLSearchParams({
        candidate_a: nameA,
        candidate_b: nameB,
        jurisdiction: "il",
      });
      const data = await request<unknown>(`/intel/compare?${qs.toString()}`, { method: "POST" });
      return normalizeCompare(data, nameA, nameB);
    }
  },

  getAlerts: async () => {
    const data = await request<AlertsResponse>("/intel/alerts");
    const alerts = data.alerts || data.recent || [];
    return {
      ...data,
      total: data.total ?? (Array.isArray(alerts) ? alerts.length : 0),
      recent: data.recent || alerts,
      alerts,
    };
  },

  getNetwork: (name: string) =>
    request<NetworkGraph>(`/intel/network/${encodeURIComponent(name)}`),

  getTimeline: (name: string) =>
    request<Timeline>(`/intel/timeline/${encodeURIComponent(name)}`),

  getBriefing: (name: string) =>
    request<Briefing>(`/intel/briefing/${encodeURIComponent(name)}`),

  getBriefingPdf: (name: string) =>
    request<Blob>(`/intel/briefing/${encodeURIComponent(name)}/pdf`),

  getDispatchStats: async () => {
    const data = await request<unknown>("/dispatch/queue/stats");
    return normalizeDispatchStats(data);
  },

  dispatch: async (data: DispatchInput) => {
    const result = await request<DispatchTask>("/dispatch", {
      method: "POST",
      body: {
        voter_id: data.voter_id,
        voterId: data.voter_id,
        voter_name: data.voter_name,
        voterName: data.voter_name,
        channel: data.channel,
        priority: data.priority ?? 50,
        message: data.message || undefined,
        message_template: data.message_template || "civic_duty",
      },
    });
    return {
      ...result,
      task_id: result.task_id || result.messageId || "",
      status: result.status || "queued",
    };
  },
};

// Backwards-compatible named exports used by older components
export const getHealth = api.health;
export const getDispatchQueueStats = api.getDispatchStats;
export const analyzeOsint = api.analyze;
export function getIntelNetwork(name: string, depth = 2) {
  return api.getNetwork(name).then((data) => {
    // attach depth query for backends that support it
    void depth;
    return data as import("@/lib/types/osint").NetworkCluster & Record<string, unknown>;
  });
}

export function getIntelTimeline(name: string) {
  return api.getTimeline(name).then((data) => ({
    timeline: (data.timeline || data.changes || []) as import("@/lib/types/osint").TimelinePoint[],
  }));
}

export function getIntelBriefing(name: string) {
  return api.getBriefing(name) as Promise<import("@/lib/types/osint").Briefing>;
}

export function getIntelAlerts(severity?: string) {
  return api.getAlerts().then((data) => ({
    alerts: (data.alerts || data.recent || []) as import("@/lib/types/osint").IntelAlert[],
    severity,
  }));
}
export const dispatchMessage = (payload: {
  voterId?: string;
  voterName?: string;
  channel?: string;
  message: string;
}) =>
  api.dispatch({
    voter_id: payload.voterId,
    voter_name: payload.voterName,
    channel: payload.channel || "WhatsApp",
    message: payload.message,
  });

export function listVoters() {
  return api.getVoters({ limit: 200 }).then((r) => r.voters);
}

export function getVoter(id: number | string) {
  return api.getVoter(id);
}

export function createVoter(payload: CreateVoterInput & { national_id?: string; age?: number }) {
  return api.createVoter(payload);
}

export function enrichVoter(id: number | string, _agent_keys?: string[]) {
  return api.enrichVoter(id);
}

export function listAgents() {
  return request<Record<string, unknown>>("/agents").then((data) => {
    if (data && typeof data === "object" && "enrichment_agents" in data) {
      return (data.enrichment_agents as Record<string, string>) || {};
    }
    // legacy flat map
    const flat: Record<string, string> = {};
    for (const [k, v] of Object.entries(data || {})) {
      if (typeof v === "string") flat[k] = v;
    }
    return flat;
  });
}

export type VoterListItem = Voter;
