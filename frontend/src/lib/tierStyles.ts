export function tierStyles(tier: string): {
  badge: string;
  ring: string;
  label: string;
} {
  const key = tier.toUpperCase();
  switch (key) {
    case "CRITICAL":
      return {
        badge: "bg-rose-500/15 text-rose-200 ring-rose-500/35",
        ring: "from-rose-500 to-orange-500",
        label: "קריטי",
      };
    case "HIGH":
      return {
        badge: "bg-red-500/15 text-red-200 ring-red-500/30",
        ring: "from-red-500 to-amber-500",
        label: "גבוה",
      };
    case "MEDIUM":
      return {
        badge: "bg-amber-500/15 text-amber-200 ring-amber-500/30",
        ring: "from-amber-500 to-yellow-400",
        label: "בינוני",
      };
    default:
      return {
        badge: "bg-slate-500/15 text-slate-300 ring-slate-500/25",
        ring: "from-slate-500 to-slate-400",
        label: tier,
      };
  }
}

export function compositeScoreTone(value: number): string {
  if (value >= 75) return "text-emerald-400";
  if (value >= 50) return "text-amber-400";
  return "text-slate-400";
}

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
