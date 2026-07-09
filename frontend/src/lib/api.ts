const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type VoterListItem = {
  id: number;
  national_id: string;
  first_name: string;
  last_name: string;
  city: string | null;
  turnout_score: number | null;
  support_score: number | null;
};

export type Enrichment = {
  id: number;
  agent_key: string;
  status: string;
  confidence: number | null;
  payload: Record<string, unknown> | null;
  error_message: string | null;
};

export type Voter = VoterListItem & {
  neighborhood: string | null;
  age: number | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  enrichments: Enrichment[];
};

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function getHealth() {
  return api<{ status: string; service: string }>("/health");
}

export function listAgents() {
  return api<Record<string, string>>("/agents");
}

export function listVoters() {
  return api<VoterListItem[]>("/voters");
}

export function getVoter(id: number) {
  return api<Voter>(`/voters/${id}`);
}

export function createVoter(payload: {
  national_id: string;
  first_name: string;
  last_name: string;
  city?: string;
  age?: number;
  phone?: string;
}) {
  return api<Voter>("/voters", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function enrichVoter(id: number, agent_keys?: string[]) {
  return api<{ voter_id: number; task_ids: string[] }>(`/voters/${id}/enrich`, {
    method: "POST",
    body: JSON.stringify({ agent_keys }),
  });
}
