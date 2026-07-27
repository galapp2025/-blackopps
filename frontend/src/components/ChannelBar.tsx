"use client";

type ChannelBarProps = {
  label: string;
  count: number;
  total: number;
  color?: string;
};

export function ChannelBar({ label, count, total, color = "var(--accent-cyan)" }: ChannelBarProps) {
  const pct = total > 0 ? Math.min(100, (count / total) * 100) : 0;

  return (
    <div className="space-y-1" role="group" aria-label={`${label}: ${count}`}>
      <div className="flex justify-between text-sm text-slate-300">
        <span>{label}</span>
        <span className="stat-mono tabular-nums text-cyan-200">{count.toLocaleString("he-IL")}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-800" aria-hidden>
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}
