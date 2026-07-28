"use client";

import { FileSpreadsheet, Radar, Send, Swords } from "lucide-react";

type QuickActionsProps = {
  onImport: () => void;
  onFocusOsint: () => void;
  onCompare: () => void;
  onDispatch: () => void;
  onBattleReport: () => void;
  loading?: boolean;
};

export function QuickActions({
  onImport,
  onFocusOsint,
  onCompare,
  onDispatch,
  onBattleReport,
  loading,
}: QuickActionsProps) {
  return (
    <div className="glass-panel rounded-3xl p-4">
      <p className="tactical-header mb-3">Quick Actions</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <button type="button" className="btn-secondary text-xs" onClick={onImport}>
          <FileSpreadsheet className="h-3.5 w-3.5" />
          Import
        </button>
        <button type="button" className="btn-secondary text-xs" onClick={onFocusOsint}>
          <Radar className="h-3.5 w-3.5" />
          OSINT
        </button>
        <button type="button" className="btn-secondary text-xs" onClick={onCompare}>
          <Swords className="h-3.5 w-3.5" />
          Compare
        </button>
        <button type="button" className="btn-secondary text-xs" onClick={onDispatch}>
          <Send className="h-3.5 w-3.5" />
          Dispatch
        </button>
        <button type="button" className="btn-primary col-span-2 text-xs sm:col-span-1" onClick={onBattleReport}>
          {loading ? "מפיק…" : "הפק דו״ח מבצעי"}
        </button>
      </div>
    </div>
  );
}
