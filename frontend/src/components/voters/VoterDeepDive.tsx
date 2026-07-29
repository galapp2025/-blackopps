"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { useToast } from "@/components/Toast";
import { Button } from "@/components/ui/Button";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { StatCard } from "@/components/ui/StatCard";
import { VoterDetailPanel } from "@/components/voters/VoterDetailPanel";
import { api, ApiError } from "@/lib/api";
import type { Voter } from "@/lib/types";

const GOTV_FILTERS = [
  { id: "", label: "הכל" },
  { id: "SAFE", label: "SAFE" },
  { id: "LEANING", label: "LEANING" },
  { id: "SWING", label: "SWING" },
  { id: "AT_RISK", label: "AT_RISK" },
] as const;

const GOTV_COLORS: Record<string, string> = {
  SAFE: "bg-green-500/15 text-green-300",
  LEANING: "bg-blue-500/15 text-blue-300",
  SWING: "bg-amber-500/15 text-amber-300",
  AT_RISK: "bg-red-500/15 text-red-300",
  safe: "bg-green-500/15 text-green-300",
  leaning: "bg-blue-500/15 text-blue-300",
  swing: "bg-amber-500/15 text-amber-300",
  at_risk: "bg-red-500/15 text-red-300",
};

const PAGE_SIZE = 25;

