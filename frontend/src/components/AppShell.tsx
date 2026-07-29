"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Crosshair,
  Database,
  FolderOpen,
  Globe2,
  KeyRound,
  LayoutDashboard,
  Map,
  MessageCircle,
  MessageSquare,
  Network,
  PenLine,
  Radio,
  TrendingUp,
} from "lucide-react";

import { openApiKeySettings } from "@/components/ApiKeyGate";
import { BackendStatus } from "@/components/BackendStatus";

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
  children: React.ReactNode;
  active?: ShellActive;
  title?: string;
  subtitle?: string;
};

const navItems: { href: string; id: ShellActive; label: string; icon: typeof Radio }[] = [
  { href: "/", id: "dashboard", label: "דשבורד", icon: LayoutDashboard },
  { href: "/war-room", id: "war-room", label: "חמ״ל", icon: Radio },
  { href: "/voters", id: "voters", label: "בוחרים", icon: Database },
  { href: "/messages", id: "messages", label: "מסרים", icon: MessageSquare },
  { href: "/influence", id: "influence", label: "השפעה", icon: Network },
  { href: "/sentiment", id: "sentiment", label: "סנטימנט", icon: TrendingUp },
  { href: "/writer", id: "writer", label: "כותב", icon: PenLine },
  { href: "/dossier", id: "dossier", label: "תיק מועמד", icon: FolderOpen },
  { href: "/trends", id: "trends", label: "טרנדים", icon: Globe2 },
  { href: "/prediction", id: "prediction", label: "חיזוי", icon: BarChart3 },
  { href: "/whatsapp", id: "whatsapp", label: "וואטסאפ", icon: MessageCircle },
  { href: "/roadmap", id: "roadmap", label: "ארסנל", icon: Map },
];

function resolveActive(pathname: string): ShellActive {
  if (pathname.startsWith("/war-room")) return "war-room";
  if (pathname.startsWith("/messages")) return "messages";
  if (pathname.startsWith("/whatsapp")) return "whatsapp";
  if (pathname.startsWith("/writer")) return "writer";
  if (pathname.startsWith("/prediction")) return "prediction";
  if (pathname.startsWith("/influence")) return "influence";
  if (pathname.startsWith("/sentiment")) return "sentiment";
  if (pathname.startsWith("/voters")) return "voters";
  if (pathname.startsWith("/dossier")) return "dossier";
  if (pathname.startsWith("/trends")) return "trends";
  if (pathname.startsWith("/roadmap")) return "roadmap";
  return "dashboard";
}

export function AppShell({ children, active, title, subtitle }: AppShellProps) {
  const pathname = usePathname();
  const current = active ?? resolveActive(pathname);

  return (
    <div className="mesh-bg flex min-h-screen flex-col text-[var(--text-primary)]" dir="rtl">
      <header
        role="banner"
        aria-label="כותרת האפליקציה"
        className="sticky top-0 z-50 border-b border-white/[0.06] bg-[var(--bg-secondary)]/90 backdrop-blur-xl"
      >
        <div className="mx-auto max-w-[90rem] px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center justify-between gap-4">
              <Link href="/" className="focus-ring group flex items-center gap-3 rounded-2xl">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--brand-blue)] to-blue-800 shadow-lg shadow-blue-950/40 transition-transform group-hover:scale-[1.03]">
                  <Crosshair className="h-5 w-5 text-white" aria-hidden />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--brand-gold)]">
                    BlackOpps
                  </p>
                  <h1 className="text-base font-extrabold tracking-tight text-white sm:text-lg">
                    {title ?? 'חמ"ל ניתוח ואקשן'}
                  </h1>
                  {subtitle ? (
                    <p className="mt-0.5 line-clamp-1 max-w-md text-sm text-[var(--text-secondary)]">
                      {subtitle}
                    </p>
                  ) : null}
                </div>
              </Link>

              <div className="flex items-center gap-1 lg:hidden">
                <button
                  type="button"
                  className="focus-ring flex h-11 w-11 items-center justify-center rounded-xl text-[var(--text-muted)] hover:bg-white/[0.04] hover:text-white"
                  onClick={() => openApiKeySettings()}
                  aria-label="החלף מפתח API"
                >
                  <KeyRound className="h-4 w-4" />
                </button>
                <nav
                  role="navigation"
                  className="flex max-w-[70vw] items-center gap-1 overflow-x-auto rounded-2xl border border-white/[0.06] bg-[var(--bg-card)] p-1"
                  aria-label="ניווט ראשי"
                >
                  {navItems.slice(0, 7).map(({ href, id, label, icon: Icon }) => (
                    <Link
                      key={id}
                      href={href}
                      className={`focus-ring flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition ${
                        current === id
                          ? "bg-[var(--brand-blue)]/20 text-white ring-1 ring-[var(--brand-blue)]/40"
                          : "text-[var(--text-muted)]"
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
                role="navigation"
                className="flex max-w-[58rem] items-center gap-1 overflow-x-auto rounded-2xl border border-white/[0.06] bg-[var(--bg-card)]/80 p-1.5"
                aria-label="ניווט ראשי"
              >
                {navItems.map(({ href, id, label, icon: Icon }) => (
                  <Link
                    key={`${id}-${href}`}
                    href={href}
                    className={`focus-ring inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                      current === id
                        ? "bg-white/[0.1] text-white shadow-sm ring-1 ring-white/10"
                        : "text-[var(--text-secondary)] hover:bg-white/[0.04] hover:text-white"
                    }`}
                    aria-current={current === id ? "page" : undefined}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                    {label}
                  </Link>
                ))}
              </nav>
              <button
                type="button"
                className="btn-ghost min-h-11"
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

      <main
        role="main"
        aria-label="תוכן ראשי"
        className="mx-auto w-full max-w-[90rem] flex-1 px-6 py-8 sm:px-10 sm:py-10"
      >
        {children}
      </main>

      <footer
        role="contentinfo"
        className="border-t border-white/[0.04] py-4 text-center text-xs text-[var(--text-muted)]"
      >
        BlackOpps · Election Intelligence · OSINT Pipeline
      </footer>
    </div>
  );
}
