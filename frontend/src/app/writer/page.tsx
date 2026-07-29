"use client";

import Link from "next/link";
import { ArrowRight, Columns2, Copy, Download, Loader2, PenLine, Sparkles } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { ErrorState } from "@/components/ErrorState";
import { PsychProfileCard } from "@/components/ui/PsychProfileCard";
import { VoterSelector } from "@/components/whatsapp/VoterSelector";
import { useToast } from "@/components/Toast";
import { api, ApiError } from "@/lib/api";
import type { WriterFormatKey, WriterGenerateResult } from "@/lib/types/features78";
import type { Voter } from "@/lib/types";

const TOPICS = ["חינוך", "בטחון", "קהילה", "דיור", "בריאות", "תשתיות"];

const FORMAT_TABS: { id: WriterFormatKey; label: string }[] = [
  { id: "private_message", label: "פרטי" },
  { id: "general_message", label: "כללי" },
  { id: "social_post_fb", label: "פייסבוק" },
  { id: "social_post_x", label: "X" },
];

function EngagementScoreBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = pct >= 80 ? "text-green-300" : pct >= 65 ? "text-yellow-300" : "text-orange-300";
  const bar = pct >= 80 ? "bg-green-400" : pct >= 65 ? "bg-yellow-400" : "bg-orange-400";
  return (
    <div className="flex items-center gap-3" dir="rtl">
      <div className="h-2 w-28 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-sm font-semibold ${color}`}>{pct}</span>
    </div>
  );
}

