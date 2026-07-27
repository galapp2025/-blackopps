"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { DashboardTab } from "@/lib/types";

const VALID: DashboardTab[] = ["osint", "gotv", "opposition", "dispatch"];

export function useTabState(defaultTab: DashboardTab = "osint") {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const fromUrl = searchParams.get("tab") as DashboardTab | null;
  const initial = fromUrl && VALID.includes(fromUrl) ? fromUrl : defaultTab;
  const [tab, setTabState] = useState<DashboardTab>(initial);

  useEffect(() => {
    const next = searchParams.get("tab") as DashboardTab | null;
    if (next && VALID.includes(next) && next !== tab) {
      setTabState(next);
    }
  }, [searchParams, tab]);

  const setTab = useCallback(
    (next: DashboardTab) => {
      setTabState(next);
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", next);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return [tab, setTab] as const;
}
