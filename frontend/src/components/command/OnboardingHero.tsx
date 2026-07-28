"use client";

import { UploadCloud } from "lucide-react";

type OnboardingHeroProps = {
  voterTotal: number;
  onPickFile: () => void;
  onPasteFocus: () => void;
};

export function OnboardingHero({ voterTotal, onPickFile, onPasteFocus }: OnboardingHeroProps) {
  return (
    <div className="glass-panel-strong mx-auto max-w-2xl rounded-3xl px-6 py-12 text-center">
      <p className="tactical-header text-red-400">⚡ BLACKOPPS COMMAND</p>
      <h2 className="stat-headline mt-2 text-white">מודיעין בחירות — חמ״ל מבצעי</h2>
      <p className="stat-body mt-2 text-slate-400">גרור Excel לכל מקום במסך · הדבק שמות · OSINT אוטומטי</p>
      <div className="mt-8 rounded-2xl border border-dashed border-red-500/30 bg-red-500/5 p-8">
        <UploadCloud className="mx-auto h-10 w-10 text-red-400/80" aria-hidden />
        <p className="mt-3 text-sm text-slate-300">📂 גרור קובץ Excel לכאן · 📋 הדבק שמות</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" className="btn-primary" onClick={onPickFile}>
            בחר קובץ
          </button>
          <button type="button" className="btn-secondary" onClick={onPasteFocus}>
            הדבק שמות
          </button>
        </div>
      </div>
      <p className="mt-6 font-mono text-xs text-slate-500">
        סטטוס מערכת: 🟢 ONLINE · {voterTotal.toLocaleString("he-IL")} voters in DB
      </p>
    </div>
  );
}
