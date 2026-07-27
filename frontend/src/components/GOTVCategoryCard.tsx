"use client";

type GOTVCategoryCardProps = {
  category: string;
  count: number;
  total: number;
  tone: "safe" | "leaning" | "swing" | "risk";
};

const TONE: Record<GOTVCategoryCardProps["tone"], { box: string; icon?: string }> = {
  safe: { box: "border-emerald-500/30 bg-emerald-500/10 text-emerald-100" },
  leaning: { box: "border-sky-500/30 bg-sky-500/10 text-sky-100" },
  swing: { box: "border-amber-500/30 bg-amber-500/10 text-amber-100", icon: "⚠️" },
  risk: { box: "border-red-500/30 bg-red-500/10 text-red-100", icon: "🚨" },
};

const LABELS: Record<string, string> = {
  safe: "SAFE",
  leaning: "LEANING",
  swing: "SWING",
  at_risk: "AT_RISK",
  atrisk: "AT_RISK",
};

export function GOTVCategoryCard({ category, count, total, tone }: GOTVCategoryCardProps) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const style = TONE[tone];
  const label = LABELS[category.toLowerCase()] || category.toUpperCase();

  return (
    <div className={`rounded-2xl border px-4 py-4 ${style.box}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold tracking-wide">{label}</p>
        {style.icon ? <span aria-hidden>{style.icon}</span> : null}
      </div>
      <p className="mt-2 font-mono text-3xl font-extrabold tabular-nums">{count}</p>
      <p className="mt-1 text-xs opacity-80">{pct}%</p>
    </div>
  );
}
