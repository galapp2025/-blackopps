"use client";

type LoadingSkeletonProps = {
  rows?: number;
  className?: string;
};

export function LoadingSkeleton({ rows = 3, className = "" }: LoadingSkeletonProps) {
  return (
    <div className={`space-y-3 ${className}`} aria-busy aria-live="polite">
      <p className="sr-only">טוען…</p>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="shimmer h-24 rounded-2xl border border-white/5 bg-slate-900/40" />
      ))}
    </div>
  );
}
