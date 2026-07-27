"use client";

import { AlertTriangle } from "lucide-react";

type ErrorStateProps = {
  message: string;
  onRetry?: () => void;
};

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6" role="alert" data-error>
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" aria-hidden />
        <p className="text-sm text-red-300">{message}</p>
      </div>
      {onRetry ? (
        <button type="button" className="btn-press mt-3 text-sm text-red-400 transition-colors hover:text-red-300" onClick={onRetry}>
          נסה שוב
        </button>
      ) : null}
    </div>
  );
}
