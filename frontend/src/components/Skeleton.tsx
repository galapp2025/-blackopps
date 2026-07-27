"use client";

type SkeletonProps = {
  className?: string;
  lines?: number;
  variant?: "lines" | "card" | "table" | "chart" | "stat";
};

export function Skeleton({ className = "", lines = 3, variant = "lines" }: SkeletonProps) {
  if (variant === "stat") {
    return (
      <div className={`glass-panel rounded-3xl p-5 ${className}`} role="status" aria-label="טוען">
        <div className="h-3 w-16 animate-shimmer rounded-full" />
        <div className="mt-4 h-10 w-24 animate-shimmer rounded-xl" />
        <div className="mt-3 h-3 w-12 animate-shimmer rounded-full" />
        <span className="sr-only">טוען...</span>
      </div>
    );
  }

  if (variant === "chart") {
    return (
      <div className={`glass-panel aspect-square max-w-sm rounded-3xl p-5 ${className}`} role="status" aria-label="טוען תרשים">
        <div className="h-full w-full animate-shimmer rounded-full opacity-60" />
        <span className="sr-only">טוען...</span>
      </div>
    );
  }

  if (variant === "table") {
    return (
      <div className={`glass-panel overflow-hidden rounded-3xl ${className}`} role="status" aria-label="טוען טבלה">
        <div className="space-y-2 p-4">
          {Array.from({ length: 5 }).map((_, row) => (
            <div key={row} className="grid grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, col) => (
                <div key={col} className="h-4 animate-shimmer rounded-full" style={{ animationDelay: `${(row + col) * 60}ms` }} />
              ))}
            </div>
          ))}
        </div>
        <span className="sr-only">טוען...</span>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className={`glass-panel rounded-3xl p-5 ${className}`} role="status" aria-label="טוען">
        <div className="mb-4 flex items-center gap-3">
          <div className="h-10 w-10 animate-shimmer rounded-full" />
          <div className="h-4 w-32 animate-shimmer rounded-full" />
        </div>
        <div className="mb-3 h-24 w-full animate-shimmer rounded-2xl" />
        <div className="space-y-2">
          {Array.from({ length: lines }).map((_, i) => (
            <div key={i} className="h-3 animate-shimmer rounded-full" style={{ width: `${90 - i * 12}%` }} />
          ))}
        </div>
        <span className="sr-only">טוען...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`} role="status" aria-label="טוען">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 animate-shimmer rounded-full"
          style={{ width: `${85 - i * 15}%`, animationDelay: `${i * 100}ms` }}
        />
      ))}
      <span className="sr-only">טוען...</span>
    </div>
  );
}
