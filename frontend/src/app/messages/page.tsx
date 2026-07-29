"use client";

import { Copy, Loader2, Sparkles, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { ErrorState } from "@/components/ErrorState";
import { useToast } from "@/components/Toast";
import { api, ApiError } from "@/lib/api";
import type { GeneratedMessageBundle } from "@/lib/features";
import type { Voter } from "@/lib/types";

const CHANNELS = [
  { id: "whatsapp", label: "וואטסאפ" },
  { id: "sms", label: "SMS" },
  { id: "phone_script", label: "טלפון" },
  { id: "door_knock", label: "דלת-דלת" },
] as const;

type ChannelId = (typeof CHANNELS)[number]["id"];

export default function MessagesPage() {
  const { push: toast } = useToast();
  const searchParams = useSearchParams();
  const initialVoterId = searchParams.get("voter_id") || "";
  const [voters, setVoters] = useState<Voter[]>([]);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(initialVoterId);
  const [bundle, setBundle] = useState<GeneratedMessageBundle | null>(null);
  const [edited, setEdited] = useState<Record<string, string>>({});
  const [original, setOriginal] = useState<Record<string, string>>({});
  const [channel, setChannel] = useState<ChannelId>("whatsapp");
  const [loading, setLoading] = useState(false);
  const [bulkTopic, setBulkTopic] = useState("חינוך");
  const [topics, setTopics] = useState<string[]>([]);
  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [list, t] = await Promise.all([
          api.getVoters({ limit: 200, search: search || undefined }),
          api.getMessageTopics(),
        ]);
        setVoters(list.voters);
        setTopics(t.topics);
        setSelectedId((prev) => prev || initialVoterId || (list.voters[0] ? String(list.voters[0].id) : ""));
      } catch (e) {
        setPageError(e instanceof ApiError ? e.message : "טעינת בוחרים נכשלה");
      }
    })();
  }, [search, initialVoterId]);

  const filtered = useMemo(() => {
    const q = search.trim();
    if (!q) return voters;
    return voters.filter((v) =>
      `${v.first_name} ${v.last_name} ${v.neighborhood ?? ""} ${v.id}`.includes(q),
    );
  }, [voters, search]);

  const generate = useCallback(async () => {
    if (!selectedId) return;
    setLoading(true);
    try {
      const res = await api.generateMessage(String(selectedId));
      setBundle(res);
      setEdited({ ...res.channels });
      setOriginal({ ...res.channels });
      setPageError(null);
    } catch (e) {
      setPageError(e instanceof ApiError ? e.message : "יצירת מסר נכשלה");
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    if (selectedId) void generate();
  }, [selectedId, generate]);

  async function copyCurrent() {
    const text = edited[channel] || "";
    try {
      await navigator.clipboard.writeText(text);
      toast({ type: "success", message: "הועתק ללוח" });
    } catch {
      toast({ type: "error", message: "העתקה נכשלה" });
    }
  }

  async function bulkGenerate() {
    setLoading(true);
    try {
      const ids = voters.slice(0, 200).map((v) => String(v.id));
      const res = await api.batchGenerateMessages({ voter_ids: ids, topic: bulkTopic, max_count: 200 });
      toast({ type: "success", message: `נוצרו ${res.generated} מסרים` });
    } catch (e) {
      toast({ type: "error", message: e instanceof ApiError ? e.message : "יצירה המונית נכשלה" });
    } finally {
      setLoading(false);
    }
  }

  if (pageError && !bundle && !voters.length) {
    return (
      <AppShell active="messages" title="סטודיו מסרים">
        <ErrorState message={pageError} onRetry={() => window.location.reload()} />
      </AppShell>
    );
  }

  return (
    <AppShell active="messages" title="סטודיו מסרים ממוקד" subtitle="מנוע מיקרו-טארגטינג לפי OSINT ו-GOTV">
      <div dir="rtl" className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4 rounded-2xl border border-white/10 bg-slate-900/50 p-4">
          <label className="block text-xs font-semibold text-slate-400">חיפוש בוחר</label>
          <input
            className="input w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="שם, שכונה או מזהה"
          />
          <select
            className="input w-full"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            aria-label="בחירת בוחר"
          >
            {filtered.map((v) => (
              <option key={String(v.id)} value={String(v.id)}>
                {v.first_name} {v.last_name} · {v.neighborhood || "ללא שכונה"}
              </option>
            ))}
          </select>
          <button type="button" className="btn-primary w-full" disabled={loading} onClick={() => void generate()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            צור מסר מחדש
          </button>

          <div className="border-t border-white/10 pt-4">
            <p className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-300">
              <Users className="h-3.5 w-3.5" aria-hidden />
              יצירה המונית
            </p>
            <select className="input mb-2 w-full" value={bulkTopic} onChange={(e) => setBulkTopic(e.target.value)}>
              {(topics.length ? topics : ["חינוך", "קהילה", "בטחון"]).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <button type="button" className="btn-ghost w-full text-xs" disabled={loading} onClick={() => void bulkGenerate()}>
              צור עד 200 מסרים
            </button>
          </div>
        </aside>

        <div className="space-y-4">
          {bundle ? (
            <>
              <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                <span>
                  נושא: <strong className="text-white">{bundle.target_topic}</strong>
                </span>
                <span>
                  ביטחון מודל: <strong className="text-emerald-400">{(bundle.confidence * 100).toFixed(0)}%</strong>
                </span>
                <span>
                  קטגוריית GOTV: <strong className="text-white">{bundle.gotv_category}</strong>
                </span>
                {bundle.osint_signals.length ? (
                  <span>אותות: {bundle.osint_signals.join(" · ")}</span>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-1 rounded-xl border border-white/10 bg-slate-900/40 p-1">
                {CHANNELS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setChannel(c.id)}
                    className={`rounded-lg px-4 py-2 text-xs font-semibold ${
                      channel === c.id ? "bg-red-500/20 text-white ring-1 ring-red-500/30" : "text-slate-400"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              <div className="relative rounded-2xl border border-white/10 bg-slate-950/80 p-4">
                <button
                  type="button"
                  onClick={() => void copyCurrent()}
                  className="absolute left-3 top-3 rounded-lg bg-white/5 p-2 text-slate-300 hover:bg-white/10"
                  aria-label="העתק מסר"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <textarea
                  className="min-h-[200px] w-full resize-y bg-transparent pt-10 text-sm leading-relaxed text-slate-100 outline-none"
                  value={edited[channel] ?? ""}
                  onChange={(e) => setEdited((prev) => ({ ...prev, [channel]: e.target.value }))}
                />
                {original[channel] && edited[channel] !== original[channel] ? (
                  <p className="mt-2 text-[10px] text-amber-400">נערך — המקור נשמר בשרת</p>
                ) : null}
              </div>
            </>
          ) : (
            <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-dashed border-white/10">
              {loading ? <Loader2 className="h-8 w-8 animate-spin text-red-400" /> : <p className="text-sm text-slate-500">בחר בוחר ליצירת מסר</p>}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
