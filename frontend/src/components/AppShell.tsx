"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Crosshair, Database, KeyRound, LayoutDashboard, Map } from "lucide-react";

import { openApiKeySettings } from "@/components/ApiKeyGate";
import { BackendStatus } from "@/components/BackendStatus";

type AppShellProps = {
  children: React.ReactNode;
  active?: "dashboard" | "voters" | "roadmap";
  title?: string;
  subtitle?: string;
};

const navItems = [
  { href: "/", id: "dashboard" as const, label: "חמ״ל", icon: LayoutDashboard },
  { href: "/voters", id: "voters" as const, label: "בוחרים", icon: Database },
  { href: "/roadmap", id: "roadmap" as const, label: "ארסנל", icon: Map },
];

export function AppShell({ children, active, title, subtitle }: AppShellProps) {
  const pathname = usePathname();
  const current =
    active ??
    (pathname.startsWith("/voters") ? "voters" : pathname.startsWith("/roadmap") ? "roadmap" : "dashboard");

  return (
    <div className="mesh-bg flex min-h-screen flex-col text-slate-100">
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-slate-950/80 backdrop-blur-2xl backdrop-saturate-150">
        <div className="mx-auto max-w-[90rem] px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center justify-between gap-4">
              <Link href="/" className="focus-ring group flex items-center gap-3 rounded-2xl">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-red-800 shadow-lg shadow-red-950/50 transition-transform group-hover:scale-[1.03]">
                  <Crosshair className="h-5 w-5 text-white" aria-hidden />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-red-400/95">BlackOpps</p>
                  <h1 className="text-gradient text-base font-extrabold tracking-tight sm:text-lg">
                    {title ?? 'חמ"ל ניתוח ואקשן'}
                  </h1>
                  {subtitle ? (
                    <p className="mt-0.5 line-clamp-1 max-w-md text-xs text-slate-400">{subtitle}</p>
                  ) : null}
                </div>
              </Link>

              <div className="flex items-center gap-1 lg:hidden">
                <button
                  type="button"
                  className="focus-ring flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-white/[0.04] hover:text-white"
                  onClick={() => openApiKeySettings()}
                  aria-label="החלף מפתח API"
                >
                  <KeyRound className="h-4 w-4" />
                </button>
                <nav className="flex items-center gap-1 rounded-2xl border border-white/[0.06] bg-slate-900/50 p-1" aria-label="ניווט ראשי">
                  {navItems.map(({ href, id, label, icon: Icon }) => (
                    <Link
                      key={id}
                      href={href}
                      className={`focus-ring flex h-9 w-9 items-center justify-center rounded-xl transition ${
                        current === id ? "bg-red-500/15 text-white ring-1 ring-red-500/25" : "text-slate-400"
                      }`}
                      aria-label={label}
                      aria-current={current === id ? "page" : undefined}
                    >
                      <Icon className="h-4 w-4" />
                    </Link>
                  ))}
                </nav>
              </div>
            </div>

            <div className="hidden items-center gap-2 lg:flex">
              <nav
                className="flex items-center gap-1 rounded-2xl border border-white/[0.06] bg-slate-900/40 p-1"
                aria-label="ניווט ראשי"
              >
                {navItems.map(({ href, id, label, icon: Icon }) => (
                  <Link
                    key={id}
                    href={href}
                    className={`focus-ring inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                      current === id
                        ? "bg-white/[0.08] text-white shadow-sm ring-1 ring-white/10"
                        : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
                    }`}
                    aria-current={current === id ? "page" : undefined}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                    {label}
                  </Link>
                ))}
              </nav>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => openApiKeySettings()}
                aria-label="החלף מפתח API"
                title="החלף מפתח API"
              >
                <KeyRound className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-3 hidden sm:block">
            <BackendStatus compact />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[90rem] flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>

      <footer className="border-t border-white/[0.04] py-4 text-center text-[11px] text-slate-600">
        BlackOpps · Election Intelligence · OSINT Pipeline
      </footer>
    </div>
  );
}
