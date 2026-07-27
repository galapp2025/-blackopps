"use client";

type InfluenceScoreBarProps = {
  label: string;
  value: number;
  max?: number;
  color?: string;
};

export function InfluenceScoreBar({ label, value, max = 100, color = "from-cyan-500 to-red-500" }: InfluenceScoreBarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className="font-mono tabular-nums text-slate-200">{Math.round(value)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-800/90">
        <div
          className={`h-full rounded-full bg-gradient-to-l ${color} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
