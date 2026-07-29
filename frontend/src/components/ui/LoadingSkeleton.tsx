"use client";

export function LoadingSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="animate-pulse space-y-3 p-6" role="status" aria-label="טוען">
      <div className="h-6 w-3/4 rounded bg-white/5" />
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 rounded bg-white/5"
          style={{ width: `${65 + ((i * 17) % 30)}%` }}
        />
      ))}
    </div>
  );
}
