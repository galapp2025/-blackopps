"use client";

import { AlertTriangle, CheckCircle2, X } from "lucide-react";
import { useEffect } from "react";

type DispatchToastProps = {
  message: string;
  onClose: () => void;
  tone?: "ok" | "err";
};

export function DispatchToast({ message, onClose, tone = "ok" }: DispatchToastProps) {
  useEffect(() => {
    const id = window.setTimeout(onClose, 3000);
    return () => window.clearTimeout(id);
  }, [onClose, message, tone]);

  const isErr = tone === "err";

  return (
    <div
      className={`toast-enter fixed bottom-6 left-1/2 z-50 w-[min(92vw,24rem)] -translate-x-1/2 rounded-2xl border bg-slate-950/95 p-4 shadow-2xl shadow-black/50 backdrop-blur-xl ${
        isErr ? "border-red-500/30" : "border-emerald-500/25"
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        {isErr ? (
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" aria-hidden />
        ) : (
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" aria-hidden />
        )}
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-semibold ${isErr ? "text-red-200" : "text-emerald-200"}`}>
            {isErr ? "שגיאה" : "הצלחה"}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">{message}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="focus-ring rounded-lg p-1 text-slate-500 hover:bg-white/[0.06] hover:text-slate-300"
          aria-label="סגור"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