function useDebounced(value: string, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function VoterDeepDive() {
  const { push: toast } = useToast();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 300);
  const [gotv, setGotv] = useState("");
  const [offset, setOffset] = useState(0);
  const [voters, setVoters] = useState<Voter[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [summary, setSummary] = useState<{
    total_analyzed: number;
    avg_confidence: number;
    top_concerns: string[];
  } | null>(null);
  const [intelScores, setIntelScores] = useState<Record<string, number>>({});
  const [sortKey, setSortKey] = useState<"name" | "neighborhood" | "gotv">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, sum] = await Promise.all([
        api.getVoters({
          limit: PAGE_SIZE,
          offset,
          search: debouncedSearch || undefined,
          category: gotv || undefined,
        }),
        api.voterIntelSummary("all", gotv || "all").catch(() => null),
      ]);
      setVoters(list.voters);
      setTotal(list.total);
      if (sum) {
        setSummary({
          total_analyzed: sum.total_analyzed,
          avg_confidence: sum.avg_confidence,
          top_concerns: sum.top_concerns,
        });
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "טעינת בוחרים נכשלה");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, gotv, offset]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setOffset(0);
  }, [debouncedSearch, gotv]);

  const counts = useMemo(() => {
    const c = { SAFE: 0, LEANING: 0, SWING: 0, AT_RISK: 0 };
    for (const v of voters) {
      const g = String(v.gotv_category || "").toUpperCase().replace("-", "_");
      if (g in c) c[g as keyof typeof c] += 1;
    }
    return c;
  }, [voters]);

  const sorted = useMemo(() => {
    const arr = [...voters];
    arr.sort((a, b) => {
      let av = "";
      let bv = "";
      if (sortKey === "name") {
        av = `${a.first_name} ${a.last_name}`;
        bv = `${b.first_name} ${b.last_name}`;
      } else if (sortKey === "neighborhood") {
        av = a.neighborhood || "";
        bv = b.neighborhood || "";
      } else {
        av = a.gotv_category || "";
        bv = b.gotv_category || "";
      }
      const cmp = av.localeCompare(bv, "he");
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [voters, sortKey, sortDir]);

  function toggleSort(key: typeof sortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  async function buildIntel(voterId: string) {
    try {
      const res = await api.deepVoterProfile(voterId);
      const score = res.intel?.intelligence_assessment?.confidence_score ?? res.intelligence_score ?? 0;
      setIntelScores((prev) => ({ ...prev, [voterId]: score }));
      setSelectedId(voterId);
      toast({ type: "success", message: "פרופיל מודיעין מוכן" });
    } catch (e) {
      toast({ type: "error", message: e instanceof ApiError ? e.message : "יצירת מודיעין נכשלה" });
    }
  }

  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="סה״כ בוחרים" value={total.toLocaleString("he-IL")} icon="👥" />
        <StatCard label="SWING בעמוד" value={counts.SWING} icon="⚖️" color="text-amber-400" />
        <StatCard
          label="פרופילי מודיעין"
          value={summary?.total_analyzed ?? "—"}
          icon="🕵️"
          color="text-[var(--brand-gold)]"
        />
        <StatCard
          label="ביטחון ממוצע"
          value={summary ? Math.round(summary.avg_confidence) : "—"}
          icon="📊"
        />
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-white/[0.06] bg-[var(--bg-card)] p-6 sm:flex-row sm:items-center">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="חיפוש לפי שם, שכונה או מזהה…"
          className="input min-h-12 flex-1 text-base"
          aria-label="חיפוש בוחרים"
        />
        <div className="flex flex-wrap gap-2">
          {GOTV_FILTERS.map((f) => (
            <button
              key={f.id || "all"}
              type="button"
              onClick={() => setGotv(f.id)}
              className={`min-h-12 rounded-xl px-4 text-sm font-medium transition ${
                gotv === f.id
                  ? "bg-[var(--brand-blue)] text-white"
                  : "bg-white/5 text-[var(--text-secondary)] hover:bg-white/10"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}

      {loading ? (
        <LoadingSkeleton lines={10} />
      ) : sorted.length === 0 ? (
        <EmptyState
          icon="📭"
          title="לא נמצאו בוחרים"
          description="נסו לשנות את החיפוש או את מסנן ה-GOTV"
          action={{ label: "נקה סינון", onClick: () => { setSearch(""); setGotv(""); } }}
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-[var(--bg-card)]">
          <table className="w-full min-w-[720px] text-right text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-[var(--text-muted)]">
                <th className="cursor-pointer p-4 font-medium" onClick={() => toggleSort("name")}>
                  שם
                </th>
                <th
                  className="cursor-pointer p-4 font-medium"
                  onClick={() => toggleSort("neighborhood")}
                >
                  שכונה
                </th>
                <th className="cursor-pointer p-4 font-medium" onClick={() => toggleSort("gotv")}>
                  GOTV
                </th>
                <th className="p-4 font-medium">ציון מודיעין</th>
                <th className="p-4 font-medium">דאגה עיקרית</th>
                <th className="p-4 font-medium">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((v) => {
                const id = String(v.id);
                const g = String(v.gotv_category || "").toUpperCase();
                const score = intelScores[id];
                return (
                  <tr
                    key={id}
                    className="cursor-pointer border-b border-white/[0.04] transition hover:bg-white/[0.03]"
                    onClick={() => setSelectedId(id)}
                  >
                    <td className="p-4 font-medium text-white">
                      {v.first_name} {v.last_name}
                    </td>
                    <td className="p-4 text-[var(--text-secondary)]">{v.neighborhood || "—"}</td>
                    <td className="p-4">
                      <span
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium ${GOTV_COLORS[g] || GOTV_COLORS.SWING}`}
                      >
                        {g || "—"}
                      </span>
                    </td>
                    <td className="p-4">
                      {typeof score === "number" ? (
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-20 overflow-hidden rounded-full bg-white/10">
                            <div
                              className="h-full bg-[var(--brand-gold)]"
                              style={{ width: `${score}%` }}
                            />
                          </div>
                          <span className="text-xs text-[var(--text-muted)]">{score}</span>
                        </div>
                      ) : (
                        <span className="text-[var(--text-muted)]">—</span>
                      )}
                    </td>
                    <td className="p-4 text-[var(--text-secondary)]">
                      {summary?.top_concerns?.[0] || "חינוך"}
                    </td>
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setSelectedId(id)}>
                          צפה
                        </Button>
                        <Link href={`/writer?voter_id=${encodeURIComponent(id)}`}>
                          <Button size="sm" variant="outline">
                            צור מסר
                          </Button>
                        </Link>
                        <Link href={`/whatsapp?voter_id=${encodeURIComponent(id)}`}>
                          <Button size="sm" variant="gold">
                            וואטסאפ
                          </Button>
                        </Link>
                        <Button size="sm" variant="primary" onClick={() => void buildIntel(id)}>
                          מודיעין
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-[var(--text-muted)]">
          עמוד {page} מתוך {pages} · {total.toLocaleString("he-IL")} בוחרים
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={offset <= 0}
            onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
          >
            הקודם
          </Button>
          <Button
            variant="outline"
            disabled={offset + PAGE_SIZE >= total}
            onClick={() => setOffset((o) => o + PAGE_SIZE)}
          >
            הבא
          </Button>
          <Button variant="ghost" onClick={() => void load()}>
            רענן
          </Button>
        </div>
      </div>

      {selectedId ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/50"
            aria-label="סגור פאנל"
            onClick={() => setSelectedId(null)}
          />
          <VoterDetailPanel voterId={selectedId} onClose={() => setSelectedId(null)} />
        </>
      ) : null}
    </div>
  );
}
