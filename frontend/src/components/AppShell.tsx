import Link from "next/link";
import { Activity, Crosshair, LayoutDashboard } from "lucide-react";

type AppShellProps = {
  children: React.ReactNode;
  active?: "dashboard" | "roadmap";
  subtitle?: string;
};

export function AppShell({ children, active = "dashboard", subtitle }: AppShellProps) {
  return (
    <div className="mesh-bg min-h-screen text-slate-100">
      <header className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-red-700 shadow-lg shadow-red-950/50">
              <Crosshair className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-red-400/90">BlackOpps</p>
              <h1 className="text-lg font-bold tracking-tight text-white sm:text-xl">חמ&quot;ל ניתוח ואקשן</h1>
              {subtitle ? <p className="mt-0.5 text-xs text-slate-400 sm:text-sm">{subtitle}</p> : null}
            </div>
          </div>

          <nav className="flex items-center gap-2">
            <Link
              href="/"
              className={`btn-secondary !rounded-full !px-4 !py-2 text-xs ${
                active === "dashboard" ? "border-red-500/40 bg-red-500/10 text-white" : ""
              }`}
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">דשבורד</span>
            </Link>
            <Link
              href="/roadmap"
              className={`btn-secondary !rounded-full !px-4 !py-2 text-xs ${
                active === "roadmap" ? "border-red-500/40 bg-red-500/10 text-white" : ""
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">יכולות מבצעיות</span>
              <span className="rounded-full bg-amber-400/15 px-1.5 py-0.5 text-[10px] text-amber-300">בפיתוח</span>
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
