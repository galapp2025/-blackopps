"use client";

import Link from "next/link";
import { ArrowRight, Loader2, Radar } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { StrategicResponsePanel } from "@/components/ui/StrategicResponsePanel";
import { TrendCard } from "@/components/ui/TrendCard";
import { useToast } from "@/components/Toast";
import { api, ApiError } from "@/lib/api";

type CandidateLite = { id: string; candidate_name: string; party: string };

export default function TrendsPage() {
  const { push } = useToast();
  const [candidates, setCandidates] = useState<CandidateLite[]>([]);
  const [candidateId, setCandidateId] = useState("");
  const [dashboard, setDashboard] = useState<Awaited<ReturnType<typeof api.trendsDashboard>> | null>(null);
  const [scanning, setScanning] = useState(false);
  const [responding, setResponding] = useState(false);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [recommendation, setRecommendation] = useState<any>(null);
  const [activeTrendTitle, setActiveTrendTitle] = useState("");
  const [newIds, setNewIds] = useState<string[]>([]);
  const [keywords, setKeywords] = useState("פתח תקווה, בחירות, מועמד");

  const loadCandidates = useCallback(async () => {
    try {
      const data = await api.listDossiers("active");
      setCandidates(data.candidates as CandidateLite[]);
      if (data.candidates[0] && !candidateId) {
        setCandidateId(data.candidates[0].id);
      }
    } catch (err) {
      push({ type: "error", message: err instanceof ApiError ? err.message : "טעינת מועמדים נכשלה" });
    }
  }, [candidateId, push]);

  const loadDashboard = useCallback(async (id: string) => {
    if (!id) return;
    try {
      const data = await api.trendsDashboard(id, 24);
      setDashboard(data);
    } catch (err) {
      push({ type: "error", message: err instanceof ApiError ? err.message : "טעינת לוח טרנדים נכשלה" });
    }
  }, [push]);

  useEffect(() => {
    void loadCandidates();
  }, [loadCandidates]);

  useEffect(() => {
    if (candidateId) void loadDashboard(candidateId);
  }, [candidateId, loadDashboard]);

  const overview = dashboard?.overview;
  const chartData = useMemo(() => overview?.sentiment_timeline || [], [overview]);

  const scan = async () => {
    if (!candidateId) {
      push({ type: "warning", message: "בחר מועמד או העלה תיק קודם" });
      return;
    }
    setScanning(true);
    try {
      const result = await api.trendsScan({
        candidate_id: candidateId,
        keywords: keywords.split(/[,،]/).map((s) => s.trim()).filter(Boolean),
        max_results: 20,
        time_range_hours: 24,
      });
      setNewIds(result.trends.map((t) => t.id));
      push({ type: "success", message: `זוהו ${result.trends_detected} טרנדים` });
      await loadDashboard(candidateId);
    } catch (err) {
      push({ type: "error", message: err instanceof ApiError ? err.message : "סריקה נכשלה" });
    } finally {
      setScanning(false);
    }
  };

  const respond = async (trendId: string) => {
    if (!candidateId) return;
    setResponding(true);
    setResponses({});
    try {
      const result = await api.trendsRespond({
        trend_event_id: trendId,
        candidate_id: candidateId,
        strategy_preference: "all",
        generate_gotv_variants: true,
      });
      setResponses(result.responses);
      setRecommendation(result.recommendation);
      setActiveTrendTitle(result.trend_title);
      push({ type: "success", message: "תגובות אסטרטגיות מוכנות" });
    } catch (err) {
      push({ type: "error", message: err instanceof ApiError ? err.message : "יצירת תגובה נכשלה" });
    } finally {
      setResponding(false);
    }
  };

  return (
    <div dir="rtl" className="situation-room min-h-screen px-4 py-6 sm:px-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs text-red-300/80">מודיעין טרנדים ותגובה אסטרטגית</p>
          <h1 className="command-text text-2xl font-bold text-white sm:text-3xl">חמ״ל טרנדים</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/dossier" className="btn-secondary">
            תיק מועמד
          </Link>
          <Link href="/" className="btn-secondary">
            <ArrowRight className="h-4 w-4" />
            חזרה לפיקוד
          </Link>
        </div>
      </header>

      <section className="glass-panel mb-6 rounded-3xl p-5">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs text-slate-400" htmlFor="cand">
              מועמד
            </label>
            <select
              id="cand"
              className="input w-full"
              value={candidateId}
              onChange={(e) => setCandidateId(e.target.value)}
            >
              <option value="">בחר מועמד…</option>
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.candidate_name} · {c.party}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400" htmlFor="kw">
              מילות מפתח
            </label>
            <input id="kw" className="input w-full" value={keywords} onChange={(e) => setKeywords(e.target.value)} />
          </div>
          <div className="flex items-end">
            <button type="button" className="btn-primary w-full" disabled={scanning} onClick={() => void scan()}>
              {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radar className="h-4 w-4" />}
              {scanning ? "סורק…" : "סרוק עכשיו"}
            </button>
          </div>
        </div>
      </section>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <div className="glass-panel rounded-2xl p-4 text-center">
          <p className="text-xs text-slate-500">סה״כ טרנדים</p>
          <p className="text-2xl font-bold text-white">{overview?.total_trends ?? 0}</p>
        </div>
        <div className="glass-panel rounded-2xl p-4 text-center">
          <p className="text-xs text-slate-500">איומים</p>
          <p className="text-2xl font-bold text-red-300">{overview?.threats ?? 0}</p>
        </div>
        <div className="glass-panel rounded-2xl p-4 text-center">
          <p className="text-xs text-slate-500">הזדמנויות</p>
          <p className="text-2xl font-bold text-green-300">{overview?.opportunities ?? 0}</p>
        </div>
        <div className="glass-panel rounded-2xl p-4 text-center">
          <p className="text-xs text-slate-500">שינוי סנטימנט 24ש׳</p>
          <p className={`text-2xl font-bold ${(overview?.sentiment_delta_24h ?? 0) >= 0 ? "text-green-300" : "text-red-300"}`}>
            {overview?.sentiment_delta_24h ?? 0}
          </p>
        </div>
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <section className="glass-panel rounded-3xl p-5">
          <h2 className="mb-4 text-lg font-semibold text-white">ציר סנטימנט</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="hour" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis domain={[0, 1]} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155" }} />
                <Line type="monotone" dataKey="sentiment" stroke="#22d3ee" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <StrategicResponsePanel
          trendTitle={activeTrendTitle}
          responses={responses}
          recommendation={recommendation}
          loading={responding}
        />
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">טרנדים פעילים</h2>
        {(dashboard?.trends || []).length === 0 ? (
          <div className="glass-panel rounded-3xl p-8 text-center text-slate-500">אין טרנדים — לחץ על סרוק עכשיו</div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {(dashboard?.trends || []).map((t) => (
              <TrendCard
                key={t.id}
                trend={t}
                highlight={newIds.includes(t.id)}
                onRespond={(id) => void respond(id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
