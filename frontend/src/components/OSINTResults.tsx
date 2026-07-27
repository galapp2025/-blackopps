"use client";

import { AlertTriangle, CheckCircle2, Sparkles } from "lucide-react";

import { InfluenceScoreBar } from "@/components/InfluenceScoreBar";
import { PdfDownloader } from "@/components/PdfDownloader";
import type { EnrichmentResult } from "@/lib/types";

const TIER_STYLES: Record<string, string> = {
  CRITICAL: "bg-red-500/20 text-red-200 ring-red-500/40",
  HIGH: "bg-orange-500/20 text-orange-100 ring-orange-500/40",
  MODERATE: "bg-amber-500/20 text-amber-100 ring-amber-500/40",
  MEDIUM: "bg-amber-500/20 text-amber-100 ring-amber-500/40",
  LOW: "bg-slate-500/20 text-slate-200 ring-slate-500/40",
  NEGLIGIBLE: "bg-slate-600/30 text-slate-300 ring-slate-500/30",
};

type OSINTResultsProps = {
  profiles: EnrichmentResult[];
};

export function OSINTResults({ profiles }: OSINTResultsProps) {
  if (!profiles.length) {
    return (
      <div className="glass-panel rounded-3xl p-10 text-center">
        <p className="text-sm text-slate-400">הזן שמות או העלה קובץ כדי להתחיל בניתוח</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {profiles.map((p) => {
        const tier = (p.tier || "UNKNOWN").toUpperCase();
        const badge = TIER_STYLES[tier] || TIER_STYLES.NEGLIGIBLE;
        const composite = p.scores.composite ?? 0;
        return (
          <article key={p.name} className="glass-panel animate-fade-up rounded-3xl p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-white">{p.name}</h3>
                <p className="mt-1 text-xs text-slate-500">ציון מורכב</p>
                <p className="font-mono text-3xl font-extrabold text-cyan-300 tabular-nums">{Math.round(composite)}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ${badge}`}>
                {tier}
              </span>
            </div>

            <div className="space-y-3">
              <InfluenceScoreBar label="פוליטי" value={p.scores.political ?? 0} color="from-red-500 to-rose-400" />
              <InfluenceScoreBar label="קהילתי" value={p.scores.community ?? 0} color="from-cyan-500 to-sky-400" />
              <InfluenceScoreBar label="בוחר" value={p.scores.voter ?? 0} color="from-emerald-500 to-teal-400" />
              <InfluenceScoreBar label="פיננסי" value={p.scores.financial ?? 0} color="from-amber-500 to-yellow-400" />
            </div>

            {p.recommendation ? (
              <div className="mt-4 rounded-2xl border border-white/5 bg-slate-950/50 p-3">
                <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                  <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                  המלצה
                </div>
                <p className="text-sm leading-relaxed text-slate-200">{p.recommendation}</p>
              </div>
            ) : null}

            {(p.risks?.length ?? 0) > 0 ? (
              <ul className="mt-3 space-y-1.5">
                {p.risks!.slice(0, 4).map((r) => (
                  <li key={r} className="flex items-start gap-2 text-xs text-red-200/90">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {r}
                  </li>
                ))}
              </ul>
            ) : null}

            {(p.opportunities?.length ?? 0) > 0 ? (
              <ul className="mt-2 space-y-1.5">
                {p.opportunities!.slice(0, 3).map((o) => (
                  <li key={o} className="flex items-start gap-2 text-xs text-emerald-200/90">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {o}
                  </li>
                ))}
              </ul>
            ) : null}

            {(p.evidence?.length ?? 0) > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {p.evidence!.slice(0, 6).map((e) => (
                  <span key={e} className="rounded-full bg-white/[0.04] px-2.5 py-1 text-[10px] text-slate-400 ring-1 ring-white/10">
                    {e}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="mt-4">
              <PdfDownloader name={p.name} />
            </div>
          </article>
        );
      })}
    </div>
  );
}
