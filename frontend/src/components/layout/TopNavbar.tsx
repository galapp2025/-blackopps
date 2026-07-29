"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { openApiKeySettings } from "@/components/ApiKeyGate";

const navigation = [
  { href: "/", label: "דשבורד", icon: "🏠" },
  { href: "/war-room", label: 'חמ"ל', icon: "⚔️" },
  { href: "/voters", label: "בוחרים", icon: "👥" },
  { href: "/messages", label: "מסרים", icon: "✉️" },
  { href: "/influence", label: "השפעה", icon: "🕸️" },
  { href: "/sentiment", label: "סנטימנט", icon: "📊" },
  { href: "/writer", label: "כותב", icon: "✍️" },
  { href: "/dossier", label: "תיק", icon: "📁" },
  { href: "/trends", label: "טרנדים", icon: "🌐" },
  { href: "/prediction", label: "חיזוי", icon: "🔮" },
  { href: "/whatsapp", label: "וואטסאפ", icon: "💬" },
] as const;

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function TopNavbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  return (
    <>
      {/* Desktop sticky top navbar */}
      <nav
        className="sticky top-0 z-50 hidden h-16 items-center justify-between border-b border-white/[0.06] bg-[var(--bg-secondary)]/95 px-4 shadow-lg backdrop-blur-xl lg:flex xl:px-6"
        aria-label="ניווט ראשי"
        dir="rtl"
      >
        <Link href="/" className="flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-1">
          <span className="text-2xl" aria-hidden>
            🦅
          </span>
          <span className="text-lg font-bold text-white">BlackOpps</span>
          <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-[var(--text-muted)]">
            v5.0
          </span>
        </Link>

        <div className="mx-2 flex min-w-0 flex-1 items-center justify-center gap-0.5 overflow-x-auto">
          {navigation.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-2 text-sm font-medium transition-all duration-200 xl:px-3 ${
                  active
                    ? "bg-[var(--brand-gold)]/15 text-[var(--brand-gold)] shadow-sm"
                    : "text-[var(--text-secondary)] hover:bg-white/5 hover:text-white"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <span className="text-base" aria-hidden>
                  {item.icon}
                </span>
                <span className="hidden xl:inline">{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/war-room"
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl transition-colors hover:bg-white/5"
            aria-label="התראות — חמ״ל"
            title="התראות"
          >
            <span className="text-lg" aria-hidden>
              🔔
            </span>
            <span className="absolute top-2 right-2 h-2 w-2 animate-pulse rounded-full bg-red-500" />
          </Link>
          <button
            type="button"
            onClick={() => openApiKeySettings()}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--brand-gold)]/20 text-sm font-bold text-[var(--brand-gold)] transition hover:bg-[var(--brand-gold)]/30"
            aria-label="הגדרות מפתח API"
            title="הגדרות"
          >
            מ״נ
          </button>
        </div>
      </nav>

      {/* Mobile / tablet sticky bar */}
      <nav
        className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-white/[0.06] bg-[var(--bg-secondary)]/95 px-3 shadow-lg backdrop-blur-xl lg:hidden"
        aria-label="ניווט מובייל"
        dir="rtl"
      >
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl transition-colors hover:bg-white/5 active:scale-[0.98]"
          aria-label={mobileOpen ? "סגור תפריט" : "פתח תפריט"}
          aria-expanded={mobileOpen}
        >
          <span className="text-xl" aria-hidden>
            {mobileOpen ? "✕" : "☰"}
          </span>
        </button>

        <Link href="/" className="flex min-h-11 items-center gap-2 rounded-xl px-1">
          <span className="text-xl" aria-hidden>
            🦅
          </span>
          <span className="text-base font-bold text-white">BlackOpps</span>
        </Link>

        <div className="flex items-center gap-1">
          <Link
            href="/war-room"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl hover:bg-white/5 active:scale-[0.98]"
            aria-label="התראות"
          >
            <span className="text-lg" aria-hidden>
              🔔
            </span>
          </Link>
          <button
            type="button"
            onClick={() => openApiKeySettings()}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--brand-gold)]/20 text-xs font-bold text-[var(--brand-gold)]"
            aria-label="הגדרות"
          >
            מ״נ
          </button>
        </div>
      </nav>

      {/* Mobile slide-out */}
      {mobileOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            aria-label="סגור תפריט"
            onClick={() => setMobileOpen(false)}
          />
          <div
            className="animate-slide-in-right fixed top-14 right-0 z-50 h-[calc(100vh-3.5rem)] w-72 overflow-y-auto border-l border-white/[0.06] bg-[var(--bg-secondary)] shadow-2xl lg:hidden"
            role="dialog"
            aria-label="תפריט ניווט"
            dir="rtl"
          >
            <div className="space-y-1 p-4">
              {navigation.map((item) => {
                const active = isActivePath(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex min-h-12 items-center gap-3 rounded-xl px-4 py-3 text-base font-medium transition-all active:scale-[0.98] ${
                      active
                        ? "bg-[var(--brand-gold)]/15 text-[var(--brand-gold)]"
                        : "text-[var(--text-secondary)] hover:bg-white/5 hover:text-white"
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    <span className="text-xl" aria-hidden>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                    {active ? (
                      <span className="mr-auto text-[var(--brand-gold)]" aria-hidden>
                        ●
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
