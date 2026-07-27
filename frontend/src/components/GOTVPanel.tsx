"use client";

import { Download, Loader2, RefreshCw, Send } from "lucide-react";
import { useMemo, useState } from "react";

import { GOTVCategoryCard } from "@/components/GOTVCategoryCard";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import type { GOTVBattlePlan, GOTVPrediction } from "@/lib/types";

type GOTVPanelProps = {
  plan: GOTVBattlePlan | null;
  loading?: boolean;
  error?: string | null;
  onRefresh: () => void;
  onDispatch: (voter: GOTVPrediction) => void;
};

function downloadBlob(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function GOTVPanel({ plan, loading, error, onRefresh, onDispatch }: GOTVPanelProps) {
  const [sortAsc, setSortAsc] = useState(false);

  const categories = plan?.categories || {};
  const total =
    plan?.classified ||
    Object.values(categories).reduce((a, b) => a + Number(b || 0), 0) ||
    0;

  const swingRows = useMemo(() => {
    const rows = [...(plan?.battle_plan.top_swing || plan?.voters?.filter((v) => v.category.toUpperCase() === "SWING") || [])];
    rows.sort((a, b) => (sortAsc ? a.priority_score - b.priority_score : b.priority_score - a.priority_score));
    return rows;
  }, [plan, sortAsc]);

  const channels = plan?.battle_plan.channels || {};
  const channelMax = Math.max(1, ...Object.values(channels).map(Number));

  if (loading && !plan) return <LoadingSkeleton rows={4} />;

  if (!plan) {
    return (
      <div className="glass-panel rounded-3xl p-10 text-center">
        <p className="text-sm text-slate-400">ייבא מצביעים כדי לראות תמונת GOTV</p>
        <button type="button" className="btn-primary mt-4" onClick={onRefresh}>
          רענן GOTV
        </button>
      </div>
    );
  }

  const cat = (key: string) => Number(categories[key] ?? categories[key.toUpperCase()] ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">Battle Plan</h2>
          <p className="text-xs text-slate-500">{total} מצביעים סווגו</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary text-xs" disabled={loading} onClick={onRefresh}>
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            רענן GOTV
          </button>
          <button
            type="button"
            className="btn-secondary text-xs"
            onClick={() => {
              const header = "שם,עדיפות,ערוץ,תדירות,מסר\n";
              const body = swingRows
                .map((r) =>
                  [r.name, r.priority_score, r.optimal_channel, r.contact_frequency, `"${(r.messaging_frame || "").replace(/"/g, '""')}"`].join(","),
                )
                .join("\n");
              downloadBlob("gotv-swing.csv", header + body, "text/csv;charset=utf-8");
            }}
          >
            <Download className="h-3.5 w-3.5" />
            ייצא CSV
          </button>
          <button
            type="button"
            className="btn-secondary text-xs"
            onClick={() => downloadBlob("battle-plan.json", JSON.stringify(plan, null, 2), "application/json")}
          >
            <Download className="h-3.5 w-3.5" />
            הורד Battle Plan JSON
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-100" role="alert">
          {error}
          <button type="button" className="btn-ghost ms-3 text-red-200" onClick={onRefresh}>
            נסה שוב
          </button>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <GOTVCategoryCard category="safe" count={cat("safe")} total={total} tone="safe" />
        <GOTVCategoryCard category="leaning" count={cat("leaning")} total={total} tone="leaning" />
        <GOTVCategoryCard category="swing" count={cat("swing")} total={total} tone="swing" />
        <GOTVCategoryCard category="at_risk" count={cat("at_risk") || cat("atrisk")} total={total} tone="risk" />
      </div>

      <div className="glass-panel rounded-3xl p-5">
        <h3 className="mb-4 text-sm font-semibold text-slate-200">פילוח ערוצים</h3>
        <div className="space-y-3">
          {Object.entries(channels).map(([name, value]) => {
            const n = Number(value) || 0;
            const pct = Math.round((n / channelMax) * 100);
            return (
              <div key={name}>
                <div className="mb-1 flex justify-between text-xs text-slate-400">
                  <span>{name}</span>
                  <span className="font-mono tabular-nums">{n}</span>
                </div>
                <svg viewBox="0 0 100 6" className="h-2 w-full overflow-visible" aria-hidden>
                  <rect x="0" y="0" width="100" height="6" rx="3" fill="rgba(30,41,59,0.9)" />
                  <rect x="0" y="0" width={pct} height="6" rx="3" fill="url(#chGrad)" />
                  <defs>
                    <linearGradient id="chGrad" x1="0" x2="1">
                      <stop offset="0%" stopColor="#22d3ee" />
                      <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            );
          })}
        </div>
      </div>

      <div className="glass-panel overflow-hidden rounded-3xl">
        <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
          <h3 className="text-sm font-semibold text-white">מצביעי SWING מובילים</h3>
          <button type="button" className="btn-ghost text-xs" onClick={() => setSortAsc((s) => !s)}>
            מיון לפי עדיפות {sortAsc ? "↑" : "↓"}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-right text-sm">
            <thead className="bg-slate-950/60 text-xs text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">שם</th>
                <th className="px-4 py-3 font-medium">עדיפות</th>
                <th className="px-4 py-3 font-medium">ערוץ</th>
                <th className="px-4 py-3 font-medium">תדירות</th>
                <th className="px-4 py-3 font-medium">מסר</th>
                <th className="px-4 py-3 font-medium">פעולה</th>
              </tr>
            </thead>
            <tbody>
              {swingRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    אין מצביעי SWING כרגע
                  </td>
                </tr>
              ) : (
                swingRows.map((row) => (
                  <tr key={`${row.name}-${row.priority_score}`} className="border-t border-white/[0.04] hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-medium text-white">{row.name}</td>
                    <td className="px-4 py-3 font-mono tabular-nums text-cyan-300">{row.priority_score}</td>
                    <td className="px-4 py-3 text-slate-300">{row.optimal_channel}</td>
                    <td className="px-4 py-3 text-slate-400">{row.contact_frequency}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-slate-400">{row.messaging_frame}</td>
                    <td className="px-4 py-3">
                      <button type="button" className="btn-secondary text-xs" onClick={() => onDispatch(row)}>
                        <Send className="h-3.5 w-3.5" />
                        שלח למשימה
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
