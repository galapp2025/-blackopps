"use client";

import { BackendStatus } from "@/components/BackendStatus";
import { API_BASE, api } from "@/lib/api";
import { useEffect, useState } from "react";

type SystemStatusBarProps = {
  compact?: boolean;
};

/** @deprecated Prefer BackendStatus — kept for older call sites */
export function SystemStatusBar({ compact = false }: SystemStatusBarProps) {
  const [queueLen, setQueueLen] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const stats = await api.getDispatchStats();
        if (!cancelled) setQueueLen(stats.queued);
      } catch {
        if (!cancelled) setQueueLen(null);
      }
    };
    void load();
    const id = window.setInterval(() => void load(), 20000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  if (compact) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BackendStatus compact />
        <span className="text-[11px] text-slate-500">
          תור שיגור: {queueLen == null ? "—" : queueLen} · {API_BASE.replace(/^https?:\/\//, "")}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <BackendStatus />
      <p className="text-center text-xs text-slate-500">תור שיגור: {queueLen == null ? "—" : queueLen}</p>
    </div>
  );
}
