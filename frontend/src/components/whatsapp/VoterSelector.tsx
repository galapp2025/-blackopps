"use client";

import { useEffect, useState } from "react";

import { api } from "@/lib/api";
import type { Voter } from "@/lib/types";

type VoterSelectorProps = {
  onSelect: (voter: Voter) => void;
};

export function VoterSelector({ onSelect }: VoterSelectorProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Voter[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void (async () => {
        setLoading(true);
        try {
          const data = await api.getVoters({ limit: 12, search: query || undefined });
          setResults(data.voters);
        } catch {
          setResults([]);
        } finally {
          setLoading(false);
        }
      })();
    }, 280);
    return () => window.clearTimeout(t);
  }, [query]);

  return (
    <div dir="rtl" className="glass-panel rounded-2xl p-4">
      <label className="mb-2 block text-xs text-slate-400" htmlFor="voter-search">
        חיפוש מצביע
      </label>
      <input
        id="voter-search"
        className="input w-full"
        placeholder="שם, טלפון או שכונה…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <ul className="mt-3 max-h-48 space-y-1 overflow-y-auto">
        {loading ? <li className="text-xs text-slate-500">טוען…</li> : null}
        {!loading && results.length === 0 ? <li className="text-xs text-slate-500">לא נמצאו תוצאות</li> : null}
        {results.map((v) => (
          <li key={String(v.id)}>
            <button
              type="button"
              className="w-full rounded-xl px-3 py-2 text-start text-sm text-slate-200 hover:bg-white/5"
              onClick={() => onSelect(v)}
            >
              {v.first_name} {v.last_name}
              {v.neighborhood ? <span className="text-slate-500"> · {v.neighborhood}</span> : null}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
