"use client";

import { Check, Copy, Loader2 } from "lucide-react";
import { useState } from "react";

type Strategy = {
  headline: string;
  full_text: string;
  expected_impact: number;
  risk_level: number;
  target_audience: string;
  gotv_variants?: Record<string, string> | null;
};

type StrategicResponsePanelProps = {
  trendTitle?: string;
  responses: Record<string, Strategy>;
  recommendation?: {
    primary?: string;
    reason?: string;
    urgency?: string;
    sequence?: string[];
  };
  loading?: boolean;
};

const TABS: { id: string; label: string }[] = [
  { id: "defensive", label: "הגנתי" },
  { id: "offensive", label: "התקפי" },
  { id: "pivot", label: "הפנייה" },
  { id: "humor", label: "הומור" },
  { id: "ignore", label: "התעלמות" },
  { id: "amplify", label: "הגברה" },
];

const GOTV_LABELS: Record<string, string> = {
  SAFE: "בטוח",
  LEANING: "נוטה",
  SWING: "מתנדנד",
  AT_RISK: "בסיכון",
};

export function StrategicResponsePanel({
  trendTitle,
  responses,
  recommendation,
  loading,
}: StrategicResponsePanelProps) {
  const [tab, setTab] = useState("defensive");
  const [copied, setCopied] = useState(false);
  const [approved, setApproved] = useState(false);
  const strategy = responses[tab];

  const copy = async () => {
    if (!strategy?.full_text) return;
    await navigator.clipboard.writeText(strategy.full_text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  if (loading) {
    return (
      <div dir="rtl" className="glass-panel flex justify-center rounded-3xl p-10">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!strategy) {
    return (
      <div dir="rtl" className="glass-panel rounded-3xl p-6 text-sm text-slate-500">
        בחר טרנד ולחץ על יצירת תגובות
      </div>
    );
  }

  return (
    <section dir="rtl" className="glass-panel space-y-4 rounded-3xl p-5 sm:p-6">
      <div>
        <h3 className="text-lg font-semibold text-white">פאנל תגובה אסטרטגית</h3>
        {trendTitle ? <p className="text-xs text-slate-400">{trendTitle}</p> : null}
      </div>

      {recommendation ? (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-100">
          <p className="font-semibold">המלצה: {recommendation.primary}</p>
          <p className="mt-1 text-xs text-amber-100/80">{recommendation.reason}</p>
          <p className="mt-1 text-xs">{recommendation.urgency}</p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition ${
              tab === t.id ? "bg-cyan-500/20 text-cyan-100 ring-cyan-400/40" : "bg-white/5 text-slate-300 ring-white/10"
            }`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div>
        <h4 className="mb-2 text-base font-bold text-white">{strategy.headline}</h4>
        <pre className="whitespace-pre-wrap rounded-2xl bg-[#0b141a]/80 p-4 text-sm leading-relaxed text-slate-200">
          {strategy.full_text}
        </pre>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
        <div className="rounded-xl bg-white/5 p-3">
          <p className="text-slate-500">השפעה צפויה</p>
          <p className="text-lg font-bold text-green-300">{Math.round(strategy.expected_impact * 100)}%</p>
        </div>
        <div className="rounded-xl bg-white/5 p-3">
          <p className="text-slate-500">רמת סיכון</p>
          <p className="text-lg font-bold text-red-300">{Math.round(strategy.risk_level * 100)}%</p>
        </div>
        <div className="col-span-2 rounded-xl bg-white/5 p-3">
          <p className="text-slate-500">קהל יעד</p>
          <p className="font-medium text-slate-200">{strategy.target_audience}</p>
        </div>
      </div>

      {strategy.gotv_variants ? (
        <div className="space-y-2">
          <h5 className="text-sm font-semibold text-slate-300">וריאציות GOTV</h5>
          {Object.entries(strategy.gotv_variants).map(([k, v]) => (
            <div key={k} className="rounded-xl bg-white/5 p-3 text-xs">
              <span className="font-semibold text-cyan-300">{GOTV_LABELS[k] || k}: </span>
              <span className="text-slate-300">{v}</span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-secondary text-xs" onClick={() => void copy()}>
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "הועתק" : "העתק טקסט"}
        </button>
        <button
          type="button"
          className="btn-primary text-xs"
          onClick={() => setApproved(true)}
        >
          {approved ? "אושר" : "אשר תגובה"}
        </button>
        <a href="/whatsapp" className="btn-secondary text-xs">
          שלח לכותב וואטסאפ
        </a>
      </div>
    </section>
  );
}
