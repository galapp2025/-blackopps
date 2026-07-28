"use client";

type PersonalizationBadgeProps = {
  score: number;
};

export function PersonalizationBadge({ score }: PersonalizationBadgeProps) {
  const pct = Math.round(score * 100);
  const color = pct >= 80 ? "bg-green-500/20 text-green-300 ring-green-500/40" : pct >= 60 ? "bg-yellow-500/20 text-yellow-200 ring-yellow-500/40" : "bg-red-500/20 text-red-200 ring-red-500/40";
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${color}`}>
      התאמה אישית {pct}%
    </span>
  );
}
