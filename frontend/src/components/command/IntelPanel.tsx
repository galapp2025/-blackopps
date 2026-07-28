"use client";

import { AlertTriangle, ListTodo } from "lucide-react";

import { AnimatedNumber } from "@/components/AnimatedNumber";
import type { DispatchStats } from "@/lib/types";

type IntelPanelProps = {
  flash: boolean;
  alertTotal: number;
  swingCount: number;
  atRiskCount: number;
  dispatch: DispatchStats | null;
};

export function IntelPanel({ flash, alertTotal, swingCount, atRiskCount, dispatch }: IntelPanelProps) {
  const queued = dispatch?.queued ?? 0;
  const active = dispatch?.in_progress ?? 0;
  const done = dispatch?.completed ?? 0;

  return (
    <div className={`space-y-3 ${flash ? "intel-update" : ""}`}>
      <div className="glass-panel rounded-2xl p-4">
        <p className="tactical-header mb-3 flex items-center gap-2 text-amber-300/90">
          <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
          Alerts
        </p>
        <ul className="command-text space-y-2 text-sm">
          <li className="flex justify-between">
            <span>סה״כ התראות</span>
            <AnimatedNumber value={alertTotal} className="font-mono text-cyan-300" duration={800} />
          </li>
          <li className="flex justify-between text-amber-200">
            <span>SWING</span>
            <AnimatedNumber value={swingCount} className="font-mono" duration={800} />
          </li>
          <li className="flex justify-between text-red-200">
            <span>AT_RISK</span>
            <AnimatedNumber value={atRiskCount} className="font-mono" duration={800} />
          </li>
        </ul>
      </div>

      <div className="glass-panel rounded-2xl p-4">
        <p className="tactical-header mb-3 flex items-center gap-2">
          <ListTodo className="h-3.5 w-3.5" aria-hidden />
          Task Queue
        </p>
        <ul className="command-text space-y-2 text-sm">
          <li className="flex justify-between">
            <span>Pending</span>
            <span className="font-mono text-amber-300">{queued}</span>
          </li>
          <li className="flex justify-between">
            <span>Active</span>
            <span className="font-mono text-cyan-300">{active}</span>
          </li>
          <li className="flex justify-between">
            <span>Done</span>
            <span className="font-mono text-emerald-300">{done}</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
