type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className = "" }: SkeletonProps) {
  return <div className={`shimmer rounded-lg bg-white/[0.04] ${className}`} aria-hidden />;
}
