"use client";

import type { ReactNode } from "react";

type Accent = "safe" | "leaning" | "swing" | "atrisk";

type CardProps = {
  children: ReactNode;
  className?: string;
  highlighted?: boolean;
  accent?: Accent;
};

const accentBorder: Record<Accent, string> = {
  safe: "border-l-4 border-l-[var(--gotv-safe)]",
  leaning: "border-l-4 border-l-[var(--gotv-leaning)]",
  swing: "border-l-4 border-l-[var(--gotv-swing)]",
  atrisk: "border-l-4 border-l-[var(--gotv-atrisk)]",
};

export function Card({ children, className = "", highlighted, accent }: CardProps) {
  return (
    <div
      className={`space-y-4 rounded-2xl border border-white/[0.06] bg-[var(--bg-card)] p-6 shadow-[var(--shadow-card)] transition-all duration-200 ${
        highlighted ? "ring-2 ring-[var(--brand-gold)]/30" : ""
      } ${accent ? accentBorder[accent] : ""} ${className}`}
    >
      {children}
    </div>
  );
}
