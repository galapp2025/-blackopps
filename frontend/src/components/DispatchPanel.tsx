"use client";

import { Loader2, Send } from "lucide-react";
import { useEffect, useState } from "react";

import { AnimatedCounter } from "@/components/AnimatedCounter";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { ApiError, api } from "@/lib/api";
import type { DispatchStats, GOTVPrediction, Voter } from "@/lib/types";

type DispatchPanelProps = {
  prefill?: GOTVPrediction | null;
  onToast: (message: string, tone?: "ok" | "err" | "warning" | "info") => void;
};

const CHANNELS = [
  { value: "Phone", label: "טלפון" },
  { value: "WhatsApp", label: "וואטסאפ" },
  { value: "SMS", label: "SMS" },
  { value: "Door", label: "דלת" },
];

const TEMPLATES = [
  { value: "civic_duty", label: "חובה אזרחית" },
  { value: "community_pride", label: "גאוות קהילה" },
  { value: "fear_of_loss", label: "חשש מהפסד" },
  { value: "personal_benefit", label: "תועלת אישית" },
];

export function DispatchPanel({ prefill, onToast }: DispatchPanelProps) {
  const [stats, setStats] = useState<DispatchStats | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [voters, setVoters] = useState<Voter[]>([]);
  const [search, setSearch] = useState("");
  const [voterId, setVoterId] = useState("");
  const [voterName, setVoterName] = useState("");
  const [channel, setChannel] = useState("WhatsApp");
  const [priority, setPriority] = useState(50);
  const [template, setTemplate] = useState("civic_duty");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (prefill) {
      setVoterName(prefill.name);
      setChannel(prefill.optimal_channel || "WhatsApp");
      setPriority(Math.round(prefill.priority_score) || 50);
    }
  }, [prefill]);

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;

    const load = async () => {
      if (document.visibilityState === "hidden") return;
      try {
        const data = await api.getDispatchStats();
        if (!cancelled) {
          setStats(data);
          setUpdatedAt(new Date());
        }
      } catch {
        /* keep last */
      }
    };

    const onVis = () => {
      if (document.visibilityState === "visible") void load();
    };

    void load();
    timer = window.setInterval(() => void load(), 15000);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      if (timer) window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const t = window.setTimeout(() => {
      void api
        .getVoters({ limit: 50, search: search || undefined })
        .then((r) => {
          if (!cancelled) setVoters(r.voters);
        })
        .catch(() => {
          if (!cancelled) setVoters([]);
        });
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [search]);

  const submit = async () => {
    if (!voterName.trim()) {
      setError("הזן שם בוחר לפני שיגור");
      onToast("הזן שם בוחר לפני שיגור", "err");
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const task = await api.dispatch({
        voter_id: voterId || undefined,
        voter_name: voterName || undefined,
        channel,
        priority,
        message_template: template || "civic_duty",
      });
      onToast(`משימה #${task.task_id || task.messageId || "חדשה"} נוצרה בהצלחה`, "ok");
      const data = await api.getDispatchStats();
      setStats(data);
      setUpdatedAt(new Date());
    } catch (err) {
      const msg = err instanceof ApiError || err instanceof Error ? err.message : "שליחה נכשלה";
      setError(msg);
      onToast(msg, "err");
    } finally {
      setSubmitting(false);
    }
  };

  const cards = [
    { label: "ממתינים", value: stats?.queued ?? 0, tone: "text-amber-300" },
    { label: "בפעולה", value: stats?.in_progress ?? 0, tone: "text-cyan-300" },
    { label: "הושלמו", value: stats?.completed ?? 0, tone: "text-emerald-300" },
    { label: "נכשלו", value: stats?.failed ?? 0, tone: "text-red-300" },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-2">
          <h2 className="text-lg font-bold text-white">סטטוס תור</h2>
          {updatedAt ? (
            <p className="text-[11px] text-slate-500">עודכן {updatedAt.toLocaleTimeString("he-IL")}</p>
          ) : null}
        </div>
        <div className="card-stagger grid grid-cols-2 gap-3">
          {cards.map((c) => (
            <div key={c.label} className="glass-panel rounded-2xl p-4">
              <p className="stat-caption text-slate-500">{c.label}</p>
              <AnimatedCounter value={c.value} className={`mt-1 font-mono text-3xl font-extrabold tabular-nums ${c.tone}`} duration={700} />
            </div>
          ))}
        </div>
        {!stats || (stats.queued === 0 && stats.in_progress === 0) ? (
          <EmptyState
            icon={<Send className="mx-auto h-8 w-8" />}
            title="אין משימות פעילות"
            description="צור שיגור ראשון לבוחר — טלפון, וואטסאפ, SMS או דלת"
          />
        ) : null}
      </section>

      <section className="glass-panel rounded-3xl p-5 sm:p-6" aria-label="טופס שיגור">
        <h2 className="mb-4 text-lg font-bold text-white">משימה חדשה</h2>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-slate-400">חיפוש בוחר</label>
            <input className="input w-full" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="שם / עיר…" />
            {voters.length > 0 ? (
              <select
                className="input mt-2 w-full"
                value={voterId}
                onChange={(e) => {
                  const id = e.target.value;
                  setVoterId(id);
                  const v = voters.find((x) => String(x.id) === id);
                  if (v) setVoterName(`${v.first_name} ${v.last_name}`.trim());
                }}
              >
                <option value="">בחר מהרשימה…</option>
                {voters.map((v) => (
                  <option key={String(v.id)} value={String(v.id)}>
                    {v.first_name} {v.last_name}
                    {v.city ? ` · ${v.city}` : ""}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">שם בוחר</label>
            <input className="input w-full" value={voterName} onChange={(e) => setVoterName(e.target.value)} placeholder="ישראל ישראלי" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">ערוץ</label>
            <select className="input w-full" value={channel} onChange={(e) => setChannel(e.target.value)}>
              {CHANNELS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 flex justify-between text-xs text-slate-400">
              <span>עדיפות</span>
              <span className="font-mono tabular-nums text-slate-200">{priority}</span>
            </label>
            <input
              type="range"
              min={1}
              max={100}
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
              className="w-full accent-red-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">תבנית מסר</label>
            <select className="input w-full" value={template} onChange={(e) => setTemplate(e.target.value)}>
              {TEMPLATES.map((t) => (
                <option key={t.value || "none"} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          {error ? <ErrorState message={error} onRetry={() => void submit()} /> : null}
        <button
          type="button"
          className="btn-primary mt-4 w-full"
          onClick={() => void submit()}
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {submitting ? "טוען…" : "שלח למשימה"}
        </button>
        </div>
      </section>
    </div>
  );
}
