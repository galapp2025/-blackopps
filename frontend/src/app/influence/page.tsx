"use client";

import { Loader2, Network } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { ErrorState } from "@/components/ErrorState";
import { api, ApiError } from "@/lib/api";
import { GOTV_COLORS, type InfluenceHub, type InfluenceMapGraph } from "@/lib/features";

export default function InfluencePage() {
  const [scanning, setScanning] = useState(true);
  const [hubs, setHubs] = useState<InfluenceHub[]>([]);
  const [graph, setGraph] = useState<InfluenceMapGraph | null>(null);
  const [filterNb, setFilterNb] = useState("");
  const [selected, setSelected] = useState<InfluenceHub | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setScanning(true);
    try {
      const [scan, map] = await Promise.all([
        api.influenceScan({ max_hubs: 100 }),
        api.influenceMap({ neighborhood: "all", depth: 2 }),
      ]);
      setHubs(scan.hubs);
      setGraph(map);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "סריקת רשת נכשלה");
    } finally {
      setScanning(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const neighborhoods = useMemo(() => {
    const set = new Set(hubs.map((h) => h.neighborhood).filter(Boolean));
    return Array.from(set).sort();
  }, [hubs]);

  const leaderboard = useMemo(() => {
    let list = [...hubs].sort((a, b) => b.influence_score - a.influence_score);
    if (filterNb) list = list.filter((h) => h.neighborhood === filterNb);
    return list.slice(0, 50);
  }, [hubs, filterNb]);

  const clusterStats = useMemo(() => {
    const m = new Map<string, number>();
    for (const h of hubs) {
      m.set(h.cluster, (m.get(h.cluster) || 0) + 1);
    }
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [hubs]);

  const displayNodes = useMemo(() => {
    if (!graph?.nodes?.length) return [];
    return graph.nodes
      .filter((n) => n.influence_score >= 40 || graph.nodes.indexOf(n) < 80)
      .slice(0, 120);
  }, [graph]);

  if (error && !hubs.length) {
    return (
      <AppShell active="influence" title="מיפוי רשת השפעה">
        <ErrorState message={error} onRetry={() => void load()} />
      </AppShell>
    );
  }

  return (
    <AppShell active="influence" title="מיפוי רשת השפעה" subtitle="זיהוי מרכזי קהילה וקשרים חברתיים">
      <div dir="rtl" className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-200">
              <Network className="h-4 w-4" aria-hidden />
              מפת קשרים
            </h2>
            {scanning ? <Loader2 className="h-4 w-4 animate-spin text-red-400" /> : null}
          </div>
          <div className="relative h-[420px] overflow-hidden rounded-xl bg-slate-950 touch-pan-x">
            {displayNodes.map((n, i) => {
              const r = 6 + (n.influence_score / 100) * 28;
              const angle = (i / displayNodes.length) * Math.PI * 2;
              const cx = 50 + Math.cos(angle) * 38;
              const cy = 50 + Math.sin(angle) * 38;
              const color = GOTV_COLORS[n.gotv?.toUpperCase()] || "#64748b";
              return (
                <button
                  key={n.id}
                  type="button"
                  className="absolute rounded-full border border-white/30 transition hover:scale-110"
                  style={{
                    width: r,
                    height: r,
                    right: `${cx}%`,
                    top: `${cy}%`,
                    transform: "translate(50%, -50%)",
                    background: color,
                  }}
                  title={n.label}
                  onClick={() => {
                    const hub = hubs.find((h) => h.hub_id === n.id);
                    if (hub) setSelected(hub);
                  }}
                />
              );
            })}
            {graph ? (
              <p className="absolute bottom-2 left-2 text-[10px] text-slate-500">
                {graph.stats.nodes.toLocaleString("he-IL")} צמתים · {graph.stats.edges.toLocaleString("he-IL")} קשתות ·{" "}
                {graph.stats.hubs} מרכזים
              </p>
            ) : null}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
            <label className="text-xs font-semibold text-slate-400">סינון שכונה</label>
            <select className="input mt-2 w-full" value={filterNb} onChange={(e) => setFilterNb(e.target.value)}>
              <option value="">כל השכונות</option>
              {neighborhoods.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
            <h3 className="mb-2 text-xs font-bold text-slate-300">התפלגות אשכולות</h3>
            <ul className="space-y-2">
              {clusterStats.map(([name, count]) => (
                <li key={name} className="flex items-center gap-2 text-xs">
                  <span className="flex-1 truncate text-slate-400">{name}</span>
                  <span className="font-mono text-slate-200">{count}</span>
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-800">
                    <div className="h-full bg-cyan-500/70" style={{ width: `${(count / (hubs.length || 1)) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="max-h-[320px] overflow-auto rounded-2xl border border-white/10 bg-slate-900/50 p-4">
            <h3 className="mb-2 text-xs font-bold text-slate-300">50 מרכזי השפעה מובילים</h3>
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-slate-500">
                  <th className="pb-2 text-right">שם</th>
                  <th className="pb-2">ציון</th>
                  <th className="pb-2 text-left">שכונה</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((h) => (
                  <tr
                    key={h.hub_id}
                    className="cursor-pointer border-t border-white/5 hover:bg-white/5"
                    onClick={() => setSelected(h)}
                  >
                    <td className="py-1.5 font-medium text-slate-200">{h.full_name}</td>
                    <td className="py-1.5 text-center tabular-nums text-emerald-400">{h.influence_score}</td>
                    <td className="py-1.5 text-left text-slate-500">{h.neighborhood}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </aside>
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal>
          <div dir="rtl" className="max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-xl">
            <h3 className="text-lg font-bold text-white">{selected.full_name}</h3>
            <dl className="mt-4 space-y-2 text-sm text-slate-300">
              <div className="flex justify-between">
                <dt>ציון השפעה</dt>
                <dd className="font-bold text-emerald-400">{selected.influence_score}</dd>
              </div>
              <div className="flex justify-between">
                <dt>טווח השפעה</dt>
                <dd>{selected.reach} בוחרים</dd>
              </div>
              <div className="flex justify-between">
                <dt>אשכול</dt>
                <dd>{selected.cluster}</dd>
              </div>
            </dl>
            <p className="mt-4 rounded-xl bg-red-500/10 p-3 text-xs text-red-100">{selected.recommended_approach}</p>
            <button type="button" className="btn-primary mt-4 w-full" onClick={() => setSelected(null)}>
              סגור
            </button>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
