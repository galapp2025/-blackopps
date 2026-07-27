"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { TierBadge } from "@/components/ui/TierBadge";
import { compositeScoreTone, initialsFromName, tierStyles } from "@/lib/tierStyles";
import { type DashboardEntity } from "@/lib/types/dashboard";

type VoterListProps = {
  voters: DashboardEntity[];
  selectedVoter: DashboardEntity | null;
  onSelect: (voter: DashboardEntity) => void;
  selectedIds?: Set<string>;
  onToggleSelect?: (voterId: string) => void;
};

export function VoterList({ voters, selectedVoter, onSelect, selectedIds, onToggleSelect }: VoterListProps) {
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
    <aside className="glass-panel flex max-h-[min(720px,calc(100vh-12rem))] flex-col rounded-3xl p-4 lg:sticky lg:top-28">
      <div className="mb-4 flex items-center justify-between gap-2 px-1">
        <div>
          <p className="section-eyebrow">רשימת ישויות</p>
          <h3 className="text-lg font-bold text-white">{filtered.length.toLocaleString("he-IL")} תוצאות</h3>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-300 ring-1 ring-emerald-500/25">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          LIVE
        </span>
      </div>

      <label className="relative mb-4 block">
        <span className="sr-only">חיפוש ישות</span>
        <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="חיפוש לפי שם או מזהה…"
          className="input focus-ring w-full !py-2.5 !pr-10 text-sm"
        />
      </label>

      <div className="custom-scrollbar min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-0.5">
        {filtered.length === 0 ? (
          <p className="px-2 py-8 text-center text-sm text-slate-500">לא נמצאו תוצאות לחיפוש</p>
        ) : (
          filtered.map((voter) => {
            const active = selectedVoter?.id === voter.id;
            const composite = Math.round(voter.profile.scores.composite);
            const ring = tierStyles(voter.profile.tier).ring;

            return (
              <div
                key={voter.id}
                className={`group flex w-full items-center gap-2 rounded-2xl border px-2 py-2 text-right transition-all ${
                  active
                    ? "border-red-500/35 bg-gradient-to-l from-red-500/12 to-transparent shadow-md shadow-red-950/15"
                    : "border-transparent bg-slate-950/30 hover:border-white/[0.06] hover:bg-slate-900/60"
                }`}
              >
                {onToggleSelect ? (
                  <input
                    type="checkbox"
                    checked={selectedIds?.has(voter.id) ?? false}
                    onChange={() => onToggleSelect(voter.id)}
                    className="focus-ring h-4 w-4 shrink-0 rounded accent-red-500"
                    aria-label={`בחר ${voter.name}`}
                  />
                ) : null}
                <button
                  type="button"
                  onClick={() => onSelect(voter)}
                  className="focus-ring flex min-w-0 flex-1 items-center gap-3 rounded-xl px-1 py-1.5 text-right"
                  aria-current={active ? "true" : undefined}
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-[11px] font-bold text-white ${ring}`}
                    aria-hidden
                  >
                    {initialsFromName(voter.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-100">{voter.name}</p>
                    <p className="mt-0.5 font-mono text-[10px] text-slate-500">{voter.id}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className={`font-mono text-xs font-bold tabular-nums ${compositeScoreTone(composite)}`}>
                      {composite}
                    </span>
                    <TierBadge tier={voter.profile.tier} className="!text-[9px]" />
                  </div>
                </button>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
