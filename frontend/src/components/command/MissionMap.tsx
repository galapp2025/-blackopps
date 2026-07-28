"use client";

import { AnimatedNumber } from "@/components/AnimatedNumber";
import { ChannelBar } from "@/components/ChannelBar";
import type { GOTVBattlePlan } from "@/lib/types";

type MissionMapProps = {
  plan: GOTVBattlePlan | null;
  loading?: boolean;
};

export function MissionMap({ plan, loading }: MissionMapProps) {
  const categories = plan?.categories || {};
  const total =
    plan?.classified ||
    Object.values(categories).reduce((a, b) => a + Number(b || 0), 0) ||
    0;
  const cat = (k: string) => Number(categories[k] ?? 0);

  const rows = [
    { key: "safe", label: "SAFE", count: cat("safe"), color: "var(--accent-emerald)" },
    { key: "leaning", label: "LEAN", count: cat("leaning"), color: "var(--accent-blue)" },
    { key: "swing", label: "SWING", count: cat("swing"), color: "var(--accent-amber)" },
    { key: "at_risk", label: "RISK", count: cat("at_risk"), color: "var(--accent-red)" },
  ];

  return (
    <div className="glass-panel live-pulse rounded-3xl p-5 sm:p-6">
      <p className="tactical-header mb-1">Mission Map — GOTV</p>
      <p className="command-text mb-4 text-slate-400">
        {loading ? "מעדכן תמונת שטח…" : total ? `${total.toLocaleString("he-IL")} מסווגים` : "אין נתונים — ייבא מצביעים"}
      </p>
      <div className="space-y-3">
        {rows.map((r) => (
          <ChannelBar key={r.key} label={r.label} count={r.count} total={Math.max(total, 1)} color={r.color} />
        ))}
      </div>
      {cat("swing") > 0 ? (
        <p className="mt-4 animate-pulse-soft rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
          🚨 <AnimatedNumber value={cat("swing")} className="font-mono font-bold" /> SWING voters need action
        </p>
      ) : null}
    </div>
  );
}
