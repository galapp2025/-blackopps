"use client";

import { useCallback, useEffect, useState } from "react";

import { api } from "@/lib/api";

export type SystemStatus = {
  api: boolean;
  database: boolean;
  intelligence: boolean;
  dispatch: boolean;
  loading: boolean;
  voterTotal: number;
  version: string;
};

export function useSystemCheck() {
  const [status, setStatus] = useState<SystemStatus>({
    api: false,
    database: false,
    intelligence: false,
    dispatch: false,
    loading: true,
    voterTotal: 0,
    version: "",
  });

  const run = useCallback(async () => {
    setStatus((s) => ({ ...s, loading: true }));
    const checks = await Promise.allSettled([
      api.health(),
      api.getVoters({ limit: 1 }),
      api.getAlerts(),
      api.getDispatchStats(),
    ]);
    const health = checks[0].status === "fulfilled" ? checks[0].value : null;
    const voters = checks[1].status === "fulfilled" ? checks[1].value : null;
    setStatus({
      api: checks[0].status === "fulfilled",
      database: checks[1].status === "fulfilled",
      intelligence: checks[2].status === "fulfilled",
      dispatch: checks[3].status === "fulfilled",
      loading: false,
      voterTotal: voters?.total ?? 0,
      version: health?.version ?? "—",
    });
  }, []);

  useEffect(() => {
    void run();
  }, [run]);

  const nominal = status.api && status.database && status.dispatch;
  return { status, nominal, refresh: run };
}
