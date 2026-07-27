"use client";

import { Check, ChevronDown, Loader2, Swords, X } from "lucide-react";
import { useState } from "react";

import { ComparisonRadar } from "@/components/ComparisonRadar";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { InfluenceScoreBar } from "@/components/InfluenceScoreBar";
import { Skeleton } from "@/components/Skeleton";
import type { ComparisonResult } from "@/lib/types";

type OppositionViewProps = {
  result: ComparisonResult | null;
  loading?: boolean;
  error?: string | null;
  onCompare: (a: string, b: string) => void;
};

function CandidateColumn({
  title,
  candidate,
}: {
  title: string;
  candidate: ComparisonResult["candidates"]["a"];
}) {
  const [openAttack, setOpenAttack] = useState(false);
  const [openGaps, setOpenGaps] = useState(false);

  return (
    <div className="glass-panel rounded-3xl p-5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <h3 className="text-xl font-bold text-white">{candidate.name}</h3>
        <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[10px] font-bold uppercase text-slate-300 ring-1 ring-white/10">
          {candidate.tier}
        </span>
      </div>
      <p className="mt-2 font-mono text-3xl font-extrabold text-cyan-300 tabular-nums">{Math.round(candidate.composite)}</p>

      <div className="mt-4 space-y-2">
        <InfluenceScoreBar label="פוליטי" value={candidate.dimensions.political ?? 0} />
        <InfluenceScoreBar label="קהילתי" value={candidate.dimensions.community ?? 0} />
        <InfluenceScoreBar label="בוחר" value={candidate.dimensions.voter ?? 0} />
        <InfluenceScoreBar label="פיננסי" value={candidate.dimensions.financial ?? 0} />
      </div>

      <ul className="mt-4 space-y-1.5">
        {candidate.strengths.slice(0, 4).map((s) => (
          <li key={s} className="flex gap-2 text-xs text-emerald-200">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {s}
          </li>
        ))}
      </ul>
      <ul className="mt-2 space-y-1.5">
        {candidate.weaknesses.slice(0, 4).map((s) => (
          <li key={s} className="flex gap-2 text-xs text-red-200">
            <X className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {s}
          </li>
        ))}
      </ul>

      <button type="button" className="btn-ghost mt-3 w-full justify-between text-xs" onClick={() => setOpenAttack((v) => !v)}>
        משטח תקיפה
        <ChevronDown className={`h-3.5 w-3.5 transition ${openAttack ? "rotate-180" : ""}`} />
      </button>
      {openAttack ? (
        <ul className="mt-1 space-y-1 text-xs text-slate-400">
          {candidate.attack_surface.map((x) => (
            <li key={x}>• {x}</li>
          ))}
        </ul>
      ) : null}

      <button type="button" className="btn-ghost mt-1 w-full justify-between text-xs" onClick={() => setOpenGaps((v) => !v)}>
        פערים הגנתיים
        <ChevronDown className={`h-3.5 w-3.5 transition ${openGaps ? "rotate-180" : ""}`} />
      </button>
      {openGaps ? (
        <ul className="mt-1 space-y-1 text-xs text-slate-400">
          {candidate.defensive_gaps.map((x) => (
            <li key={x}>• {x}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function OppositionView({ result, loading, error, onCompare }: OppositionViewProps) {
  const [a, setA] = useState("");
  const [b, setB] = useState("");

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-3xl p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <Swords className="h-4 w-4 text-red-400" />
          <h2 className="text-lg font-bold text-white">מחקר אופוזיציה</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-slate-400" htmlFor="cand-a">
              מועמד א׳
            </label>
            <input id="cand-a" className="input w-full" value={a} onChange={(e) => setA(e.target.value)} placeholder="בנימין נתניהו" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400" htmlFor="cand-b">
              מועמד ב׳
            </label>
            <input id="cand-b" className="input w-full" value={b} onChange={(e) => setB(e.target.value)} placeholder="יאיר לפיד" />
          </div>
        </div>
        <button
          type="button"
          className="btn-primary mt-4"
          disabled={loading || !a.trim() || !b.trim()}
          onClick={() => onCompare(a.trim(), b.trim())}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Swords className="h-4 w-4" />}
          {loading ? "טוען…" : "השווה מועמדים"}
        </button>
        {error ? <div className="mt-3"><ErrorState message={error} onRetry={() => onCompare(a.trim(), b.trim())} /></div> : null}
      </div>

      {loading && !result ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton variant="card" />
          <Skeleton variant="card" />
        </div>
      ) : null}

      {!loading && !result && !error ? (
        <EmptyState
          icon={<Swords className="mx-auto h-10 w-10" />}
          title="אין השוואה עדיין"
          description="הזן שמות של שני מועמדים להשוואה מודיעינית מלאה"
          action={
            a.trim() && b.trim()
              ? { label: "השווה עכשיו", onClick: () => onCompare(a.trim(), b.trim()) }
              : undefined
          }
        />
      ) : null}

      {result ? (
        <div className="space-y-6 animate-fade-up">
          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-50">
            יתרון ל{result.head_to_head.winner_composite} ב־{result.head_to_head.margin_composite.toFixed(1)} נקודות
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <CandidateColumn title="מועמד א׳" candidate={result.candidates.a} />
            <CandidateColumn title="מועמד ב׳" candidate={result.candidates.b} />
          </div>

          <ComparisonRadar
            aName={result.candidates.a.name}
            bName={result.candidates.b.name}
            aDims={result.candidates.a.dimensions}
            bDims={result.candidates.b.dimensions}
          />

          <div className="glass-panel rounded-3xl p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white">אסטרטגיה מומלצת</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{result.strategy.recommended || "—"}</p>
            </div>
            {result.strategy.key_battlegrounds.length > 0 ? (
              <div>
                <h4 className="text-xs font-semibold text-slate-400">זירות מפתח</h4>
                <ul className="mt-1 space-y-1 text-sm text-slate-300">
                  {result.strategy.key_battlegrounds.map((x) => (
                    <li key={String(x)}>• {String(x)}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {result.strategy.escalation_scenarios.length > 0 ? (
              <div>
                <h4 className="text-xs font-semibold text-slate-400">תרחישי הסלמה</h4>
                <ul className="mt-1 space-y-1 text-sm text-slate-300">
                  {result.strategy.escalation_scenarios.map((x) => (
                    <li key={String(x)}>• {String(x)}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {result.network.shared_connections.length > 0 ? (
              <div>
                <h4 className="text-xs font-semibold text-slate-400">קשרים משותפים</h4>
                <ul className="mt-1 space-y-1 text-sm text-slate-300">
                  {result.network.shared_connections.map((x) => (
                    <li key={String(x)}>• {String(x)}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
