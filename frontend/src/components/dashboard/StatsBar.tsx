import { Activity, Crosshair, Radar, Users } from "lucide-react";

import { averageCompositeScore, highTierCount } from "@/lib/voterStats";
import { type DashboardEntity } from "@/lib/types/dashboard";

type StatsBarProps = {
  voters: DashboardEntity[];
  selectedVoter: DashboardEntity | null;
  summaryAvg?: number | null;
};

export function StatsBar({ voters, selectedVoter, summaryAvg }: StatsBarProps) {
  const avg = summaryAvg ?? averageCompositeScore(voters);
  const highIntent = highTierCount(voters);

  const stats = [
    {
      label: "ישויות שנותחו",
      value: voters.length.toLocaleString("he-IL"),
      tone: "text-white",
      icon: Users,
    },
    {
      label: "ממוצע מורכב",
      value: String(avg),
      tone: "text-emerald-400",
      icon: Activity,
    },
    {
      label: "יעד HIGH / CRITICAL",
      value: highIntent.toLocaleString("he-IL"),
      tone: "text-red-400",
      icon: Crosshair,
    },
    {
      label: "מנוע פעיל",
      value: "OSINT",
      tone: "text-cyan-300",
      icon: Radar,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className="glass-panel group animate-fade-up rounded-2xl p-4 transition-colors hover:border-white/10"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="section-eyebrow mb-0">{stat.label}</p>
            <stat.icon className="h-4 w-4 text-slate-600 transition-colors group-hover:text-slate-400" aria-hidden />
          </div>
          <p className={`font-mono text-3xl font-black tabular-nums tracking-tight ${stat.tone}`}>{stat.value}</p>
          {selectedVoter && index === 0 ? (
            <p className="mt-2 truncate text-xs text-slate-500">נבחר: {selectedVoter.name}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
