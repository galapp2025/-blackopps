"use client";

import type { ReactNode } from "react";

type StatCardProps = {
  label: string;
  value: ReactNode;
  trend?: number;
  icon?: ReactNode;
  color?: string;
};

export function StatCard({ label, value, trend, icon, color }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[var(--bg-card)] p-5 shadow-[var(--shadow-card)]">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm text-[var(--text-muted)]">{label}</span>
        {icon ? <span className="text-lg">{icon}</span> : null}
      </div>
      <div className={`text-3xl font-bold ${color || "text-white"}`}>{value}</div>
      {typeof trend === "number" ? (
        <div className="mt-1 flex items-center gap-1">
          <span className={trend > 0 ? "text-green-400" : "text-red-400"}>
            {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
          <span className="text-xs text-[var(--text-muted)]">מאתמול</span>
        </div>
      ) : null}
    </div>
  );
}
