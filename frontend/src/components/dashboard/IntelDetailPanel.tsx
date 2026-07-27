"use client";

import { Loader2, Network, ScrollText, ShieldAlert, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import { SectionHeader } from "@/components/ui/SectionHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { getIntelAlerts, getIntelBriefing, getIntelNetwork, getIntelTimeline } from "@/lib/api";
import type { Briefing, IntelAlert, NetworkCluster, TimelinePoint } from "@/lib/types/osint";

type IntelDetailPanelProps = {
  name: string;
};

type Tab = "briefing" | "network" | "timeline" | "alerts";

export function IntelDetailPanel({ name }: IntelDetailPanelProps) {
  const [tab, setTab] = useState<Tab>("briefing");
  const [loading, setLoading] = useState(false);
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [network, setNetwork] = useState<NetworkCluster | null>(null);
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);
  const [alerts, setAlerts] = useState<IntelAlert[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTab("briefing");
    setBriefing(null);
    setNetwork(null);
    setTimeline([]);
    setAlerts([]);
    setError(null);
  }, [name]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        if (tab === "briefing") {
          const data = await getIntelBriefing(name);
          if (!cancelled) setBriefing(data);
        } else if (tab === "network") {
          const data = await getIntelNetwork(name);
          if (!cancelled) setNetwork(data);
        } else if (tab === "timeline") {
          const data = await getIntelTimeline(name);
          if (!cancelled) setTimeline(data.timeline);
        } else {
          const data = await getIntelAlerts();
          if (!cancelled) setAlerts(data.alerts);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "טעינה נכשלה");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [name, tab]);

  const tabs: { id: Tab; label: string; icon: typeof Sparkles }[] = [
    { id: "briefing", label: "תדריך", icon: Sparkles },
    { id: "network", label: "רשת", icon: Network },
    { id: "timeline", label: "ציר זמן", icon: ScrollText },
    { id: "alerts", label: "התרעות", icon: ShieldAlert },
  ];

  return (
    <section className="glass-panel rounded-3xl p-6">
      <SectionHeader eyebrow="מודיעין OSINT" title={name} icon={Sparkles} />

      <div
        className="mb-5 inline-flex w-full flex-wrap gap-1 rounded-2xl border border-white/[0.06] bg-slate-950/50 p-1"
        role="tablist"
        aria-label="לשוניות מודיעין"
      >
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`focus-ring inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition sm:flex-none ${
              tab === id
                ? "bg-white/[0.08] text-white shadow-sm ring-1 ring-white/10"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3 py-2" role="status" aria-live="polite">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <p className="flex items-center justify-center gap-2 py-4 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            טוען מודיעין…
          </p>
        </div>
      ) : error ? (
        <p className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-200" role="alert">
          {error}
        </p>
      ) : tab === "briefing" && briefing ? (
        <div className="animate-fade-up space-y-4 text-sm">
          <p className="font-mono text-[11px] uppercase tracking-wider text-amber-400/90">{briefing.classification}</p>
          <p className="text-base leading-relaxed text-slate-100">{briefing.recommendation}</p>
          <p className="leading-relaxed text-slate-400">{briefing.engagement_strategy}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {briefing.evidence.slice(0, 8).map((item) => (
              <div key={item} className="rounded-xl border border-white/[0.05] bg-slate-950/50 px-3 py-2.5 text-xs text-slate-300">
                {item}
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500">מקורות: {briefing.sources.join(" · ")}</p>
        </div>
      ) : tab === "network" && network ? (
        <div className="animate-fade-up space-y-3 text-sm">
          <p className="text-slate-400">
            גודל אשכול: <span className="font-mono text-white">{network.size}</span> · hubs:{" "}
            <span className="font-mono text-cyan-300">{network.hub_count}</span>
          </p>
          <ul className="space-y-2">
            {network.cluster.map((edge) => (
              <li
                key={`${edge.entity}-${edge.relation}`}
                className="rounded-xl border border-white/[0.05] bg-slate-950/50 px-3 py-2.5 text-xs text-slate-300"
              >
                <span className="font-medium text-cyan-300">{edge.entity}</span> ← {edge.relation}{" "}
                <span className="text-slate-500">({edge.via})</span>
              </li>
            ))}
          </ul>
        </div>
      ) : tab === "timeline" ? (
        <ul className="custom-scrollbar max-h-72 space-y-2 overflow-y-auto pr-1 text-xs">
          {timeline.length === 0 ? (
            <li className="py-8 text-center text-slate-500">אין אירועים בציר הזמן</li>
          ) : (
            timeline.map((point) => (
              <li key={point.ts} className="flex flex-wrap items-center gap-2 rounded-xl border border-white/[0.05] bg-slate-950/50 px-3 py-2.5">
                <span className="font-mono text-slate-500">{new Date(point.ts).toLocaleString("he-IL")}</span>
                <span className="font-mono font-bold text-red-300">{point.composite}</span>
                <span className="text-slate-400">{point.tier}</span>
              </li>
            ))
          )}
        </ul>
      ) : (
        <ul className="space-y-2 text-sm text-slate-300">
          {alerts.length === 0 ? (
            <li className="py-8 text-center text-slate-500">אין התרעות פעילות</li>
          ) : (
            alerts.map((alert, i) => (
              <li key={i} className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] px-3 py-2.5">
                {String(alert.message ?? JSON.stringify(alert))}
              </li>
            ))
          )}
        </ul>
      )}
    </section>
  );
}
