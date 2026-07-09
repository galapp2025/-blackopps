"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import {
  createVoter,
  enrichVoter,
  getVoter,
  listAgents,
  listVoters,
  type Voter,
  type VoterListItem,
} from "@/lib/api";

function scoreBadge(score: number | null) {
  if (score === null) return "—";
  return `${Math.round(score * 100)}%`;
}

export default function Home() {
  const [voters, setVoters] = useState<VoterListItem[]>([]);
  const [agents, setAgents] = useState<Record<string, string>>({});
  const [selectedVoter, setSelectedVoter] = useState<Voter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [voterRows, agentMap] = await Promise.all([listVoters(), listAgents()]);
      setVoters(voterRows);
      setAgents(agentMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    try {
      const voter = await createVoter({
        national_id: String(form.get("national_id")),
        first_name: String(form.get("first_name")),
        last_name: String(form.get("last_name")),
        city: String(form.get("city") || "") || undefined,
        age: form.get("age") ? Number(form.get("age")) : undefined,
        phone: String(form.get("phone") || "") || undefined,
      });
      await refresh();
      const details = await getVoter(voter.id);
      setSelectedVoter(details);
      event.currentTarget.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create voter");
    } finally {
      setBusy(false);
    }
  }

  async function handleSelect(voterId: number) {
    setBusy(true);
    setError(null);
    try {
      const details = await getVoter(voterId);
      setSelectedVoter(details);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load voter");
    } finally {
      setBusy(false);
    }
  }

  async function handleEnrich(voterId: number) {
    setBusy(true);
    setError(null);
    try {
      await enrichVoter(voterId);
      const details = await getVoter(voterId);
      setSelectedVoter(details);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to trigger enrichment");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">Election Enrichment Engine</p>
            <h1 className="text-2xl font-semibold">מנוע העשרת בוחרים</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/roadmap"
              className="rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-1.5 text-sm font-medium text-slate-400 transition-colors hover:border-red-900/50 hover:text-red-500"
            >
              יכולות מבצעיות (בפיתוח) ⚡
            </Link>
            <div className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300">
              {Object.keys(agents).length || 24} סוכני העשרה
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-medium">בוחרים</h2>
              <button
                type="button"
                onClick={() => void refresh()}
                className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm hover:bg-slate-800"
              >
                רענון
              </button>
            </div>

            {loading ? (
              <p className="text-slate-400">טוען...</p>
            ) : voters.length === 0 ? (
              <p className="text-slate-400">אין בוחרים עדיין. הוסף בוחר ראשון בטופס.</p>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-800">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-950 text-left text-slate-400">
                    <tr>
                      <th className="px-4 py-3">שם</th>
                      <th className="px-4 py-3">עיר</th>
                      <th className="px-4 py-3">הגעה</th>
                      <th className="px-4 py-3">תמיכה</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {voters.map((voter) => (
                      <tr key={voter.id} className="border-t border-slate-800">
                        <td className="px-4 py-3">
                          {voter.first_name} {voter.last_name}
                        </td>
                        <td className="px-4 py-3">{voter.city ?? "—"}</td>
                        <td className="px-4 py-3">{scoreBadge(voter.turnout_score)}</td>
                        <td className="px-4 py-3">{scoreBadge(voter.support_score)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => void handleSelect(voter.id)}
                            className="text-cyan-300 hover:text-cyan-200"
                          >
                            פרטים
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="mb-4 text-lg font-medium">הוספת בוחר</h2>
            <form onSubmit={handleCreate} className="grid gap-3 sm:grid-cols-2">
              <input name="national_id" required placeholder="תעודת זהות" className="input" />
              <input name="phone" placeholder="טלפון" className="input" />
              <input name="first_name" required placeholder="שם פרטי" className="input" />
              <input name="last_name" required placeholder="שם משפחה" className="input" />
              <input name="city" placeholder="עיר" className="input" />
              <input name="age" type="number" min={18} max={120} placeholder="גיל" className="input" />
              <button
                type="submit"
                disabled={busy}
                className="sm:col-span-2 rounded-xl bg-cyan-500 px-4 py-3 font-medium text-slate-950 hover:bg-cyan-400 disabled:opacity-60"
              >
                שמירה
              </button>
            </form>
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-medium">פרטי בוחר והעשרות</h2>
              {selectedVoter ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleEnrich(selectedVoter.id)}
                  className="rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-medium text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
                >
                  הפעלת 24 סוכנים
                </button>
              ) : null}
            </div>

            {!selectedVoter ? (
              <p className="text-slate-400">בחר בוחר מהטבלה כדי לראות סטטוס העשרה.</p>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-lg font-medium">
                    {selectedVoter.first_name} {selectedVoter.last_name}
                  </p>
                  <p className="text-sm text-slate-400">{selectedVoter.national_id}</p>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div>עיר: {selectedVoter.city ?? "—"}</div>
                    <div>גיל: {selectedVoter.age ?? "—"}</div>
                    <div>הגעה: {scoreBadge(selectedVoter.turnout_score)}</div>
                    <div>תמיכה: {scoreBadge(selectedVoter.support_score)}</div>
                  </div>
                </div>

                <div className="max-h-[28rem] space-y-2 overflow-y-auto">
                  {selectedVoter.enrichments.length === 0 ? (
                    <p className="text-sm text-slate-400">טרם הופעלה העשרה לבוחר זה.</p>
                  ) : (
                    selectedVoter.enrichments.map((enrichment) => (
                      <div
                        key={enrichment.id}
                        className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-medium">{agents[enrichment.agent_key] ?? enrichment.agent_key}</p>
                            <p className="text-xs text-slate-500">{enrichment.agent_key}</p>
                          </div>
                          <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs uppercase">
                            {enrichment.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="mb-4 text-lg font-medium">סוכני העשרה</h2>
            <div className="grid max-h-80 gap-2 overflow-y-auto sm:grid-cols-2">
              {Object.entries(agents).map(([key, label]) => (
                <div key={key} className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm">
                  <p className="font-medium">{label}</p>
                  <p className="text-xs text-slate-500">{key}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {error ? (
        <div className="fixed bottom-6 left-1/2 max-w-lg -translate-x-1/2 rounded-xl border border-red-500/40 bg-red-950 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}
    </div>
  );
}
