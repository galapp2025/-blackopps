"use client";

import type { ReactNode } from "react";

type CommandShellProps = {
  topBar: ReactNode;
  /** Optional — prefer horizontal view switcher inside children on all breakpoints */
  sidebar?: ReactNode;
  intelPanel?: ReactNode;
  children: ReactNode;
  dropOverlay?: ReactNode;
};

/** Full-width command canvas under sticky TopNavbar — no site sidebar. */
export function CommandShell({ topBar, intelPanel, children, dropOverlay }: CommandShellProps) {
  return (
    <div className="command-center w-full text-[var(--text-primary)]" dir="rtl">
      {topBar}
      <div className="flex w-full flex-1 flex-col gap-4 xl:flex-row">
        <main role="main" aria-label="לוח פיקוד" className="min-w-0 flex-1">
          {children}
        </main>
        {intelPanel ? (
          <aside
            className="w-full shrink-0 xl:w-72"
            aria-label="פאנל מודיעין"
          >
            {intelPanel}
          </aside>
        ) : null}
      </div>
      {dropOverlay}
    </div>
  );
}
