"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { api } from "@/lib/api";
import type { DispatchStats } from "@/lib/types";

type IntelSnapshot = {
  alertTotal: number;
  swingHint: number;
  atRiskHint: number;
  dispatch: DispatchStats | null;
  flash: boolean;
};

export function useIntelRefresh(intervalMs = 30_000, gotvSwing = 0, gotvAtRisk = 0) {
  const [intel, setIntel] = useState<IntelSnapshot>({
    alertTotal: 0,
    swingHint: gotvSwing,
    atRiskHint: gotvAtRisk,
    dispatch: null,
    flash: false,
  });
  const prevAlerts = useRef(0);

  const refresh = useCallback(async () => {
    try {
      const [alerts, dispatch] = await Promise.all([api.getAlerts(), api.getDispatchStats()]);
      const total = alerts.total ?? alerts.alerts?.length ?? 0;
      const changed = total !== prevAlerts.current;
      prevAlerts.current = total;
      setIntel((s) => ({
        alertTotal: total,
        swingHint: gotvSwing,
        atRiskHint: gotvAtRisk,
        dispatch,
        flash: changed,
      }));
      if (changed) {
        window.setTimeout(() => setIntel((s) => ({ ...s, flash: false })), 1500);
      }
    } catch {
      /* keep last snapshot */
    }
  }, [gotvSwing, gotvAtRisk]);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), intervalMs);
    return () => window.clearInterval(id);
  }, [refresh, intervalMs]);

  useEffect(() => {
    setIntel((s) => ({ ...s, swingHint: gotvSwing, atRiskHint: gotvAtRisk }));
  }, [gotvSwing, gotvAtRisk]);

  return { intel, refreshIntel: refresh };
}
