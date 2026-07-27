"use client";

import { useEffect, useState } from "react";

import { API_BASE } from "@/lib/api";

type BackendStatusProps = {
  compact?: boolean;
};

type Status = "checking" | "connected" | "disconnected";

export function BackendStatus({ compact = false }: BackendStatusProps) {
  const [status, setStatus] = useState<Status>("checking");
  const [version, setVersion] = useState("");

  useEffect(() => {
    let cancelled = false;
    const ping = async () => {
      try {
        const res = await fetch(`${API_BASE}/health`, { cache: "no-store" });
        const data = (await res.json()) as { status?: string; version?: string };
        if (cancelled) return;
        if (res.ok && (data.status === "ok" || data.status === "healthy")) {
          setStatus("connected");
          setVersion(data.version || "");
        } else {
          setStatus("disconnected");
          setVersion("");
        }
      } catch {
        if (!cancelled) {
          setStatus("disconnected");
          setVersion("");
        }
      }
    };
    void ping();
    const interval = window.setInterval(() => void ping(), 30000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const label =
    status === "checking" ? "בודק…" : status === "connected" ? `מחובר${version ? ` v${version}` : ""}` : "מנותק";
  const dot =
    status === "checking"
      ? "bg-amber-400"
      : status === "connected"
        ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]"
        : "bg-red-400";

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-[11px] text-slate-400">
        <span className={`h-2 w-2 rounded-full live-indicator ${dot}`} aria-hidden />
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
      </div>
      <p className="font-mono text-xs text-slate-500">{API_BASE}</p>
    </div>
  );
}
