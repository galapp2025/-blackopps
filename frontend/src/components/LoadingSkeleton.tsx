"use client";

import { Skeleton } from "@/components/Skeleton";

type LoadingSkeletonProps = {
  rows?: number;
  className?: string;
};

export function LoadingSkeleton({ rows = 3, className = "" }: LoadingSkeletonProps) {
  return <Skeleton className={className} lines={rows} variant="card" />;
}
