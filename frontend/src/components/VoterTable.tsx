"use client";

import { useMemo, useState } from "react";

import type { Voter } from "@/lib/types";

type VoterTableProps = {
  voters: Voter[];
  onSelect?: (voter: Voter) => void;
};

type SortKey = "name" | "city" | "category" | "priority";

export function VoterTable({ voters, onSelect }: VoterTableProps) {
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("priority");
  const [asc, setAsc] = useState(false);

  const rows = useMemo(() => {
    const filtered = voters.filter((v) => {
      const hay = `${v.first_name} ${v.last_name} ${v.city ?? ""} ${v.gotv_category ?? ""}`.toLowerCase();
      return hay.includes(q.trim().toLowerCase());
    });
    filtered.sort((a, b) => {
      const dir = asc ? 1 : -1;
      if (sortKey === "name") return `${a.first_name}${a.last_name}`.localeCompare(`${b.first_name}${b.last_name}`, "he") * dir;
      if (sortKey === "city") return String(a.city ?? "").localeCompare(String(b.city ?? ""), "he") * dir;
      if (sortKey === "category") return String(a.gotv_category ?? "").localeCompare(String(b.gotv_category ?? "")) * dir;
      return ((a.gotv_priority ?? 0) - (b.gotv_priority ?? 0)) * dir;
    });
    return filtered;
  }, [voters, q, sortKey, asc]);

  const toggle = (key: SortKey) => {
    if (sortKey === key) setAsc((v) => !v);
    else {
      setSortKey(key);
      setAsc(false);
    }
  };

  return (
    <div className="glass-panel overflow-hidden rounded-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-4 py-3">
        <h3 className="text-sm font-semibold text-white">טבלת מצביעים</h3>
        <input
          className="input max-w-xs py-2 text-sm"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="סינון…"
        />
      </div>
      <div className="max-h-[28rem] overflow-auto" style={{ contentVisibility: "auto" }}>
        <table className="min-w-full text-right text-sm">
          <thead className="sticky top-0 bg-slate-950/90 text-xs text-slate-500 backdrop-blur">
            <tr>
              <th className="cursor-pointer px-4 py-3 font-medium" onClick={() => toggle("name")}>
                שם
              </th>
              <th className="cursor-pointer px-4 py-3 font-medium" onClick={() => toggle("city")}>
                עיר
              </th>
              <th className="cursor-pointer px-4 py-3 font-medium" onClick={() => toggle("category")}>
                קטגוריה
              </th>
              <th className="cursor-pointer px-4 py-3 font-medium" onClick={() => toggle("priority")}>
                עדיפות
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  אין נתונים להצגה
                </td>
              </tr>
            ) : (
              rows.map((v) => (
                <tr
                  key={String(v.id)}
                  className="border-t border-white/[0.04] hover:bg-white/[0.03]"
                  onClick={() => onSelect?.(v)}
                >
                  <td className="px-4 py-3 font-medium text-white">
                    {v.first_name} {v.last_name}
                  </td>
                  <td className="px-4 py-3 text-slate-400">{v.city || "—"}</td>
                  <td className="px-4 py-3 text-slate-300">{v.gotv_category || "—"}</td>
                  <td className="px-4 py-3 font-mono tabular-nums text-cyan-300">{v.gotv_priority ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
