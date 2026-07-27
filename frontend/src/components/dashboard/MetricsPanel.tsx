import { BarChart3 } from "lucide-react";

import { SectionHeader } from "@/components/ui/SectionHeader";
import { TierBadge } from "@/components/ui/TierBadge";
import { type DashboardEntity } from "@/lib/types/dashboard";

type MetricsPanelProps = {
  voter: DashboardEntity;
};

function scoreTone(value: number): string {
  if (value >= 75) return "from-rose-500 to-orange-400";
  if (value >= 55) return "from-red-500 to-red-400";
  return "from-amber-500 to-yellow-400";
}

export function MetricsPanel({ voter }: MetricsPanelProps) {
  const confidence = Math.round(voter.profile.confidence * 100);

  return (
    <section className="glass-panel rounded-3xl p-6 lg:col-span-2">
      <SectionHeader
        eyebrow="פרופיל אסטרטגי"
        title={voter.name}
        icon={BarChart3}
        trailing={<TierBadge tier={voter.profile.tier} />}
      />

      <p className="mb-4 text-xs text-slate-500">
        ביטחון מודל <span className="font-mono text-slate-400">{confidence}%</span>
      </p>

      {voter.profile.evidence.length > 0 ? (
        <div className="mb-4 grid gap-2 sm:grid-cols-2">
          {voter.profile.evidence.slice(0, 6).map((line) => (
            <div
              key={line}
              className="rounded-xl border border-cyan-500/10 bg-cyan-500/[0.04] px-3 py-2.5 text-xs leading-relaxed text-cyan-100/90"
            >
              {line}
            </div>
          ))}
        </div>
      ) : null}

      {voter.profile.sources.length > 0 ? (
        <p className="mb-4 text-xs text-slate-500">
          מקורות: <span className="text-slate-400">{voter.profile.sources.join(" · ")}</span>
        </p>
      ) : null}

      <div className="custom-scrollbar grid max-h-[320px] grid-cols-1 gap-2.5 overflow-y-auto pr-1 sm:grid-cols-2">
        {Object.entries(voter.metrics).map(([name, value], index) => (
          <div
            key={name}
            className="rounded-2xl border border-white/[0.05] bg-slate-950/40 p-3.5 transition-colors hover:border-white/[0.08] hover:bg-slate-900/50"
            style={{ animationDelay: `${Math.min(index * 20, 200)}ms` }}
          >
            <div className="mb-2 flex items-start justify-between gap-3 text-xs">
              <span className="leading-5 text-slate-400">{name}</span>
              <span className="font-mono text-sm font-bold tabular-nums text-red-300">{value}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-800/90">
              <div
                className={`h-full rounded-full bg-gradient-to-l ${scoreTone(value)} transition-all duration-700 ease-out`}
                style={{ width: `${Math.min(100, value)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
