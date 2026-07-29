"use client";

import Link from "next/link";
import { ArrowRight, Calendar, Download, Loader2, MessageCircle, Send, Sparkles } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { MessageBubble } from "@/components/whatsapp/MessageBubble";
import { PersonalizationBadge } from "@/components/whatsapp/PersonalizationBadge";
import { VoterSelector } from "@/components/whatsapp/VoterSelector";
import { useToast } from "@/components/Toast";
import { api, ApiError } from "@/lib/api";
import type { WhatsAppGenerateResult } from "@/lib/types/features56";
import type { Voter } from "@/lib/types";

type VariantKey = "variant_a" | "variant_b" | "variant_c";

const VARIANT_LABELS: Record<VariantKey, string> = {
  variant_a: "חם ואישי",
  variant_b: "ישיר וממוקד",
  variant_c: "סקרנות וערך",
};

export default function WhatsAppStudioPage() {
  const { push } = useToast();
  const searchParams = useSearchParams();
  const initialVoterId = searchParams.get("voter_id") || undefined;
  const [bundle, setBundle] = useState<WhatsAppGenerateResult | null>(null);
  const [active, setActive] = useState<VariantKey>("variant_a");
  const [edited, setEdited] = useState<Record<VariantKey, string | null>>({
    variant_a: null,
    variant_b: null,
    variant_c: null,
  });
  const [tone, setTone] = useState(35);
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState("חינוך");
  const [selectedVoter, setSelectedVoter] = useState<Voter | null>(null);

  const displayText = useMemo(() => {
    if (!bundle) return "";
    const custom = edited[active];
    if (custom != null) return custom;
    return bundle.message_variants[active].text;
  }, [active, bundle, edited]);

  const loadForVoter = useCallback(
    async (voter: Voter) => {
      setSelectedVoter(voter);
      setLoading(true);
      setEdited({ variant_a: null, variant_b: null, variant_c: null });
      try {
        const data = await api.whatsappGenerate(String(voter.id), { campaign_topic: topic });
        setBundle(data);
        setActive(data.best_variant);
        push({ type: "success", message: "הודעות וואטסאפ נוצרו" });
      } catch (err) {
        push({ type: "error", message: err instanceof ApiError ? err.message : "יצירת הודעה נכשלה" });
      } finally {
        setLoading(false);
      }
    },
    [push],
  );

  const regenerateTone = async () => {
    if (!selectedVoter) {
      push({ type: "warning", message: "בחר מצביע תחילה" });
      return;
    }
    setLoading(true);
    try {
      const data = await api.whatsappGenerate(String(selectedVoter.id), {
        campaign_topic: topic,
        tone_hint: tone > 60 ? "ישיר" : "חם",
      });
      setBundle(data);
      setEdited({ variant_a: null, variant_b: null, variant_c: null });
      if (tone > 60) setActive("variant_b");
      else if (tone < 40) setActive("variant_a");
      push({ type: "success", message: "הודעות עודכנו לפי הטון" });
    } catch (err) {
      push({ type: "error", message: err instanceof ApiError ? err.message : "רענון נכשל" });
    } finally {
      setLoading(false);
    }
  };

  const schedule = async () => {
    if (!bundle) return;
    try {
      await api.whatsappSchedule({
        voter_id: bundle.voter_id,
        message_variant: active,
        send_at: bundle.recommended_send_time,
      });
      push({ type: "success", message: "משלוח מתוזמן נשמר" });
    } catch (err) {
      push({ type: "error", message: err instanceof ApiError ? err.message : "תזמון נכשל" });
    }
  };

  const exportBatch = async () => {
    if (!selectedVoter) {
      push({ type: "warning", message: "בחר מצביע לדוגמה" });
      return;
    }
    try {
      const batch = await api.whatsappBatchGenerate({
        voter_ids: [String(selectedVoter.id)],
        campaign_topic: topic,
        max_count: 50,
      });
      const blob = await api.whatsappExportCsv(batch.export_csv_url);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "whatsapp-batch.csv";
      a.click();
      URL.revokeObjectURL(url);
      push({ type: "success", message: `יוצאו ${batch.generated} הודעות` });
    } catch (err) {
      push({ type: "error", message: err instanceof ApiError ? err.message : "ייצוא נכשל" });
    }
  };

  const sendTimeLabel = bundle
    ? new Date(bundle.recommended_send_time).toLocaleString("he-IL", {
        weekday: "long",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  return (
    <div dir="rtl" className="situation-room min-h-screen px-4 py-6 sm:px-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs text-red-300/80">סטודיו וואטסאפ מודיעיני</p>
          <h1 className="command-text text-2xl font-bold text-white sm:text-3xl">כותב הודעות וואטסאפ</h1>
        </div>
        <Link href="/" className="btn-secondary">
          <ArrowRight className="h-4 w-4" />
          חזרה לפיקוד
        </Link>
      </header>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr_280px]">
        <VoterSelector initialVoterId={initialVoterId} onSelect={(v) => void loadForVoter(v)} />

        <section className="glass-panel rounded-3xl p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <MessageCircle className="h-5 w-5 text-green-400" />
            <h2 className="text-lg font-semibold text-white">תצוגת בועה</h2>
            {bundle ? <PersonalizationBadge score={bundle.personalization_score} /> : null}
            {loading ? <Loader2 className="h-4 w-4 animate-spin text-slate-400" /> : null}
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {(Object.keys(VARIANT_LABELS) as VariantKey[]).map((key) => (
              <button
                key={key}
                type="button"
                className={`rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition ${
                  active === key ? "bg-green-500/20 text-green-200 ring-green-400/50" : "bg-white/5 text-slate-300 ring-white/10"
                }`}
                onClick={() => setActive(key)}
              >
                {VARIANT_LABELS[key]}
              </button>
            ))}
          </div>

          <div className="mb-6 min-h-[120px] rounded-2xl bg-[#0b141a]/80 p-4">
            {bundle ? <MessageBubble text={displayText} /> : <p className="text-sm text-slate-500">בחר מצביע כדי ליצור הודעה</p>}
          </div>

          <label className="mb-2 block text-xs text-slate-400" htmlFor="edit-msg">
            עריכה חופשית (נשמר מקור AI)
          </label>
          <textarea
            id="edit-msg"
            className="input min-h-[100px] w-full"
            value={displayText}
            onChange={(e) => setEdited((prev) => ({ ...prev, [active]: e.target.value }))}
            disabled={!bundle}
          />

          <div className="mt-5">
            <label className="mb-2 flex justify-between text-xs text-slate-400" htmlFor="tone">
              <span>חם</span>
              <span>ישיר</span>
            </label>
            <input
              id="tone"
              type="range"
              min={0}
              max={100}
              value={tone}
              onChange={(e) => setTone(Number(e.target.value))}
              onMouseUp={() => void regenerateTone()}
              onTouchEnd={() => void regenerateTone()}
              className="w-full accent-green-500"
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <button type="button" className="btn-primary" disabled={!bundle || loading} onClick={() => void schedule()}>
              <Calendar className="h-4 w-4" />
              תזמן משלוח
            </button>
            <button type="button" className="btn-secondary" disabled={!bundle} onClick={() => void exportBatch()}>
              <Download className="h-4 w-4" />
              ייצוא CSV
            </button>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="glass-panel rounded-2xl p-4">
            <p className="mb-2 text-xs text-slate-400">⏰ מומלץ לשליחה</p>
            <p className="text-sm font-semibold text-white">{sendTimeLabel}</p>
            {bundle ? (
              <p className="mt-2 text-xs text-slate-500">
                שיעור תגובה משוער: {Math.round(bundle.predicted_response_rate * 100)}%
              </p>
            ) : null}
          </div>

          <div className="glass-panel rounded-2xl p-4">
            <label className="mb-2 block text-xs text-slate-400" htmlFor="topic">
              נושא קמפיין
            </label>
            <select id="topic" className="input w-full" value={topic} onChange={(e) => setTopic(e.target.value)}>
              <option value="חינוך">חינוך</option>
              <option value="בטחון">בטחון</option>
              <option value="ספורט">ספורט</option>
              <option value="קהילה">קהילה</option>
            </select>
          </div>

          <div className="glass-panel rounded-2xl p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
              <Sparkles className="h-4 w-4 text-amber-400" />
              נקודות שיחה
            </h3>
            <ul className="space-y-1 text-xs text-slate-300">
              {(bundle?.talking_points ?? ["בחר מצביע"]).map((p) => (
                <li key={p}>• {p}</li>
              ))}
            </ul>
          </div>

          <div className="glass-panel rounded-2xl p-4">
            <h3 className="mb-2 text-sm font-semibold text-white">לוח ביצועים (דמו)</h3>
            <dl className="grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <dt className="text-slate-500">נשלחו</dt>
                <dd className="text-lg font-bold text-white">1,240</dd>
              </div>
              <div>
                <dt className="text-slate-500">נפתחו</dt>
                <dd className="text-lg font-bold text-green-300">892</dd>
              </div>
              <div>
                <dt className="text-slate-500">הגיבו</dt>
                <dd className="text-lg font-bold text-cyan-300">318</dd>
              </div>
            </dl>
            <p className="mt-3 flex items-center gap-1 text-[11px] text-slate-500">
              <Send className="h-3 w-3" />
              נתוני דמו — יתחברו לתור Dispatch
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
