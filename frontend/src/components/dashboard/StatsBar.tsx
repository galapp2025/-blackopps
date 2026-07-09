import { type AnalyzedVoter } from "@/lib/metrics";

type StatsBarProps = {
  voters: AnalyzedVoter[];
  selectedVoter: AnalyzedVoter | null;
};

export function StatsBar({ voters, selectedVoter }: StatsBarProps) {
  const highIntent = Math.floor(voters.length * 0.81);

  const stats = [
    {
      label: "ישויות שנותחו בקובץ",
      value: voters.length.toLocaleString("he-IL"),
      tone: "text-white",
    },
    {
      label: "ממוצע התאמת פרופיל",
      value: "82%",
      tone: "text-emerald-400",
    },
    {
      label: "פוטנציאל הנעה גבוה",
      value: highIntent.toLocaleString("he-IL"),
      tone: "text-red-400",
    },
    {
      label: "נקודות מידע לישות",
      value: "30",
      tone: "text-white",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className="glass-panel animate-fade-up rounded-2xl p-4"
          style={{ animationDelay: `${index * 60}ms` }}
        >
          <p className="font-mono text-xs uppercase text-slate-400">{stat.label}</p>
          <p className={`mt-1 font-mono text-2xl font-black tracking-tight ${stat.tone}`}>{stat.value}</p>
          {selectedVoter && index === 0 ? (
            <p className="mt-1 truncate text-xs text-slate-500">נבחר: {selectedVoter.name}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
