"use client";

import { Radar, Send, Swords, Target, Zap } from "lucide-react";

export type CommandView = "command" | "gotv" | "intel" | "opposition" | "dispatch";

const NAV: { id: CommandView; label: string; icon: typeof Zap }[] = [
  { id: "command", label: "חמ״ל", icon: Zap },
  { id: "gotv", label: "GOTV", icon: Target },
  { id: "intel", label: "מודיעין", icon: Radar },
  { id: "opposition", label: "אופוזיציה", icon: Swords },
  { id: "dispatch", label: "שיגור", icon: Send },
];

type CommandSidebarProps = {
  view: CommandView;
  onChange: (view: CommandView) => void;
  horizontal?: boolean;
};

export function CommandSidebar({ view, onChange, horizontal }: CommandSidebarProps) {
  return (
    <nav
      className={`glass-panel gap-2 rounded-2xl p-2 ${
        horizontal ? "flex flex-row overflow-x-auto" : "flex h-full flex-col items-center py-3"
      }`}
      role="navigation"
      aria-label="ניווט ראשי"
    >
      {NAV.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          title={label}
          aria-label={label}
          aria-current={view === id ? "page" : undefined}
          onClick={() => onChange(id)}
          className={`focus-ring flex h-11 w-11 items-center justify-center rounded-xl transition ${
            view === id
              ? "bg-red-500/20 text-white ring-1 ring-red-500/40"
              : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
          }`}
        >
          <Icon className="h-5 w-5" />
        </button>
      ))}
    </nav>
  );
}
