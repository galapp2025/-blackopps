"use client";

import type { ReactNode } from "react";

export type ShellActive =
  | "dashboard"
  | "voters"
  | "roadmap"
  | "war-room"
  | "messages"
  | "whatsapp"
  | "prediction"
  | "influence"
  | "sentiment"
  | "writer"
  | "dossier"
  | "trends";

type AppShellProps = {
  children: ReactNode;
  active?: ShellActive;
  title?: string;
  subtitle?: string;
};

/**
 * Page chrome only — site navigation lives in sticky TopNavbar (root layout).
 */
export function AppShell({ children, title, subtitle }: AppShellProps) {
  return (
    <div className="w-full text-[var(--text-primary)]" dir="rtl">
      {(title || subtitle) && (
        <header className="mb-6 sm:mb-8">
          {subtitle ? (
            <p className="mb-1 text-sm text-[var(--text-muted)]">{subtitle}</p>
          ) : null}
          {title ? (
            <h1 className="text-2xl font-bold text-white sm:text-3xl">{title}</h1>
          ) : null}
        </header>
      )}
      <div className="space-y-6">{children}</div>
    </div>
  );
}
