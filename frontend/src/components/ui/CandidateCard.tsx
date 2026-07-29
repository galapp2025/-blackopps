"use client";

type OpponentData = {
  strengths?: string[];
  weaknesses?: string[];
  likely_attacks?: string[];
};

export type CandidateDossier = {
  id: string;
  candidate_name: string;
  party: string;
  role?: string;
  status?: string;
  key_messages?: string[];
  strengths?: string[];
  weaknesses?: string[];
  opponent_analysis?: Record<string, OpponentData>;
  confidence?: number;
  version?: number;
};

type CandidateCardProps = {
  candidate: CandidateDossier;
  onRefresh: () => void;
  onDelete: () => void;
  onSelect?: () => void;
  selected?: boolean;
};

export function CandidateCard({ candidate, onRefresh, onDelete, onSelect, selected }: CandidateCardProps) {
  return (
    <article
      dir="rtl"
      className={`glass-panel space-y-4 rounded-3xl p-6 transition ${selected ? "ring-1 ring-cyan-400/50" : ""}`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-white">{candidate.candidate_name}</h3>
          <p className="text-sm text-slate-400">
            {candidate.party}
            {candidate.role ? ` · ${candidate.role}` : ""}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
            candidate.status === "archived" ? "bg-slate-500/20 text-slate-300" : "bg-green-500/20 text-green-300"
          }`}
        >
          {candidate.status === "archived" ? "בארכיון" : "פעיל"}
        </span>
      </div>

      <div className="rounded-2xl bg-white/5 p-4">
        <h4 className="mb-2 text-sm font-semibold text-blue-300">מסרים מרכזיים</h4>
        {(candidate.key_messages || []).map((msg) => (
          <div key={msg} className="mb-1 flex items-start gap-2 text-sm text-slate-300">
            <span className="text-blue-400">•</span>
            <span>{msg}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white/5 p-3">
          <h4 className="mb-2 text-xs font-semibold text-green-300">חוזקות</h4>
          {(candidate.strengths || []).map((s) => (
            <div key={s} className="mb-1 text-xs text-slate-300">
              {s}
            </div>
          ))}
        </div>
        <div className="rounded-2xl bg-white/5 p-3">
          <h4 className="mb-2 text-xs font-semibold text-red-300">נקודות תורפה</h4>
          {(candidate.weaknesses || []).map((w) => (
            <div key={w} className="mb-1 text-xs text-slate-300">
              {w}
            </div>
          ))}
        </div>
      </div>

      {candidate.opponent_analysis && Object.keys(candidate.opponent_analysis).length > 0 ? (
        <div className="rounded-2xl bg-white/5 p-4">
          <h4 className="mb-3 text-sm font-semibold text-yellow-300">יריבים</h4>
          {Object.entries(candidate.opponent_analysis).map(([name, data]) => (
            <div key={name} className="mb-3 border-b border-white/5 pb-3 last:mb-0 last:border-0 last:pb-0">
              <div className="mb-1 text-sm font-medium text-slate-200">{name}</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-green-400">חוזקות: </span>
                  <span className="text-slate-400">{(data.strengths || []).join(", ")}</span>
                </div>
                <div>
                  <span className="text-red-400">התקפות צפויות: </span>
                  <span className="text-slate-400">{(data.likely_attacks || []).join(", ")}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="btn-secondary text-xs" onClick={onRefresh}>
          רענן תיק
        </button>
        <button type="button" className="btn-secondary text-xs text-red-200" onClick={onDelete}>
          העבר לארכיון
        </button>
        {candidate.confidence != null ? (
          <span className="ms-auto self-center text-xs text-slate-500">
            ביטחון ניתוח {Math.round(candidate.confidence * 100)}% · גרסה {candidate.version ?? 1}
          </span>
        ) : null}
      </div>
    </article>
  );
}
