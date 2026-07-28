"use client";

import Link from "next/link";
import { ArrowRight, Loader2, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useToast } from "@/components/Toast";
import { api, ApiError } from "@/lib/api";
import type { TurnoutPredictionResult, TurnoutTrendResult, WhatIfResult } from "@/lib/types/features56";

function turnoutColor(pct: number) {
  if (pct >= 65) return "#22c55e";
  if (pct >= 55) return "#eab308";
  return "#ef4444";
}

function BigNumber({ value, delta }: { value: number; delta: number }) {
  const up = delta >= 0;
  return (
    <div className="text-center">
      <p className="live-pulse text-5xl font-extrabold text-white sm:text-6xl">{value.toFixed(1)}%</p>
      <p className={`mt-2 text-sm font-semibold ${up ? "text-green-400" : "text-red-400"}`}>
        {up ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}% מהבחירה הקודמת
      </p>
    </div>
  );
}

function ConfidenceBand({ lower, predicted, upper }: { lower: number; predicted: number; upper: number }) {
  const span = Math.max(upper - lower, 1);
  const left = ((predicted - lower) / span) * 100;
  return (
    <div className="mt-4">
      <div className="relative h-3 overflow-hidden rounded-full bg-slate-800">
        <div className="absolute inset-y-0 start-0 end-0 bg-cyan-500/30" />
        <div
          className="absolute top-0 h-full w-0.5 bg-cyan-300"
          style={{ insetInlineStart: `${Math.min(100, Math.max(0, left))}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-xs text-slate-400">
        <span>{lower.toFixed(1)}%</span>
        <span className="text-cyan-200">{predicted.toFixed(1)}%</span>
        <span>{upper.toFixed(1)}%</span>
      </div>
    </div>
  );
}

export default function PredictionPage() {
  const { push } = useToast();
  const [prediction, setPrediction] = useState<TurnoutPredictionResult | null>(null);
  const [trend, setTrend] = useState<TurnoutTrendResult | null>(null);
  const [whatIf, setWhatIf] = useState<WhatIfResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [whatIfCount, setWhatIfCount] = useState(50);
  const [whatIfNb, setWhatIfNb] = useState("");
  const [whatIfLoading, setWhatIfLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, t] = await Promise.all([api.predictTurnout(), api.predictTrend(30)]);
      setPrediction(p);
      setTrend(t);
    } catch (err) {
      push({ type: "error", message: err instanceof ApiError ? err.message : "טעינת תחזית נכשלה" });
    } finally {
      setLoading(false);
    }
  }, [push]);

  useEffect(() => {
    void load();
  }, [load]);

  const barData = useMemo(
    () =>
      (prediction?.neighborhood_breakdown ?? []).map((n) => ({
        name: n.name,
        turnout: n.predicted_turnout,
        low: n.ci_range[0],
        high: n.ci_range[1],
      })),
    [prediction],
  );

  const riskRows = useMemo(() => {
    const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return [...(prediction?.neighborhood_breakdown ?? [])].sort(
      (a, b) => (order[a.risk_level as keyof typeof order] ?? 9) - (order[b.risk_level as keyof typeof order] ?? 9),
    );
  }, [prediction]);

  const runWhatIf = async () => {
    setWhatIfLoading(true);
    const started = performance.now();
    try {
      const res = await api.predictWhatIf({
        scenario: "convert_swing",
        target_count: whatIfCount,
        target_neighborhood: whatIfNb || undefined,
      });
      setWhatIf(res);
      const ms = performance.now() - started;
      if (ms > 500) {
        push({ type: "info", message: `חישוב הושלם ב־${Math.round(ms)} מ״ש` });
      }
    } catch (err) {
      push({ type: "error", message: err instanceof ApiError ? err.message : "סימולציה נכשלה" });
    } finally {
      setWhatIfLoading(false);
    }
  };

  const t = prediction?.turnout;

  return (
    <div dir="rtl" className="situation-room min-h-screen px-4 py-6 sm:px-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs text-cyan-300/80">מנוע חיזוי סטטיסטי</p>
          <h1 className="command-text text-2xl font-bold text-white sm:text-3xl">מרכז פיקוד תחזית הצבעה</h1>
        </div>
        <Link href="/" className="btn-secondary">
          <ArrowRight className="h-4 w-4" />
          חזרה לפיקוד
        </Link>
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        </div>
      ) : (
        <div className="space-y-6">
          <section className="glass-panel rounded-3xl p-6 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              {t ? <BigNumber value={t.predicted} delta={t.delta} /> : null}
              <div className="flex-1 lg:max-w-md">
                <p className="mb-2 text-sm text-slate-400">רווח סמך {((prediction?.model.confidence_level ?? 0.95) * 100).toFixed(0)}%</p>
                {t ? <ConfidenceBand lower={t.ci_lower} predicted={t.predicted} upper={t.ci_upper} /> : null}
                <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                  <TrendingUp className="h-4 w-4" />
                  מגמה: {t?.trend === "IMPROVING" ? "משתפרת" : t?.trend === "DECLINING" ? "יורדת" : "יציבה"} ·{" "}
                  {prediction?.model.simulations.toLocaleString("he-IL")} סימולציות
                </p>
              </div>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="glass-panel rounded-3xl p-5">
              <h2 className="mb-4 text-lg font-semibold text-white">פילוח שכונות</h2>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 8, right: 8, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} angle={-25} textAnchor="end" height={50} />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 12 }}
                      formatter={(v) => [`${Number(v)}%`, "הצבעה"]}
                    />
                    <Bar dataKey="turnout" radius={[6, 6, 0, 0]}>
                      {barData.map((entry) => (
                        <Cell key={entry.name} fill={turnoutColor(entry.turnout)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="glass-panel rounded-3xl p-5">
              <h2 className="mb-4 text-lg font-semibold text-white">מגמת 30 יום</h2>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={trend?.trend ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" hide />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} domain={["auto", "auto"]} />
                    <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155" }} />
                    <Line type="monotone" dataKey="ci_upper" stroke="#334155" dot={false} strokeDasharray="4 4" />
                    <Line type="monotone" dataKey="ci_lower" stroke="#334155" dot={false} strokeDasharray="4 4" />
                    <Line type="monotone" dataKey="predicted_turnout" stroke="#22d3ee" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>

          <section className="glass-panel rounded-3xl p-5">
            <h2 className="mb-4 text-lg font-semibold text-white">סימולטור מה-אם</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs text-slate-400" htmlFor="swing-count">
                  הפוך SWING ל-SAFE (כמות)
                </label>
                <input
                  id="swing-count"
                  type="range"
                  min={0}
                  max={100}
                  value={whatIfCount}
                  onChange={(e) => setWhatIfCount(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
                <p className="text-sm text-white">{whatIfCount} מצביעים</p>
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400" htmlFor="nb-select">
                  שכונה
                </label>
                <select
                  id="nb-select"
                  className="input w-full"
                  value={whatIfNb}
                  onChange={(e) => setWhatIfNb(e.target.value)}
                >
                  <option value="">כל העיר</option>
                  {barData.map((b) => (
                    <option key={b.name} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button type="button" className="btn-primary w-full" onClick={() => void runWhatIf()} disabled={whatIfLoading}>
                  {whatIfLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  חשב תרחיש
                </button>
              </div>
            </div>
            {whatIf ? (
              <div className="mt-4 rounded-2xl bg-white/5 p-4 text-sm text-slate-200">
                <p>{whatIf.scenario}</p>
                <p className="mt-2">
                  בסיס: {whatIf.baseline_turnout}% → תרחיש: {whatIf.scenario_turnout}% (שינוי {whatIf.net_impact}%)
                </p>
              </div>
            ) : null}
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="glass-panel rounded-3xl p-5">
              <h2 className="mb-3 text-lg font-semibold text-white">מטריצת סיכון</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-500">
                      <th className="py-2 text-start">שכונה</th>
                      <th className="py-2">הצבעה</th>
                      <th className="py-2">סיכון</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riskRows.map((row) => (
                      <tr key={row.name} className="border-t border-white/5">
                        <td className="py-2 text-slate-200">{row.name}</td>
                        <td className="py-2 text-center" style={{ color: turnoutColor(row.predicted_turnout) }}>
                          {row.predicted_turnout}%
                        </td>
                        <td className="py-2 text-center">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs ${
                              row.risk_level === "HIGH"
                                ? "bg-red-500/20 text-red-200"
                                : row.risk_level === "MEDIUM"
                                  ? "bg-yellow-500/20 text-yellow-200"
                                  : "bg-green-500/20 text-green-200"
                            }`}
                          >
                            {row.risk_level === "HIGH" ? "גבוה" : row.risk_level === "MEDIUM" ? "בינוני" : "נמוך"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="glass-panel rounded-3xl p-5">
              <h2 className="mb-3 text-lg font-semibold text-white">מניעי OSINT</h2>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>
                  מניע מוביל: {String(prediction?.osint_correlation?.top_turnout_driver ?? "—")} (
                  {Number(prediction?.osint_correlation?.community_activity_correlation ?? 0).toFixed(2)})
                </li>
                <li>
                  סיכון מוביל: {String(prediction?.osint_correlation?.top_risk_factor ?? "—")} (מתאם שלילי{" "}
                  {Number(prediction?.osint_correlation?.positive_sentiment_correlation ?? 0).toFixed(2)})
                </li>
              </ul>
              <ul className="mt-4 space-y-2 text-xs text-slate-400">
                {(prediction?.recommendations ?? []).map((r) => (
                  <li key={r.action}>
                    • {r.target} — {r.expected_impact}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
