"use client";

import {
  AlertTriangle,
  Loader2,
  Radio,
  RefreshCw,
  Siren,
  Target,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { ErrorState } from "@/components/ErrorState";
import { useToast } from "@/components/Toast";
import { api, ApiError } from "@/lib/api";
import {
  GOTV_COLORS,
  gotvLabel,
  urgencyClass,
  type WarRoomOverview,
} from "@/lib/features";

const REFRESH_MS = 30_000;

function trendDelta(d: number) {
  if (d > 0) return `+${d}`;
  return String(d);
}

export default function WarRoomPage() {
  const { push: toast } = useToast();
  const [data, setData] = useState<WarRoomOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dispatching, setDispatching] = useState(false);
  const [miniNodes, setMiniNodes] = useState<
    { id: string; label: string; score: number; gotv: string }[]
  >([]);

  const load = useCallback(async () => {
    try {
      const overview = await api.getWarRoomOverview();
      setData(overview);
      setError(null);
      const scan = await api.influenceScan({ max_hubs: 20, neighborhoods: ["all"] }).catch(() => null);
      if (scan?.hubs?.length) {
        setMiniNodes(
          scan.hubs.slice(0, 20).map((h) => ({
            id: h.hub_id,
            label: h.full_name,
            score: h.influence_score,
            gotv: h.top_gotv_in_cluster,
          })),
        );
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "טעינת חמ״ל נכשלה");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), REFRESH_MS);
    return () => clearInterval(t);
  }, [load]);

  const dispatchPct = useMemo(() => {
    if (!data) return 0;
    const { pending, in_progress, completed_today } = data.dispatch_queue;
    const total = pending + in_progress + completed_today || 1;
    return Math.round((completed_today / total) * 100);
  }, [data]);

  const gotvSeries = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.gotv_trend).map(([key, v]) => ({
      key,
      label: gotvLabel(key),
      now: v.now,
      past: v["7d_ago"],
      delta: v.delta,
      color: GOTV_COLORS[key] || "#94a3b8",
    }));
  }, [data]);

  const priorities = useMemo(() => {
    if (!data) return [];
    const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2 };
    return [...data.top_priorities].sort(
      (a, b) => (order[a.urgency as keyof typeof order] ?? 9) - (order[b.urgency as keyof typeof order] ?? 9),
    );
  }, [data]);

  async function emergencyDispatch() {
    setDispatching(true);
    try {
      const res = await api.emergencyDispatch({ mode: "TOP_SWING", count: 50 });
      toast({ type: "success", message: `שוגרו ${res.dispatched} משימות לשטח` });
      await load();
    } catch (e) {
      toast({ type: "error", message: e instanceof ApiError ? e.message : "שגיאה בשיגור חירום" });
    } finally {
      setDispatching(false);
    }
  }

  if (loading && !data) {
    return (
      <AppShell active="war-room" title='חמ"ל פיקוד' subtitle="טוען תמונת מצב…">
        <div className="flex min-h-[50vh] items-center justify-center" dir="rtl">
          <Loader2 className="h-10 w-10 animate-spin text-red-400" aria-hidden />
          <span className="sr-only">טוען</span>
        </div>
      </AppShell>
    );
  }

  if (error && !data) {
    return (
      <AppShell active="war-room" title='חמ"ל פיקוד'>
        <ErrorState message={error} onRetry={() => void load()} />
      </AppShell>
    );
  }

  if (!data) return null;

  return (
    <AppShell
      active="war-room"
      title='חמ"ל פיקוד דיגיטלי'
      subtitle={`עודכן ${new Date(data.timestamp).toLocaleString("he-IL")} · רענון אוטומטי כל 30 שניות`}
    >
      <div dir="rtl" className="flex h-[calc(100vh-11rem)] min-h-[720px] flex-col gap-2 overflow-hidden">
        <div className="flex shrink-0 items-center gap-2 overflow-hidden rounded-xl border border-red-500/40 bg-red-950/50 px-3 py-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" aria-hidden />
          <div className="flex min-w-0 flex-1 gap-8 overflow-hidden whitespace-nowrap animate-[marquee_40s_linear_infinite]">
            {(data.alerts.length ? data.alerts : [{ type: "מערכת", detail: "אין התראות פעילות", severity: "LOW", time: "" }]).map(
              (a, i) => (
                <span key={i} className="text-xs text-red-100">
                  {a.detail || a.type} · {a.severity}
                </span>
              ),
            )}
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-[1fr_1fr_auto_auto] gap-2 lg:grid-rows-[1fr_1fr_0.35fr_0.45fr]">
          <section className="panel overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 p-3">
            <h2 className="mb-2 text-xs font-bold text-slate-300">מפת שכונות חיה</h2>
            <div className="grid h-[calc(100%-1.5rem)] grid-cols-3 gap-1 overflow-auto sm:grid-cols-4">
              {data.neighborhood_heatmap.slice(0, 12).map((n) => {
                const tone =
                  n.sentiment === "POSITIVE"
                    ? "bg-emerald-600/40 ring-emerald-500/30"
                    : n.sentiment === "NEGATIVE"
                      ? "bg-red-600/35 ring-red-500/30"
                      : "bg-amber-600/30 ring-amber-500/25";
                return (
                  <div key={n.name} className={`rounded-lg p-2 text-center ring-1 ${tone}`}>
                    <p className="truncate text-[10px] font-semibold">{n.name}</p>
                    <p className="text-[9px] text-slate-300">{n.gotv === "STRONG" ? "חזק" : n.gotv === "WEAK" ? "חלש" : "מעורב"}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="panel overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 p-3">
            <h2 className="mb-2 text-xs font-bold text-slate-300">מגמת GOTV (7 ימים)</h2>
            <div className="flex h-[calc(100%-1.5rem)] flex-col justify-around gap-2">
              {gotvSeries.map((s) => (
                <div key={s.key} className="flex items-center gap-2 text-xs">
                  <span className="w-16 shrink-0 font-medium" style={{ color: s.color }}>
                    {s.label}
                  </span>
                  <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="absolute inset-y-0 right-0 rounded-full opacity-80"
                      style={{ width: `${Math.min(100, (s.now / Math.max(data.totals.voters, 1)) * 100 * 4)}%`, background: s.color }}
                    />
                  </div>
                  <span className="w-10 text-left tabular-nums text-slate-400">{trendDelta(s.delta)}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="panel overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 p-3">
            <h2 className="mb-2 text-xs font-bold text-slate-300">רשת השפעה — 20 מרכזי</h2>
            <div className="relative h-[calc(100%-1.5rem)] overflow-hidden rounded-xl bg-slate-950/80">
              {miniNodes.map((n, i) => {
                const r = 8 + (n.score / 100) * 24;
                const x = 15 + (i % 5) * 18;
                const y = 15 + Math.floor(i / 5) * 22;
                const color = GOTV_COLORS[n.gotv?.toUpperCase()] || "#64748b";
                return (
                  <div
                    key={n.id}
                    className="absolute flex items-center justify-center rounded-full border border-white/20 text-[8px] font-bold text-white"
                    style={{
                      width: r,
                      height: r,
                      right: `${x}%`,
                      top: `${y}%`,
                      background: color,
                    }}
                    title={`${n.label} · ${n.score}`}
                  >
                    {n.score}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="panel overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 p-3">
            <h2 className="mb-2 text-xs font-bold text-slate-300">מפת חום סנטימנט</h2>
            <div className="grid h-[calc(100%-1.5rem)] grid-cols-2 gap-1 overflow-auto">
              {data.neighborhood_heatmap.slice(0, 8).map((n) => {
                const bg =
                  n.sentiment === "POSITIVE" ? "from-emerald-600/50" : n.sentiment === "NEGATIVE" ? "from-red-600/50" : "from-yellow-600/40";
                return (
                  <div key={n.name} className={`rounded-lg bg-gradient-to-l ${bg} to-transparent p-2`}>
                    <p className="truncate text-[10px] font-semibold">{n.name}</p>
                    <p className="text-[9px] text-slate-300">
                      {n.trend === "DEGRADING" ? "ירידה" : n.trend === "IMPROVING" ? "עלייה" : "יציב"}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="col-span-2 rounded-2xl border border-white/10 bg-slate-900/60 p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xs font-bold text-slate-300">התקדמות שיגור</h2>
              <div className="flex flex-wrap gap-2 text-[10px] text-slate-400">
                <span>בתור: {data.dispatch_queue.pending}</span>
                <span>בביצוע: {data.dispatch_queue.in_progress}</span>
                <span>הושלמו היום: {data.dispatch_queue.completed_today}</span>
                <span>באיחור: {data.dispatch_queue.overdue}</span>
              </div>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-800">
              <div className="h-full rounded-full bg-gradient-to-l from-red-500 to-emerald-500" style={{ width: `${dispatchPct}%` }} />
            </div>
            <p className="mt-1 text-[10px] text-slate-500">{dispatchPct}% מהיעד היומי</p>
          </section>

          <section className="col-span-2 flex min-h-0 flex-col gap-2 rounded-2xl border border-white/10 bg-slate-900/60 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <Target className="h-3.5 w-3.5" aria-hidden />
                עדיפויות עליונות
              </h2>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={dispatching}
                  onClick={() => void emergencyDispatch()}
                  className="inline-flex items-center gap-1 rounded-xl bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-500 disabled:opacity-50"
                >
                  {dispatching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Siren className="h-3.5 w-3.5" />}
                  שיגור חירום (50 מתנדנדים)
                </button>
                <button type="button" onClick={() => void load()} className="btn-ghost text-xs">
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                  רענון
                </button>
                <Link href="/" className="btn-ghost text-xs">
                  <Radio className="h-3.5 w-3.5" aria-hidden />
                  מסך פיקוד מלא
                </Link>
              </div>
            </div>
            <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-auto sm:grid-cols-3">
              {priorities.map((p, i) => (
                <article key={i} className={`rounded-xl border p-3 ${urgencyClass(p.urgency)}`}>
                  <p className="text-[10px] font-bold text-slate-400">{p.type === "CONTACT" ? "יצירת קשר" : p.type === "RETAIN" ? "שימור" : "הנעה"}</p>
                  <p className="mt-1 text-sm font-semibold text-white">{p.target}</p>
                  <p className="mt-2 text-[10px] text-slate-400">
                    מועד: {p.deadline === "today" ? "היום" : p.deadline === "48h" ? "48 שעות" : "שבוע"} · דחיפות:{" "}
                    {p.urgency === "CRITICAL" ? "קריטי" : p.urgency === "HIGH" ? "גבוה" : "בינוני"}
                  </p>
                </article>
              ))}
            </div>
            <p className="text-[10px] text-slate-500">
              סוכנים בשטח: {data.field_agents.active}/{data.field_agents.total} · ממוצע אנשי קשר לשעה:{" "}
              {data.field_agents.avg_contacts_per_hour} · סה״כ בוחרים: {data.totals.voters.toLocaleString("he-IL")}
            </p>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
