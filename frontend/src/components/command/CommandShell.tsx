"use client";

import type { ReactNode } from "react";

type CommandShellProps = {
  topBar: ReactNode;
  sidebar: ReactNode;
  intelPanel: ReactNode;
  children: ReactNode;
  dropOverlay?: ReactNode;
};

export function CommandShell({ topBar, sidebar, intelPanel, children, dropOverlay }: CommandShellProps) {
  return (
    <div className="command-center mesh-bg flex min-h-screen flex-col text-slate-100">
      {topBar}
      <div className="mx-auto flex w-full max-w-[100rem] flex-1 gap-0 lg:gap-3 px-2 pb-4 pt-2 sm:px-4">
        <aside className="hidden w-14 shrink-0 lg:block xl:w-16" aria-label="ניווט מבצעי">
          {sidebar}
        </aside>
        <main role="main" aria-label="לוח פיקוד" className="min-w-0 flex-1">
          {children}
        </main>
        <aside className="hidden w-72 shrink-0 xl:block" aria-label="פאנל מודיעין">
          {intelPanel}
        </aside>
      </div>
      {dropOverlay}
    </div>
  );
}
