import { type AnalyzedVoter } from "@/lib/metrics";

type StatsBarProps = {
  voters: AnalyzedVoter[];
  selectedVoter: AnalyzedVoter | null;
};

function averageScore(voters: AnalyzedVoter[]): number {
  if (voters.length === 0) return 0;
  let total = 0;
  let count = 0;
  for (const voter of voters) {
    for (const value of Object.values(voter.metrics)) {
      total += value;
      count += 1;
    }
  }
  return Math.round(total / count);
}

export function StatsBar({ voters, selectedVoter }: StatsBarProps) {
  const avg = averageScore(voters);
  const highIntent = voters.filter((voter) => {
    const values = Object.values(voter.metrics);
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    return mean >= 78;
  }).length;

  const stats = [
    { label: "ישויות בקובץ", value: voters.length.toLocaleString("he-IL") },
    { label: "ממוצע פרופיל", value: `${avg}%` },
    { label: "פוטנציאל גבוה", value: highIntent.toLocaleString("he-IL") },
    { label: "נקודות מידע", value: "30" },
  ];

  return (
    <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className="glass-panel animate-fade-up rounded-2xl p-4"
          style={{ animationDelay: `${index * 60}ms` }}
        >
          <p className="text-xs font-medium text-slate-400">{stat.label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-white">{stat.value}</p>
          {selectedVoter && index === 0 ? (
            <p className="mt-1 truncate text-xs text-slate-500">נבחר: {selectedVoter.name}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
