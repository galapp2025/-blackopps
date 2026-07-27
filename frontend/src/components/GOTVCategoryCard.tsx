"use client";

import { AlertTriangle, Shield, ShieldAlert, TrendingUp } from "lucide-react";

import { AnimatedCounter } from "@/components/AnimatedCounter";

type GOTVCategoryCardProps = {
  category: string;
  count: number;
  total: number;
  tone: "safe" | "leaning" | "swing" | "risk";
};

const TONE: Record<
  GOTVCategoryCardProps["tone"],
  { ring: string; glow: string; label: string; Icon: typeof Shield }
> = {
  safe: {
    ring: "#10b981",
    glow: "from-emerald-500/20 to-transparent",
    label: "SAFE",
    Icon: Shield,
  },
  leaning: {
    ring: "#3b82f6",
    glow: "from-blue-500/20 to-transparent",
    label: "LEANING",
    Icon: TrendingUp,
  },
  swing: {
    ring: "#f59e0b",
    glow: "from-amber-500/20 to-transparent",
    label: "SWING",
    Icon: AlertTriangle,
  },
  risk: {
    ring: "#ef4444",
    glow: "from-red-500/20 to-transparent",
    label: "AT_RISK",
    Icon: ShieldAlert,
  },
};

export function GOTVCategoryCard({ category: _category, count, total, tone }: GOTVCategoryCardProps) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const style = TONE[tone];
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  const Icon = style.Icon;

  return (
    <div className={`glass-panel relative overflow-hidden rounded-3xl bg-gradient-to-br ${style.glow} p-4`}>
      <div className="flex items-center justify-between gap-2">
        <p className="stat-caption text-slate-300">{style.label}</p>
        <Icon className="h-4 w-4 opacity-80" style={{ color: style.ring }} aria-hidden />
      </div>
      <div className="mt-3 flex items-center gap-4">
        <svg width="88" height="88" viewBox="0 0 88 88" className="shrink-0" role="img" aria-label={`${pct} אחוז`}>
          <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(30,41,59,0.9)" strokeWidth="8" />
          <circle
            cx="44"
            cy="44"
            r={r}
            fill="none"
            stroke={style.ring}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            transform="rotate(-90 44 44)"
            className="transition-all duration-1000 ease-out"
          />
          <text x="44" y="48" textAnchor="middle" fill="#e2e8f0" fontSize="14" fontWeight="700">
            {pct}%
          </text>
        </svg>
        <div>
          <AnimatedCounter value={count} className="font-mono text-3xl font-extrabold tabular-nums text-white" />
          <p className="mt-1 text-xs text-slate-400">מתוך {total.toLocaleString("he-IL")}</p>
        </div>
      </div>
    </div>
  );
}
