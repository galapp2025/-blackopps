"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { ErrorState } from "@/components/ErrorState";
import { useToast } from "@/components/Toast";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { api, ApiError, type DeepVoterIntelResult } from "@/lib/api";

type TabId = "intel" | "psych" | "messages" | "sentiment" | "actions";

const TABS: { id: TabId; label: string }[] = [
  { id: "intel", label: "מודיעין" },
  { id: "psych", label: "פרופיל" },
  { id: "messages", label: "מסרים" },
  { id: "sentiment", label: "סנטימנט" },
  { id: "actions", label: "פעולות" },
];

const GOTV_COLORS: Record<string, string> = {
  SAFE: "bg-green-500/15 text-green-300 border-green-500/30",
  LEANING: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  SWING: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  AT_RISK: "bg-red-500/15 text-red-300 border-red-500/30",
};

type Props = {
  voterId: string;
  onClose: () => void;
};

export function VoterDetailPanel({ voterId, onClose }: Props) {
  const { push: toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabId>("intel");
  const [intel, setIntel] = useState<DeepVoterIntelResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadCached = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getDeepVoterProfile(voterId);
      setIntel(data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "טעינת מודיעין נכשלה");
    } finally {
      setLoading(false);
    }
  }, [voterId]);

  useEffect(() => {
    void loadCached();
  }, [loadCached]);

  async function refreshIntel() {
    setRefreshing(true);
    setError(null);
    try {
      const data = await api.deepVoterProfile(voterId);
      setIntel(data);
      toast({ type: "success", message: "פרופיל מודיעין עודכן" });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "יצירת מודיעין נכשלה");
      toast({ type: "error", message: "יצירת מודיעין נכשלה" });
    } finally {
      setRefreshing(false);
    }
  }

  function addToCampaign() {
    try {
      const key = "blackopps-campaign-voters";
      const raw = localStorage.getItem(key);
      const list: string[] = raw ? (JSON.parse(raw) as string[]) : [];
      if (!list.includes(voterId)) list.push(voterId);
      localStorage.setItem(key, JSON.stringify(list));
      toast({ type: "success", message: `נוסף לקמפיין (${list.length} בוחרים)` });
    } catch {
      toast({ type: "error", message: "שמירה לקמפיין נכשלה" });
    }
  }

  const score =
    intel?.intel?.intelligence_assessment?.confidence_score ??
    intel?.intelligence_score ??
    0;
  const gotv = (intel?.gotv_category || "SWING").toUpperCase();

  return (
    <div
      className="fixed left-0 top-0 z-50 flex h-full w-full max-w-[520px] flex-col overflow-y-auto border-l border-white/[0.06] bg-[var(--bg-secondary)] p-6 shadow-2xl"
      role="dialog"
      aria-label="כרטיס מודיעין בוחר"
    >
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {intel?.full_name || (loading ? "טוען…" : "בוחר")}
          </h2>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-sm text-[var(--text-secondary)]">
              {intel?.neighborhood || "—"}
            </span>
            <span
              className={`rounded-lg border px-2.5 py-1 text-sm font-medium ${GOTV_COLORS[gotv] || GOTV_COLORS.SWING}`}
            >
              {gotv}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-11 w-11 items-center justify-center rounded-xl text-[var(--text-muted)] hover:bg-white/10 hover:text-white"
          aria-label="סגור"
        >
          ✕
        </button>
      </div>

      <div className="mb-6 rounded-2xl border border-white/[0.06] bg-[var(--bg-card)] p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm text-[var(--text-muted)]">ציון מודיעין</span>
          <span className="text-xl font-bold text-[var(--brand-gold)]">{Math.round(score)}/100</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-red-500 via-amber-500 to-green-500"
            style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
          />
        </div>
      </div>

      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-white/[0.06]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`shrink-0 px-4 py-3 text-sm transition-colors ${
              activeTab === tab.id
                ? "border-b-2 border-[var(--brand-gold)] text-white"
                : "border-b-2 border-transparent text-[var(--text-muted)] hover:text-white"
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error ? <ErrorState message={error} onRetry={() => void loadCached()} /> : null}

      {activeTab === "intel" && (
        <IntelTab
          intel={intel}
          loading={loading}
          refreshing={refreshing}
          onRefresh={() => void refreshIntel()}
        />
      )}
      {activeTab === "psych" && <PsychTab voterId={voterId} />}
      {activeTab === "messages" && <MessagesTab voterId={voterId} />}
      {activeTab === "sentiment" && <SentimentTab voterId={voterId} />}
      {activeTab === "actions" && (
        <div className="space-y-3">
          <Button variant="primary" size="lg" className="w-full" onClick={() => void refreshIntel()} loading={refreshing}>
            צור / רענן פרופיל מודיעין
          </Button>
          <Link href={`/writer?voter_id=${encodeURIComponent(voterId)}`} className="block">
            <Button variant="gold" size="lg" className="w-full">
              צור מסר בכותב
            </Button>
          </Link>
          <Link href={`/whatsapp?voter_id=${encodeURIComponent(voterId)}`} className="block">
            <Button variant="outline" size="lg" className="w-full">
              שלח לוואטסאפ
            </Button>
          </Link>
          <Link href={`/messages?voter_id=${encodeURIComponent(voterId)}`} className="block">
            <Button variant="ghost" size="lg" className="w-full">
              מסרים רב-ערוציים
            </Button>
          </Link>
          <Button variant="outline" size="lg" className="w-full" onClick={addToCampaign}>
            הוסף לקמפיין
          </Button>
        </div>
      )}
    </div>
  );
}

function IntelTab({
  intel,
  loading,
  refreshing,
  onRefresh,
}: {
  intel: DeepVoterIntelResult | null;
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  if (loading && !intel) return <LoadingSkeleton lines={8} />;
  if (!intel) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-[var(--text-secondary)]">אין פרופיל מודיעין עדיין</p>
        <Button variant="gold" size="lg" onClick={onRefresh} loading={refreshing}>
          צור פרופיל מודיעין
        </Button>
      </div>
    );
  }

  const i = intel.intel;
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={onRefresh} loading={refreshing}>
          רענן מודיעין
        </Button>
      </div>

      <Card>
        <h3 className="mb-3 text-lg font-bold">נוכחות ברשת</h3>
        <div className="space-y-2 text-sm">
          <div className="flex flex-wrap gap-2">
            {(i.social_presence?.primary_platforms || []).map((p) => (
              <span key={p} className="rounded-lg bg-white/5 px-2 py-1 text-[var(--text-secondary)]">
                {p}
              </span>
            ))}
          </div>
          <p className="text-[var(--text-secondary)]">{i.social_presence?.activity_level}</p>
          <p className="text-[var(--text-secondary)]">{i.social_presence?.posting_style}</p>
          <p className="text-sm text-[var(--text-muted)]">
            זמן אופטימלי: {i.social_presence?.best_time_to_engage}
          </p>
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 text-lg font-bold">עמדות בנושאים</h3>
        <div className="space-y-3">
          {Object.entries(i.topic_stances || {}).map(([topic, data]) => (
            <div key={topic} className="rounded-lg p-2 hover:bg-white/[0.03]">
              <div className="mb-1 flex items-center gap-3">
                <div className="w-24 text-sm text-[var(--text-secondary)]">{topic}</div>
                <div className="h-1.5 flex-1 rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[var(--brand-blue)]"
                    style={{ width: `${(data.support_level || 5) * 10}%` }}
                  />
                </div>
                <span className="w-8 text-xs text-[var(--text-muted)]">{data.support_level}/10</span>
              </div>
              {data.pain_point ? (
                <div className="pr-24 text-xs text-red-400">⚠ {data.pain_point}</div>
              ) : null}
            </div>
          ))}
        </div>
      </Card>

      <Card accent="swing">
        <h3 className="mb-3 text-lg font-bold">איך לפנות</h3>
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-[var(--text-muted)]">טון: </span>
            <span className="text-[var(--text-secondary)]">{i.communication_profile?.best_tone}</span>
          </div>
          <div>
            <span className="text-[var(--text-muted)]">ערוץ: </span>
            <span className="text-[var(--text-secondary)]">{i.communication_profile?.best_channel}</span>
          </div>
          <div>
            <span className="text-[var(--text-muted)]">פתיחה: </span>
            <span className="text-[var(--text-secondary)]">
              {i.communication_profile?.opening_strategy}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[var(--text-muted)]">מילים לשימוש:</span>
            {(i.communication_profile?.words_to_use || []).map((w) => (
              <span key={w} className="rounded bg-green-500/10 px-1.5 py-0.5 text-xs text-green-300">
                {w}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[var(--text-muted)]">מילים להימנע:</span>
            {(i.communication_profile?.words_to_avoid || []).map((w) => (
              <span key={w} className="rounded bg-red-500/10 px-1.5 py-0.5 text-xs text-red-300">
                {w}
              </span>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 text-lg font-bold">טריגרים</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-lg border border-red-500/10 bg-red-500/5 p-2">
            <div className="mb-0.5 text-xs text-red-400">מכעיס</div>
            <div className="text-[var(--text-secondary)]">{i.triggers?.anger}</div>
          </div>
          <div className="rounded-lg border border-green-500/10 bg-green-500/5 p-2">
            <div className="mb-0.5 text-xs text-green-400">גאה</div>
            <div className="text-[var(--text-secondary)]">{i.triggers?.pride}</div>
          </div>
          <div className="rounded-lg border border-amber-500/10 bg-amber-500/5 p-2">
            <div className="mb-0.5 text-xs text-amber-400">מפחיד</div>
            <div className="text-[var(--text-secondary)]">{i.triggers?.fear}</div>
          </div>
          <div className="rounded-lg border border-blue-500/10 bg-blue-500/5 p-2">
            <div className="mb-0.5 text-xs text-blue-400">תקווה</div>
            <div className="text-[var(--text-secondary)]">{i.triggers?.hope}</div>
          </div>
        </div>
        <div className="mt-3 rounded-lg border border-[var(--brand-gold)]/10 bg-[var(--brand-gold)]/5 p-3">
          <div className="mb-0.5 text-xs text-[var(--brand-gold)]">מה יגרום לו להצביע</div>
          <div className="text-sm text-[var(--text-secondary)]">{i.triggers?.vote_driver}</div>
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 text-lg font-bold">רשת חברתית</h3>
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-[var(--text-muted)]">מושפע מ: </span>
            <span className="text-[var(--text-secondary)]">
              {(i.social_network?.influencers || []).join(", ")}
            </span>
          </div>
          <div>
            <span className="text-[var(--text-muted)]">משפיע על: </span>
            <span className="text-[var(--text-secondary)]">
              {(i.social_network?.influencees || []).join(", ")}
            </span>
          </div>
          <div>
            <span className="text-[var(--text-muted)]">טווח השפעה: </span>
            <span className="font-bold text-[var(--brand-gold)]">
              {i.social_network?.estimated_reach ?? 0} אנשים
            </span>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 text-lg font-bold">פערי מודיעין</h3>
        <p className="mb-2 text-sm text-[var(--text-secondary)]">
          {i.intelligence_assessment?.recommendation}
        </p>
        <ul className="space-y-1">
          {(i.intelligence_assessment?.intelligence_gaps || []).map((gap) => (
            <li key={gap} className="flex items-start gap-2 text-sm text-[var(--text-muted)]">
              <span className="mt-0.5 text-amber-400">⚠</span>
              {gap}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function PsychTab({ voterId }: { voterId: string }) {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      try {
        setData((await api.getPsychoProfile(voterId)) as unknown as Record<string, unknown>);
      } catch {
        setData((await api.psychoProfile(voterId)) as unknown as Record<string, unknown>);
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "טעינת פרופיל נכשלה");
    } finally {
      setLoading(false);
    }
  }, [voterId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <LoadingSkeleton lines={6} />;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!data) return null;

  const profile = (data.profile as Record<string, unknown>) || data;
  const personality = (profile.personality as Record<string, number>) || {};
  const approach = (profile.recommended_approach as Record<string, unknown>) || {};

  return (
    <Card>
      <h3 className="mb-3 text-lg font-bold">פרופיל פסיכולוגי</h3>
      <div className="space-y-2 text-sm text-[var(--text-secondary)]">
        <div>נאמנות: {String(profile.loyalty_score ?? data.loyalty_score ?? "—")}</div>
        <div>תנודתיות: {String(profile.volatility_score ?? "—")}</div>
        <div>סגנון החלטה: {String(profile.decision_style ?? "—")}</div>
        <div>גישה מומלצת: {String(approach.channel || approach.tone || JSON.stringify(approach).slice(0, 120))}</div>
        {Object.keys(personality).length > 0 ? (
          <div className="mt-3 space-y-1">
            <div className="text-[var(--text-muted)]">Big Five</div>
            {Object.entries(personality).map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span>{k}</span>
                <span>{typeof v === "number" ? v.toFixed(2) : String(v)}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      <Button className="mt-4" variant="outline" onClick={() => void load()}>
        רענן פרופיל
      </Button>
    </Card>
  );
}

function MessagesTab({ voterId }: { voterId: string }) {
  const { push: toast } = useToast();
  const [channels, setChannels] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.generateMessage(voterId);
      setChannels(res.channels || {});
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "יצירת מסרים נכשלה");
    } finally {
      setLoading(false);
    }
  }, [voterId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <LoadingSkeleton lines={5} />;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;

  return (
    <div className="space-y-3">
      {Object.entries(channels).map(([ch, text]) => (
        <Card key={ch}>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="font-bold">{ch}</h4>
            <Button
              size="sm"
              variant="ghost"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(text);
                  toast({ type: "success", message: "הועתק" });
                } catch {
                  toast({ type: "error", message: "העתקה נכשלה" });
                }
              }}
            >
              העתק
            </Button>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-secondary)]">{text}</p>
        </Card>
      ))}
      <Button variant="outline" onClick={() => void load()}>
        צור מחדש
      </Button>
    </div>
  );
}

function SentimentTab({ voterId }: { voterId: string }) {
  const [points, setPoints] = useState<Array<{ date?: string; score?: number; sentiment?: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.sentimentTrend(voterId, 30);
      const series =
        (res as { points?: Array<{ date?: string; score?: number; sentiment?: number }> }).points ||
        (res as { timeline?: Array<{ date?: string; score?: number; sentiment?: number }> }).timeline ||
        [];
      setPoints(Array.isArray(series) ? series : []);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "טעינת סנטימנט נכשלה");
    } finally {
      setLoading(false);
    }
  }, [voterId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <LoadingSkeleton lines={4} />;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!points.length) {
    return (
      <Card>
        <p className="text-[var(--text-secondary)]">אין עדיין היסטוריית סנטימנט לבוחר זה.</p>
        <Button className="mt-4" variant="outline" onClick={() => void load()}>
          רענן
        </Button>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="mb-3 text-lg font-bold">היסטוריית סנטימנט (30 יום)</h3>
      <ul className="space-y-2 text-sm">
        {points.slice(0, 20).map((p, idx) => (
          <li key={idx} className="flex justify-between text-[var(--text-secondary)]">
            <span>{p.date || `נקודה ${idx + 1}`}</span>
            <span className="font-medium text-white">
              {typeof p.score === "number"
                ? p.score.toFixed(2)
                : typeof p.sentiment === "number"
                  ? p.sentiment.toFixed(2)
                  : "—"}
            </span>
          </li>
        ))}
      </ul>
      <Button className="mt-4" variant="ghost" onClick={() => void load()}>
        רענן
      </Button>
    </Card>
  );
}
