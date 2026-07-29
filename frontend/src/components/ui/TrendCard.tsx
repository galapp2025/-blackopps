"use client";

type TrendEvent = {
  id: string;
  title: string;
  description?: string;
  platform?: string;
  classification: string;
  impact_score: number;
  reach_estimate?: number;
  tags?: string[];
};

const CLASS_LABELS: Record<string, string> = {
  THREAT: "איום",
  OPPORTUNITY: "הזדמנות",
  ATTACK: "מתקפה",
  VIRAL_POSITIVE: "ויראלי חיובי",
  VIRAL_NEGATIVE: "ויראלי שלילי",
  NEUTRAL_MENTION: "אזכור ניטרלי",
};

const CLASS_COLORS: Record<string, string> = {
  THREAT: "from-red-500/20 to-red-600/10 border-red-500/30",
  OPPORTUNITY: "from-green-500/20 to-green-600/10 border-green-500/30",
  ATTACK: "from-orange-500/20 to-orange-600/10 border-orange-500/30",
  VIRAL_POSITIVE: "from-blue-500/20 to-blue-600/10 border-blue-500/30",
  VIRAL_NEGATIVE: "from-purple-500/20 to-purple-600/10 border-purple-500/30",
  NEUTRAL_MENTION: "from-slate-500/20 to-slate-600/10 border-slate-500/30",
};

type TrendCardProps = {
  trend: TrendEvent;
  onRespond: (id: string) => void;
  highlight?: boolean;
};

export function TrendCard({ trend, onRespond, highlight }: TrendCardProps) {
  const color = CLASS_COLORS[trend.classification] || CLASS_COLORS.NEUTRAL_MENTION;
  return (
    <article
      dir="rtl"
      className={`glass-panel rounded-3xl border bg-gradient-to-bl p-5 ${color} ${highlight ? "ring-1 ring-cyan-400/40" : ""}`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <span
            className={`rounded-full px-2 py-0.5 text-xs ${
              trend.classification === "THREAT" || trend.classification === "ATTACK"
                ? "bg-red-500/20 text-red-300"
                : trend.classification === "OPPORTUNITY" || trend.classification === "VIRAL_POSITIVE"
                  ? "bg-green-500/20 text-green-300"
                  : "bg-blue-500/20 text-blue-300"
            }`}
          >
            {CLASS_LABELS[trend.classification] || trend.classification}
          </span>
          <h3 className="mt-2 text-lg font-bold text-white">{trend.title}</h3>
        </div>
        <div className="text-end">
          <div className="text-2xl font-bold text-slate-200">{Math.round(trend.impact_score * 100)}%</div>
          <div className="text-xs text-slate-500">השפעה</div>
        </div>
      </div>
      <p className="mb-3 text-sm text-slate-400">{trend.description}</p>
      <div className="mb-4 flex flex-wrap gap-3 text-xs text-slate-500">
        <span>פלטפורמה: {trend.platform || "—"}</span>
        <span>חשיפה: {(trend.reach_estimate || 0).toLocaleString("he-IL")}</span>
        {trend.tags?.length ? <span>תגיות: {trend.tags.join(", ")}</span> : null}
      </div>
      <button type="button" className="btn-primary text-xs" onClick={() => onRespond(trend.id)}>
        צור תגובות אסטרטגיות
      </button>
    </article>
  );
}
