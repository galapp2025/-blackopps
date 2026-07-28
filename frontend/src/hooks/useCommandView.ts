"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { CommandView } from "@/components/command/CommandSidebar";

const VALID: CommandView[] = ["command", "gotv", "intel", "opposition", "dispatch"];

const LEGACY: Record<string, CommandView> = {
  osint: "intel",
  gotv: "gotv",
  opposition: "opposition",
  dispatch: "dispatch",
};

export function useCommandView(defaultView: CommandView = "command") {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const resolve = useCallback((): CommandView => {
    const v = searchParams.get("view") as CommandView | null;
    if (v && VALID.includes(v)) return v;
    const t = searchParams.get("tab");
    if (t && LEGACY[t]) return LEGACY[t];
    return defaultView;
  }, [searchParams, defaultView]);

  const [view, setViewState] = useState<CommandView>(resolve);

  useEffect(() => {
    const next = resolve();
    if (next !== view) setViewState(next);
  }, [resolve, view]);

  const setView = useCallback(
    (next: CommandView) => {
      setViewState(next);
      const params = new URLSearchParams(searchParams.toString());
      params.set("view", next);
      params.delete("tab");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return [view, setView] as const;
}
