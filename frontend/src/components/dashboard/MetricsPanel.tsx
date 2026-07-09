import { BarChart3 } from "lucide-react";

import { type AnalyzedVoter } from "@/lib/metrics";

type MetricsPanelProps = {
  voter: AnalyzedVoter;
};

function scoreTone(value: number): string {
  if (value >= 85) return "from-rose-500 to-orange-400";
  if (value >= 75) return "from-red-500 to-red-400";
  return "from-amber-500 to-yellow-400";
}

export function MetricsPanel({ voter }: MetricsPanelProps) {
  return (
    <section className="glass-panel rounded-3xl p-6 lg:col-span-2">
      <div className="mb-5 flex items-center justify-between gap-3 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 ring-1 ring-red-500/20">
            <BarChart3 className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">פרופיל אסטרטגי</p>
            <h3 className="text-lg font-bold text-white">{voter.name}</h3>
          </div>
        </div>
        <span className="rounded-full bg-slate-900 px-3 py-1 text-xs text-slate-400 ring-1 ring-white/5">30 נקודות</span>
      </div>

      <div className="custom-scrollbar grid max-h-[560px] grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
        {Object.entries(voter.metrics).map(([name, value], index) => (
          <div
            key={name}
            className="animate-fade-up rounded-2xl border border-white/5 bg-slate-950/50 p-3.5 transition-all hover:border-white/10 hover:bg-slate-900/60"
            style={{ animationDelay: `${Math.min(index * 20, 240)}ms` }}
          >
            <div className="mb-2 flex items-start justify-between gap-3 text-xs">
              <span className="leading-5 text-slate-400">{name}</span>
              <span className="font-mono text-sm font-bold text-red-300">{value}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-800/90">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${scoreTone(value)} transition-all duration-700`}
                style={{ width: `${value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
