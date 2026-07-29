"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/Button";

type ErrorStateProps = {
  message?: string;
  onRetry?: () => void;
};

export function ErrorState({
  message = "משהו השתבש. נסה שוב.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/5 px-6 py-12 text-center"
      role="alert"
      data-error
    >
      <AlertTriangle className="mb-3 h-8 w-8 text-red-400" aria-hidden />
      <h3 className="mb-2 text-xl font-bold text-white">אופס</h3>
      <p className="mb-6 max-w-md text-base text-[var(--text-secondary)]">{message}</p>
      {onRetry ? (
        <Button variant="gold" size="lg" onClick={onRetry}>
          נסה שוב
        </Button>
      ) : null}
    </div>
  );
}
