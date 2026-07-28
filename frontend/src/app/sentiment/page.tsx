"use client";

import { Bell, Loader2, TrendingDown, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { ErrorState } from "@/components/ErrorState";
import { useToast } from "@/components/Toast";
import { api, ApiError } from "@/lib/api";
import type { SentimentDashboard } from "@/lib/features";

const REFRESH_MS = 20_000;

function scoreColor(s: number) {
  if (s >= 0.7) return "bg-emerald-500/50 ring-emerald-400/40";
  if (s >= 0.5) return "bg-yellow-500/45 ring-yellow-400/35";
  return "bg-red-500/45 ring-red-400/40";
}

export default function SentimentPage() {
  const { push: toast } = useToast();
  const [data, setData] = useState<SentimentDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voterId, setVoterId] = useState("");

  const load = useCallback(async () => {
    try {
      const dash = await api.sentimentDashboard();
      setData(dash);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "טעינת סנטימנט נכשלה");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), REFRESH_MS);
    return () => clearInterval(t);
  }, [load]);

  const gaugePct = useMemo(() => (data ? Math.round(data.overall_score * 100) : 0), [data]);

  async function subscribeAlerts() {
    try {
      const res = await api.subscribeSentimentAlert({ threshold: 0.15, scope: "neighborhood" });
      toast({ type: "success", message: `התראות פעילות · ${res.subscription_id.slice(0, 8)}` });
    } catch (e) {
      toast({ type: "error", message: e instanceof ApiError ? e.message : "הרשמה להתראות נכשלה" });
    }
  }

  async function trackSample() {
    if (!voterId.trim()) return;
    try {
      await api.trackSentiment(voterId.trim(), "field_call");
      toast({ type: "success", message: "עודכן ציון סנטימנט" });
      await load();
    } catch (e) {
      toast({ type: "error", message: e instanceof ApiError ? e.message : "עדכון נכשל" });
    }
  }

  if (loading && !data) {
    return (
      <AppShell active="sentiment" title="מוניטור סנטימנט">
        <div className="flex min-h-[40vh] items-center justify-center" dir="rtl">
          <Loader2 className="h-10 w-10 animate-spin text-red-400" />
        </div>
      </AppShell>
    );
  }

  if (error && !data) {
    return (
      <AppShell active="sentiment" title="מוניטור סנטימנט">
        <ErrorState message={error} onRetry={() => void load()} />
      </AppShell>
    );
  }

  if (!data) return null;

  return (
    <AppShell active="sentiment" title="מוניטור סנטימנט בזמן אמת" subtitle="מגמות שכונתיות והתראות ירידה">
      <div dir="rtl" className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 overflow-hidden rounded-xl border border-amber-500/30 bg-amber-950/30 px-3 py-2">
          <Bell className="h-4 w-4 shrink-0 text-amber-400" aria-hidden />
          <div className="flex min-w-0 flex-1 gap-6 overflow-x-auto text-xs text-amber-100">
            {(data.alerts.length ? data.alerts : [{ type: "ללא", neighborhood: "—", severity: "LOW", delta_7d: 0, timestamp: "" }]).map(
              (a, i) => (
                <span key={i}>
                  {a.neighborhood}: {a.type} ({a.severity}) · {a.delta_7d.toFixed(2)}
                </span>
              ),
            )}
          </div>
          <button type="button" className="btn-ghost shrink-0 text-[10px]" onClick={() => void subscribeAlerts()}>
            הרשם להתראות
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 text-center">
            <p className="text-xs text-slate-400">ציון כללי</p>
            <div
              className="mx-auto mt-4 flex h-32 w-32 items-center justify-center rounded-full border-4 border-slate-700"
              style={{
                background: `conic-gradient(#22c55e ${gaugePct}%, #334155 0)`,
              }}
            >
              <span className="rounded-full bg-slate-950 px-4 py-3 text-2xl font-bold tabular-nums">{data.overall_score.toFixed(2)}</span>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              מגמה: {data.trend === "STABLE" ? "יציב" : data.trend === "IMPROVING" ? "משתפר" : "יורד"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
            <h2 className="mb-3 text-xs font-bold text-slate-300">מפת חום שכונות</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {data.neighborhoods.map((n) => (
                <div key={n.name} className={`rounded-xl p-3 ring-1 ${scoreColor(n.score)}`}>
                  <p className="truncate text-xs font-bold">{n.name}</p>
                  <p className="text-lg font-bold tabular-nums">{n.score.toFixed(2)}</p>
                  <p className="flex items-center gap-1 text-[10px] text-slate-200">
                    {n.trend === "IMPROVING" ? <TrendingUp className="h-3 w-3" /> : n.trend === "DEGRADING" ? <TrendingDown className="h-3 w-3" /> : null}
                    {n.trend === "IMPROVING" ? "עלייה" : n.trend === "DEGRADING" ? "ירידה" : "יציב"} · {n.voters_tracked} במעקב
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
            <h2 className="mb-3 text-xs font-bold text-slate-300">התפלגות סנטימנט</h2>
            <ul className="space-y-2 text-xs">
              {Object.entries(data.score_distribution).map(([k, v]) => (
                <li key={k} className="flex items-center gap-2">
                  <span className="w-24 text-slate-400">
                    {k === "PROMOTER"
                      ? "מקדם"
                      : k === "SUPPORTER"
                        ? "תומך"
                        : k === "NEUTRAL"
                          ? "ניטרלי"
                          : k === "DETRACTOR"
                            ? "מתנגד"
                            : "עוין"}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
                    <div className="h-full bg-cyan-500/70" style={{ width: `${v * 100}%` }} />
                  </div>
                  <span className="w-10 tabular-nums">{(v * 100).toFixed(0)}%</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
            <h2 className="mb-3 text-xs font-bold text-slate-300">עדכון סנטימנט משטח</h2>
            <div className="flex gap-2">
              <input
                className="input flex-1"
                placeholder="מזהה בוחר"
                value={voterId}
                onChange={(e) => setVoterId(e.target.value)}
              />
              <button type="button" className="btn-primary shrink-0" onClick={() => void trackSample()}>
                עדכן
              </button>
            </div>
            <p className="mt-2 text-[10px] text-slate-500">מקור: שיחת שטח · ירידה מעל 0.15 מפעילה התראה</p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
