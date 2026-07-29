"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "gold" | "danger" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
};

const sizes: Record<Size, string> = {
  sm: "h-10 min-w-[100px] px-4 text-sm",
  md: "h-12 min-w-[120px] px-6 text-base",
  lg: "h-14 min-w-[140px] px-8 text-lg",
};

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--brand-blue)] text-white hover:bg-blue-600 active:bg-blue-700 shadow-lg shadow-blue-500/20",
  gold: "bg-[var(--brand-gold)] text-black hover:bg-amber-500 active:bg-amber-600 shadow-lg shadow-amber-500/20",
  danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
  ghost: "bg-white/5 text-[var(--text-secondary)] hover:bg-white/10 hover:text-white",
  outline:
    "border border-white/15 text-[var(--text-secondary)] hover:border-white/30 hover:text-white bg-transparent",
};

function Spinner() {
  return (
    <span
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
      aria-hidden
    />
  );
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  onClick,
  disabled,
  loading,
  icon,
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]/50 disabled:cursor-not-allowed disabled:opacity-50 ${sizes[size]} ${variants[variant]} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Spinner /> : icon}
      {children}
    </button>
  );
}
