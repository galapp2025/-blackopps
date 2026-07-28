"use client";

import { useEffect, useMemo, useState } from "react";

export type CommandAction = {
  id: string;
  label: string;
  hint?: string;
  run: () => void;
};

type CommandPaletteProps = {
  open: boolean;
  onClose: () => void;
  actions: CommandAction[];
};

export function CommandPalette({ open, onClose, actions }: CommandPaletteProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (open) onClose();
      }
      if (e.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return actions;
    return actions.filter((a) => a.label.toLowerCase().includes(q) || a.id.includes(q));
  }, [actions, query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-start justify-center bg-slate-950/70 p-4 pt-[12vh] backdrop-blur-md" role="dialog" aria-modal aria-label="Command bar">
      <div className="glass-panel-strong w-full max-w-lg overflow-hidden rounded-2xl shadow-2xl">
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="import · analyze · dispatch swing · goto gotv…"
          className="command-text w-full border-b border-white/10 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-slate-500"
        />
        <ul className="max-h-72 overflow-y-auto custom-scrollbar py-2">
          {filtered.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                className="command-text w-full px-4 py-2.5 text-right text-sm hover:bg-white/[0.06]"
                onClick={() => {
                  a.run();
                  onClose();
                }}
              >
                {a.label}
                {a.hint ? <span className="ms-2 text-xs text-slate-500">{a.hint}</span> : null}
              </button>
            </li>
          ))}
          {filtered.length === 0 ? (
            <li className="px-4 py-6 text-center text-sm text-slate-500">לא נמצאו פקודות</li>
          ) : null}
        </ul>
      </div>
      <button type="button" className="sr-only" onClick={onClose}>
        סגור
      </button>
    </div>
  );
}

export function useCommandPaletteToggle() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return { open, setOpen };
}
