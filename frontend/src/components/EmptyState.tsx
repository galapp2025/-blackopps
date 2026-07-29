"use client";

import { Button } from "@/components/ui/Button";

type EmptyStateProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
};

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-[var(--bg-card)] px-6 py-16 text-center shadow-[var(--shadow-card)]"
      role="status"
      data-empty
    >
      <div className="mb-4 text-5xl opacity-50" aria-hidden>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white">{title}</h3>
      <p className="mt-2 max-w-md text-base leading-relaxed text-[var(--text-secondary)]">
        {description}
      </p>
      {action ? (
        <Button variant="primary" size="lg" className="mt-6" onClick={action.onClick}>
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}
