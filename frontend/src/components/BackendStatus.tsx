"use client";

import { useEffect, useState } from "react";

import { API_BASE, api } from "@/lib/api";
import type { HealthResponse } from "@/lib/types";

type BackendStatusProps = {
  compact?: boolean;
};

export function BackendStatus({ compact = false }: BackendStatusProps) {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    const ping = async () => {
      try {
        const data = await api.health();
        if (!cancelled) {
          setHealth(data);
          setOk(data.status === "ok" || data.status === "healthy");
        }
      } catch {
        if (!cancelled) {
          setOk(false);
          setHealth(null);
        }
      }
    };
    void ping();
    const id = window.setInterval(() => void ping(), 30000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const label = ok === null ? "בודק…" : ok ? "מחובר" : "מנותק";
  const dot =
    ok === null ? "bg-amber-400" : ok ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]" : "bg-red-400";

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-[11px] text-slate-400">
        <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden />
        <span>{label}</span>
        <span className="hidden font-mono text-slate-600 md:inline">{API_BASE.replace(/^https?:\/\//, "")}</span>
      </div>
    );
  }

  return (
    <div className="glass-panel flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm">
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${dot}`} aria-hidden />
        <span className="font-medium text-slate-200">{label}</span>
        {health?.version ? <span className="text-xs text-slate-500">v{health.version}</span> : null}
      </div>
      <p className="font-mono text-xs text-slate-500">{API_BASE}</p>
    </div>
  );
}
