import type { HTMLAttributes, ReactNode } from "react";

type GlassPanelProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  className?: string;
};

export function GlassPanel({ children, className = "", ...props }: GlassPanelProps) {
  return (
    <div
      className={`rounded-[var(--radius,16px)] border border-[var(--glass-border,rgba(255,255,255,0.06))] bg-[var(--glass-bg,rgba(15,23,42,0.6))] shadow-[var(--glass-shadow,0_8px_32px_rgba(0,0,0,0.4))] backdrop-blur-[var(--blur-amount,16px)] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
