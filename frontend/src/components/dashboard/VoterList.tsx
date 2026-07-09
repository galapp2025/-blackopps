"use client";

import { Search, UserRound } from "lucide-react";
import { useMemo, useState } from "react";

import { type AnalyzedVoter } from "@/lib/metrics";

type VoterListProps = {
  voters: AnalyzedVoter[];
  selectedVoter: AnalyzedVoter | null;
  onSelect: (voter: AnalyzedVoter) => void;
};

export function VoterList({ voters, selectedVoter, onSelect }: VoterListProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return voters;
    return voters.filter(
      (voter) =>
        voter.name.toLowerCase().includes(normalized) || voter.id.toLowerCase().includes(normalized),
    );
  }, [query, voters]);

  return (
    <aside className="glass-panel flex h-[720px] flex-col rounded-3xl p-4 lg:sticky lg:top-24">
      <div className="mb-4 flex items-center justify-between gap-2 px-1">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">ישויות</p>
          <h3 className="text-lg font-bold text-white">{filtered.length.toLocaleString("he-IL")} תוצאות</h3>
        </div>
        <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-[11px] font-medium text-red-300 ring-1 ring-red-500/20">
          LIVE
        </span>
      </div>

      <label className="relative mb-4 block">
        <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="חיפוש לפי שם או מזהה..."
          className="input w-full !py-2.5 !pr-10 text-sm"
        />
      </label>

      <div className="custom-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {filtered.map((voter) => {
          const active = selectedVoter?.id === voter.id;
          const avg =
            Object.values(voter.metrics).reduce((sum, value) => sum + value, 0) /
            Object.values(voter.metrics).length;

          return (
            <button
              key={voter.id}
              type="button"
              onClick={() => onSelect(voter)}
              className={`group flex w-full items-center justify-between rounded-2xl border px-3.5 py-3 text-right transition-all ${
                active
                  ? "border-red-500/40 bg-gradient-to-l from-red-500/15 to-transparent text-white shadow-lg shadow-red-950/20"
                  : "border-white/5 bg-slate-950/40 text-slate-300 hover:border-white/10 hover:bg-slate-900/70"
              }`}
            >
              <div className="min-w-0">
                <p className="truncate font-semibold">{voter.name}</p>
                <p className="mt-0.5 font-mono text-[11px] text-slate-500">{voter.id}</p>
              </div>
              <div className="mr-3 flex flex-col items-end gap-1">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    avg >= 78 ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"
                  }`}
                >
                  {Math.round(avg)}%
                </span>
                <UserRound className={`h-4 w-4 ${active ? "text-red-300" : "text-slate-600 group-hover:text-slate-400"}`} />
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
