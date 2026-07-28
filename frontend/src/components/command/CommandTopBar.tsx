"use client";

import { Crosshair, Zap } from "lucide-react";

import { BackendStatus } from "@/components/BackendStatus";
import type { SystemStatus } from "@/hooks/useSystemCheck";

type CommandTopBarProps = {
  status: SystemStatus;
  nominal: boolean;
  activeOps: number;
  onOpenPalette: () => void;
};

export function CommandTopBar({ status, nominal, activeOps, onOpenPalette }: CommandTopBarProps) {
  return (
    <header
      role="banner"
      className="live-pulse sticky top-0 z-50 border-b border-red-500/20 bg-slate-950/90 backdrop-blur-2xl"
    >
      <div className="mx-auto flex max-w-[100rem] flex-wrap items-center justify-between gap-3 px-3 py-2.5 sm:px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-red-900 shadow-lg shadow-red-950/50">
            <Crosshair className="h-5 w-5 text-white" aria-hidden />
          </div>
          <div>
            <p className="tactical-header text-red-400/90">BlackOpps Command</p>
            <p className="command-text text-sm font-semibold text-white">
              {nominal ? "SYSTEM NOMINAL" : "DEGRADED MODE"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-emerald-200">
            <span className="live-indicator h-2 w-2 rounded-full bg-emerald-400" aria-hidden />
            LIVE {status.voterTotal.toLocaleString("he-IL")} voters
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 font-mono text-red-200">
            Active Ops {activeOps}
          </span>
          <span className="hidden font-mono text-slate-500 sm:inline">v{status.version}</span>
        </div>

        <div className="flex items-center gap-2">
          <button type="button" className="btn-secondary text-xs" onClick={onOpenPalette}>
            <Zap className="h-3.5 w-3.5" />
            ⌘K
          </button>
          <div className="hidden sm:block">
            <BackendStatus compact />
          </div>
        </div>
      </div>
    </header>
  );
}
