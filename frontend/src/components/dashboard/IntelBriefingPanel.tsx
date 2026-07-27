"use client";

import { Loader2, Network, Radar } from "lucide-react";
import { useEffect, useState } from "react";

import {
  analyzeOsint,
  getIntelBriefing,
  getIntelNetwork,
  getIntelTimeline,
} from "@/lib/api";
import type { EnrichmentResult } from "@/lib/types";
import type { OsintProfile } from "@/lib/types/osint";

type IntelBriefingPanelProps = {
  voterName: string;
};

export function IntelBriefingPanel({ voterName }: IntelBriefingPanelProps) {
  const [loading, setLoading] = useState(true);
  const [osint, setOsint] = useState<OsintProfile | EnrichmentResult | null>(null);
  const [briefing, setBriefing] = useState<Record<string, unknown> | null>(null);
  const [network, setNetwork] = useState<Record<string, unknown> | null>(null);
  const [timeline, setTimeline] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [osintRes, briefingRes, networkRes, timelineRes] = await Promise.all([
          analyzeOsint([voterName]),
          getIntelBriefing(voterName),
          getIntelNetwork(voterName),
          getIntelTimeline(voterName),
        ]);
        if (cancelled) return;
        setOsint(osintRes.profiles[0] ?? null);
        setBriefing(briefingRes);
        setNetwork(networkRes);
        setTimeline(timelineRes.timeline ?? []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Intel load failed");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [voterName]);

  if (loading) {
    return (
      <section className="glass-panel flex items-center justify-center gap-2 rounded-3xl p-8 text-slate-300">
        <Loader2 className="h-5 w-5 animate-spin" />
        טוען מודיעין OSINT...
      </section>
    );
  }

  if (error) {
    return (
      <section className="glass-panel rounded-3xl border border-red-500/20 p-6 text-sm text-red-200">
        {error}
      </section>
    );
  }

  const tier = String(osint?.tier ?? briefing?.tier ?? "—");
  const composite = osint?.scores.composite ?? briefing?.composite_score ?? "—";
  const cluster = (network?.cluster as unknown[]) ?? [];
  const clusterSize = network?.size ?? cluster.length;

  return (
    <section className="glass-panel-strong space-y-4 rounded-3xl p-6 lg:col-span-3">
      <div className="flex items-center gap-2 border-b border-white/5 pb-4">
        <Radar className="h-4 w-4 text-cyan-400" />
        <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-300">מודיעין OSINT</h3>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Composite" value={String(composite)} />
        <Metric label="Tier" value={tier} />
        <Metric label="Political" value={String(osint?.scores.political ?? "—")} />
        <Metric label="Community" value={String(osint?.scores.community ?? "—")} />
        <Metric label="Voter" value={String(osint?.scores.voter ?? "—")} />
        <Metric label="Financial" value={String(osint?.scores.financial ?? "—")} />
        <Metric label="Network cluster" value={String(clusterSize)} />
        <Metric label="Timeline snaps" value={String(timeline.length)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Block title="Evidence">
          <ul className="space-y-1 text-sm text-slate-300">
            {(osint?.evidence ?? []).slice(0, 8).map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </Block>
        <Block title="Network graph (cluster)">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Network className="h-4 w-4 text-emerald-400" />
            {cluster.slice(0, 6).map((node, index) => {
              const record = node as { entity?: string; via?: string };
              return (
                <span key={`${record.entity}-${index}`} className="rounded bg-slate-900 px-2 py-1 text-xs">
                  {record.entity ?? "node"} ← {record.via ?? "—"}
                </span>
              );
            })}
            {cluster.length === 0 ? <span>אין קשרים ממופים עדיין</span> : null}
          </div>
        </Block>
      </div>

      <Block title="Recommendation">
        <p className="text-sm leading-relaxed text-slate-200">
          {String(osint?.recommendation ?? briefing?.recommendation ?? "—")}
        </p>
      </Block>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-slate-950/50 p-3">
      <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 font-mono text-lg font-bold text-white">{value}</p>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</p>
      {children}
    </div>
  );
}
