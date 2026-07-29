"use client";

import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { CandidateCard, type CandidateDossier } from "@/components/ui/CandidateCard";
import { DossierUploader } from "@/components/ui/DossierUploader";
import { useToast } from "@/components/Toast";
import { api, ApiError } from "@/lib/api";

export default function DossierPage() {
  const { push } = useToast();
  const [list, setList] = useState<CandidateDossier[]>([]);
  const [selected, setSelected] = useState<CandidateDossier | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.listDossiers("active");
      setList(data.candidates as CandidateDossier[]);
      if (data.candidates.length && !selected) {
        const full = await api.getDossier(data.candidates[0].id);
        setSelected(full as CandidateDossier);
      }
    } catch (err) {
      push({ type: "error", message: err instanceof ApiError ? err.message : "טעינת תיקים נכשלה" });
    } finally {
      setLoading(false);
    }
  }, [push, selected]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const upload = async (file: File) => {
    setUploading(true);
    setProgress(15);
    const timer = window.setInterval(() => setProgress((p) => Math.min(p + 12, 90)), 400);
    try {
      const dossier = await api.uploadDossier(file);
      setProgress(100);
      push({ type: "success", message: `תיק ${dossier.candidate_name} נטען בהצלחה` });
      setSelected(dossier as CandidateDossier);
      await load();
    } catch (err) {
      push({ type: "error", message: err instanceof ApiError ? err.message : "העלאה נכשלה" });
    } finally {
      window.clearInterval(timer);
      setUploading(false);
      setProgress(0);
    }
  };

  const openCandidate = async (id: string) => {
    try {
      const full = await api.getDossier(id);
      setSelected(full as CandidateDossier);
    } catch (err) {
      push({ type: "error", message: err instanceof ApiError ? err.message : "טעינת תיק נכשלה" });
    }
  };

  return (
    <div dir="rtl" className="situation-room min-h-screen px-4 py-6 sm:px-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs text-cyan-300/80">ניהול תיק מועמד</p>
          <h1 className="command-text text-2xl font-bold text-white sm:text-3xl">תיק מועמד ומפלגה</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/trends" className="btn-secondary">
            מודיעין טרנדים
          </Link>
          <Link href="/" className="btn-secondary">
            <ArrowRight className="h-4 w-4" />
            חזרה לפיקוד
          </Link>
        </div>
      </header>

      <div className="mb-6">
        <DossierUploader
          uploading={uploading}
          progress={progress}
          onUpload={upload}
          onUploaded={() => undefined}
          onError={(msg) => push({ type: "error", message: msg })}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="glass-panel h-fit space-y-2 rounded-3xl p-3">
            <p className="px-2 text-xs text-slate-500">מועמדים פעילים ({list.length})</p>
            {list.length === 0 ? <p className="px-2 text-sm text-slate-500">אין תיקים עדיין — העלה קובץ</p> : null}
            {list.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`w-full rounded-xl px-3 py-2 text-start text-sm transition ${
                  selected?.id === c.id ? "bg-cyan-500/20 text-white" : "text-slate-300 hover:bg-white/5"
                }`}
                onClick={() => void openCandidate(c.id)}
              >
                <div className="font-medium">{c.candidate_name}</div>
                <div className="text-xs text-slate-500">{c.party}</div>
              </button>
            ))}
          </aside>

          <div>
            {selected ? (
              <CandidateCard
                candidate={selected}
                selected
                onRefresh={async () => {
                  try {
                    const refreshed = await api.refreshDossier(selected.id);
                    setSelected(refreshed as CandidateDossier);
                    push({ type: "success", message: "התיק רוענן" });
                  } catch (err) {
                    push({ type: "error", message: err instanceof ApiError ? err.message : "רענון נכשל" });
                  }
                }}
                onDelete={async () => {
                  try {
                    await api.deleteDossier(selected.id);
                    push({ type: "success", message: "התיק הועבר לארכיון" });
                    setSelected(null);
                    await load();
                  } catch (err) {
                    push({ type: "error", message: err instanceof ApiError ? err.message : "מחיקה נכשלה" });
                  }
                }}
              />
            ) : (
              <div className="glass-panel rounded-3xl p-8 text-center text-slate-500">בחר מועמד מהרשימה או העלה תיק חדש</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
