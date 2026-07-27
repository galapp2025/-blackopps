"use client";

import { FileSpreadsheet, Loader2, Sparkles, UploadCloud } from "lucide-react";
import { DragEvent, useRef, useState } from "react";

import { SystemStatusBar } from "@/components/dashboard/SystemStatusBar";

type FileUploadZoneProps = {
  loading: boolean;
  progress?: { current: number; total: number } | null;
  onFileSelect: (file: File) => void;
  onManualSubmit: (text: string) => void;
  error?: string | null;
};

const steps = [
  { n: "01", title: "טעינה", desc: "קובץ או רשימת שמות" },
  { n: "02", title: "ניתוח OSINT", desc: "ציונים, מקורות, רשת" },
  { n: "03", title: "פעולה", desc: "תדריך והפצה לתור" },
];

export function FileUploadZone({
  loading,
  progress,
  onFileSelect,
  onManualSubmit,
  error,
}: FileUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [manual, setManual] = useState("");

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0 || loading) return;
    onFileSelect(files[0]);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    handleFiles(event.dataTransfer.files);
  };

  const progressPercent =
    progress && progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="animate-fade-up mx-auto max-w-4xl space-y-8">
      <div className="grid gap-3 sm:grid-cols-3">
        {steps.map((step) => (
          <div
            key={step.n}
            className="glass-panel rounded-2xl px-4 py-3 text-center sm:text-right"
          >
            <p className="font-mono text-[10px] font-bold text-red-400/90">{step.n}</p>
            <p className="text-sm font-semibold text-white">{step.title}</p>
            <p className="mt-0.5 text-xs text-slate-500">{step.desc}</p>
          </div>
        ))}
      </div>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        role="region"
        aria-label="אזור העלאת קובץ"
        className={`glass-panel-strong relative overflow-hidden rounded-3xl p-8 text-center transition-all sm:p-12 ${
          dragging ? "glow-ring scale-[1.005]" : ""
        }`}
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-red-500/[0.07] via-transparent to-cyan-500/[0.06]" />

        <div className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 ring-1 ring-red-500/25">
          {loading ? (
            <Loader2 className="h-8 w-8 animate-spin text-red-400" aria-hidden />
          ) : (
            <UploadCloud className="h-8 w-8 text-red-400" aria-hidden />
          )}
        </div>

        <h2 className="relative text-2xl font-bold tracking-tight text-white sm:text-3xl">
          התחלת ניתוח מודיעין
        </h2>
        <p className="relative mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-400">
          גרור קובץ לכאן או הדבק שמות — המערכת מריצה OSINT, בונה פרופיל אסטרטגי ומכינה המלצות הפצה.
        </p>

        <div className="relative mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            className="btn-primary min-w-[10rem]"
            disabled={loading}
            onClick={() => inputRef.current?.click()}
          >
            <FileSpreadsheet className="h-4 w-4" aria-hidden />
            {loading ? "מריץ ניתוח…" : "בחר קובץ"}
          </button>
          <p className="text-xs text-slate-500">CSV · TXT · XLSX</p>
        </div>

        {loading && progress ? (
          <div className="relative mx-auto mt-8 max-w-md" role="status" aria-live="polite">
            <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
              <span>
                אצווה {progress.current} מתוך {progress.total}
              </span>
              <span className="font-mono tabular-nums">{progressPercent}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-800/90">
              <div
                className="h-full rounded-full bg-gradient-to-l from-red-600 via-red-400 to-cyan-400 transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        ) : null}

        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv,.txt"
          className="hidden"
          disabled={loading}
          onChange={(event) => handleFiles(event.target.files)}
        />
      </div>

      <div className="glass-panel rounded-3xl p-6 sm:p-8">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-cyan-400" aria-hidden />
          <label htmlFor="manual-names" className="text-sm font-semibold text-slate-200">
            הדבקת שמות (שורה אחת לכל שם)
          </label>
        </div>
        <textarea
          id="manual-names"
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          rows={6}
          placeholder={"ישראל ישראלי\nשרה כהן\nמשה לוי"}
          className="input custom-scrollbar w-full resize-y font-mono text-sm leading-relaxed"
          disabled={loading}
        />
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="btn-primary"
            disabled={loading || !manual.trim()}
            onClick={() => onManualSubmit(manual)}
          >
            הרץ ניתוח OSINT
          </button>
          {error ? (
            <p className="text-sm text-red-300" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </div>

      <div className="sm:hidden">
        <SystemStatusBar />
      </div>
    </div>
  );
}
