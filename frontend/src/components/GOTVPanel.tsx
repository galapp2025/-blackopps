"use client";

import { Download, Loader2, RefreshCw, Send, Target } from "lucide-react";
import { useMemo, useState } from "react";

import { ChannelBar } from "@/components/ChannelBar";
import { Copyable } from "@/components/Copyable";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { GOTVCategoryCard } from "@/components/GOTVCategoryCard";
import { Skeleton } from "@/components/Skeleton";
import type { GOTVBattlePlan, GOTVPrediction } from "@/lib/types";

type GOTVPanelProps = {
  plan: GOTVBattlePlan | null;
  loading?: boolean;
  error?: string | null;
  onRefresh: () => void;
  onDispatch: (voter: GOTVPrediction) => void;
  onImportHint?: () => void;
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

const CHANNEL_COLORS = ["var(--accent-cyan)", "var(--accent-red)", "var(--accent-amber)", "var(--accent-emerald)", "var(--accent-blue)"];

export function GOTVPanel({ plan, loading, error, onRefresh, onDispatch, onImportHint }: GOTVPanelProps) {
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
  const channelTotal = Math.max(1, Object.values(channels).reduce((s, v) => s + Number(v || 0), 0));

  if (loading && !plan) {
    return (
      <div className="card-stagger grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton variant="stat" />
        <Skeleton variant="stat" />
        <Skeleton variant="stat" />
        <Skeleton variant="stat" />
      </div>
    );
  }

  if (!plan) {
    return (
      <EmptyState
        icon={<Target className="mx-auto h-10 w-10" />}
        title="אין נתוני GOTV עדיין"
        description="ייבא מצביעים כדי לראות תמונת GOTV מלאה — SAFE / LEANING / SWING / AT_RISK"
        action={{ label: onImportHint ? "עבור לייבוא" : "רענן GOTV", onClick: onImportHint || onRefresh }}
      />
    );
  }

  const cat = (key: string) => Number(categories[key] ?? categories[key.toUpperCase()] ?? 0);

  return (
    <div className="content-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="stat-title text-white">Battle Plan</h2>
          <p className="text-xs text-slate-500">{total.toLocaleString("he-IL")} מצביעים סווגו</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary text-xs" disabled={loading} onClick={onRefresh} aria-label="רענן נתוני GOTV">
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

      {error ? <ErrorState message={error} onRetry={onRefresh} /> : null}

      <div className="card-stagger grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <GOTVCategoryCard category="safe" count={cat("safe")} total={total} tone="safe" />
        <GOTVCategoryCard category="leaning" count={cat("leaning")} total={total} tone="leaning" />
        <GOTVCategoryCard category="swing" count={cat("swing")} total={total} tone="swing" />
        <GOTVCategoryCard category="at_risk" count={cat("at_risk") || cat("atrisk")} total={total} tone="risk" />
      </div>

      <div className="glass-panel rounded-3xl p-5">
        <h3 className="mb-4 text-sm font-semibold text-slate-200">פילוח ערוצים</h3>
        <div className="space-y-3">
          {Object.entries(channels).map(([name, value], i) => (
            <ChannelBar
              key={name}
              label={name}
              count={Number(value) || 0}
              total={channelTotal}
              color={CHANNEL_COLORS[i % CHANNEL_COLORS.length]}
            />
          ))}
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
                  <tr key={`${row.name}-${row.priority_score}`} className="border-t border-white/[0.04] transition-colors hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-medium text-white">
                      <Copyable text={row.name} />
                    </td>
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