export default function WriterPage() {
  const { push } = useToast();
  const [selectedVoter, setSelectedVoter] = useState<Voter | null>(null);
  const [topic, setTopic] = useState("חינוך");
  const [bundle, setBundle] = useState<WriterGenerateResult | null>(null);
  const [active, setActive] = useState<WriterFormatKey>("private_message");
  const [compareMode, setCompareMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [campaignId, setCampaignId] = useState<string | null>(null);

  const activePayload = useMemo(() => bundle?.formats?.[active] ?? null, [bundle, active]);

  const loadForVoter = useCallback(
    async (voter: Voter) => {
      setSelectedVoter(voter);
      setLoading(true);
      setError(null);
      setCompareMode(false);
      try {
        const data = await api.writerGenerate(String(voter.id), { campaign_topic: topic });
        setBundle(data);
        setActive(data.best_format || "private_message");
        setCampaignId(data.campaign_id || null);
        push({ type: "success", message: "ארבעה פורמטים נוצרו" });
      } catch (err) {
        setBundle(null);
        setError(err instanceof ApiError ? err.message : "יצירת תוכן נכשלה");
      } finally {
        setLoading(false);
      }
    },
    [push, topic],
  );

  const regenerate = async () => {
    if (!selectedVoter) {
      push({ type: "warning", message: "בחר מצביע תחילה" });
      return;
    }
    await loadForVoter(selectedVoter);
  };

  const runCompare = async () => {
    if (!selectedVoter) return;
    setLoading(true);
    try {
      const data = await api.writerCompare(String(selectedVoter.id), topic);
      setCompareMode(true);
      setBundle((prev) =>
        prev
          ? {
              ...prev,
              formats: Object.fromEntries(
                Object.entries(data.formats).map(([k, v]) => [
                  k,
                  {
                    format: v.format || FORMAT_TABS.find((t) => t.id === k)?.label || k,
                    text: v.text,
                    character_count: v.text.length,
                    tone: "",
                    target_emotion: "",
                    persuasion_lever_used: prev.psychological_profile.primary_lever,
                    engagement_score: v.engagement_score,
                  },
                ]),
              ) as WriterGenerateResult["formats"],
            }
          : prev,
      );
      push({ type: "success", message: data.recommendation_he || data.recommendation });
    } catch (err) {
      push({ type: "error", message: err instanceof ApiError ? err.message : "השוואה נכשלה" });
    } finally {
      setLoading(false);
    }
  };

  const exportCampaign = async () => {
    if (!selectedVoter) {
      push({ type: "warning", message: "בחר מצביע תחילה" });
      return;
    }
    try {
      const batch = await api.writerBatchGenerate({
        voter_ids: [String(selectedVoter.id)],
        campaign_topic: topic,
        max_count: 1,
      });
      const blob = await api.writerExportJson(batch.export_json_url || batch.campaign_id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `campaign-${batch.campaign_id}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setCampaignId(batch.campaign_id);
      push({ type: "success", message: "קובץ JSON הורד" });
    } catch (err) {
      push({ type: "error", message: err instanceof ApiError ? err.message : "ייצוא נכשל" });
    }
  };

  const copyText = async () => {
    if (!activePayload?.text) return;
    await navigator.clipboard.writeText(activePayload.text);
    push({ type: "success", message: "הועתק ללוח" });
  };

  return (
    <AppShell active="writer" title="כותב רב-פורמט" subtitle="הודעות מותאמות לפרופיל פסיכולוגי">
      <div dir="rtl" className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-300">
            <PenLine className="h-5 w-5 text-cyan-300" />
            <span className="text-sm">יצירת תוכן קמפיין ב־4 פורמטים</span>
          </div>
          <Link href="/war-room" className="btn-secondary">
            <ArrowRight className="h-4 w-4" />
            חזרה לחמ״ל
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[300px_1fr_340px]">
          <div className="space-y-4">
            <VoterSelector onSelect={(v) => void loadForVoter(v)} />
            <label className="block text-xs text-slate-400" htmlFor="campaign-topic">
              נושא קמפיין
            </label>
            <select
              id="campaign-topic"
              className="input w-full"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            >
              {TOPICS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <button type="button" className="btn-primary w-full" disabled={loading || !selectedVoter} onClick={() => void regenerate()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              צור הודעות
            </button>
          </div>

          <section className="glass-panel rounded-3xl p-5 sm:p-6">
            {error ? <ErrorState message={error} onRetry={() => selectedVoter && void loadForVoter(selectedVoter)} /> : null}

            {!bundle && !loading && !error ? (
              <p className="text-sm text-slate-400">בחר מצביע כדי לייצר הודעה פרטית, כללית, פייסבוק ו־X.</p>
            ) : null}

            {loading ? (
              <div className="flex items-center gap-2 text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin" />
                מייצר תוכן מותאם…
              </div>
            ) : null}

            {bundle ? (
              <>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-white">{bundle.full_name}</h2>
                    <p className="text-xs text-slate-400">
                      {bundle.neighborhood} · {bundle.gotv_category} · {bundle.campaign_topic}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="btn-secondary text-xs" onClick={() => void runCompare()}>
                      <Columns2 className="h-3.5 w-3.5" />
                      השווה
                    </button>
                    <button type="button" className="btn-secondary text-xs" onClick={() => void exportCampaign()}>
                      <Download className="h-3.5 w-3.5" />
                      ייצוא JSON
                    </button>
                    <button type="button" className="btn-secondary text-xs" onClick={() => void copyText()}>
                      <Copy className="h-3.5 w-3.5" />
                      העתק
                    </button>
                  </div>
                </div>

                <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="פורמטים">
                  {FORMAT_TABS.map((tab) => {
                    const score = bundle.formats[tab.id]?.engagement_score;
                    const isBest = bundle.best_format === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={active === tab.id}
                        className={`rounded-xl px-3 py-2 text-sm transition ${
                          active === tab.id
                            ? "bg-cyan-500/20 text-cyan-100 ring-1 ring-cyan-400/40"
                            : "bg-white/5 text-slate-300 hover:bg-white/10"
                        }`}
                        onClick={() => {
                          setActive(tab.id);
                          setCompareMode(false);
                        }}
                      >
                        {tab.label}
                        {isBest ? <span className="mr-1 text-[10px] text-green-300"> · מומלץ</span> : null}
                        {score != null ? <span className="mr-1 text-[10px] text-slate-500">({Math.round(score * 100)})</span> : null}
                      </button>
                    );
                  })}
                </div>

                {compareMode ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {FORMAT_TABS.map((tab) => {
                      const item = bundle.formats[tab.id];
                      if (!item) return null;
                      return (
                        <div key={tab.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                          <div className="mb-2 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-white">{tab.label}</h3>
                            <EngagementScoreBadge score={item.engagement_score} />
                          </div>
                          <pre className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{item.text}</pre>
                        </div>
                      );
                    })}
                  </div>
                ) : activePayload ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="text-xs text-slate-400">
                        {activePayload.format} · {activePayload.character_count} תווים · {activePayload.tone}
                      </div>
                      <EngagementScoreBadge score={activePayload.engagement_score} />
                    </div>
                    <pre className="min-h-[220px] whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/25 p-4 text-sm leading-relaxed text-slate-100">
                      {activePayload.text}
                    </pre>
                    <div className="grid gap-2 text-xs text-slate-400 sm:grid-cols-2">
                      <div>
                        <span className="text-slate-500">רגש יעד: </span>
                        {activePayload.target_emotion}
                      </div>
                      <div>
                        <span className="text-slate-500">מנוף שכנוע: </span>
                        {activePayload.persuasion_lever_used}
                      </div>
                    </div>
                  </div>
                ) : null}

                {campaignId ? <p className="mt-3 text-[11px] text-slate-500">מזהה קמפיין: {campaignId}</p> : null}
              </>
            ) : null}
          </section>

          <aside>{selectedVoter ? <PsychProfileCard voterId={String(selectedVoter.id)} /> : <p className="text-sm text-slate-500">הפרופיל הפסיכולוגי יופיע כאן לאחר בחירת מצביע.</p>}</aside>
        </div>
      </div>
    </AppShell>
  );
}
