"use client";

import { Upload } from "lucide-react";
import { useCallback, useState } from "react";

type DossierUploaderProps = {
  onUploaded: (dossier: Record<string, unknown>) => void;
  onError: (message: string) => void;
  uploading: boolean;
  progress: number;
  onUpload: (file: File) => Promise<void>;
};

export function DossierUploader({ onUploaded, onError, uploading, progress, onUpload }: DossierUploaderProps) {
  const [dragging, setDragging] = useState(false);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      const file = files?.[0];
      if (!file) {
        onError("לא נבחר קובץ");
        return;
      }
      const ok = /\.(pdf|docx|json|txt|md)$/i.test(file.name);
      if (!ok) {
        onError("פורמט לא נתמך. השתמש ב־PDF, DOCX, JSON, TXT או MD");
        return;
      }
      await onUpload(file);
      void onUploaded;
    },
    [onError, onUpload, onUploaded],
  );

  return (
    <div
      dir="rtl"
      className={`glass-panel relative overflow-hidden rounded-3xl border-2 border-dashed p-8 transition ${
        dragging ? "border-cyan-400 bg-cyan-500/10 shadow-[0_0_30px_rgba(34,211,238,0.25)]" : "border-white/15"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        void handleFiles(e.dataTransfer.files);
      }}
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/15 ring-1 ring-cyan-400/30">
          <Upload className="h-6 w-6 text-cyan-300" />
        </div>
        <h3 className="text-lg font-semibold text-white">העלאת תיק מועמד</h3>
        <p className="max-w-md text-sm text-slate-400">גרור לכאן קובץ PDF, DOCX, JSON, TXT או MD — או בחר מהמחשב</p>
        <label className="btn-primary cursor-pointer">
          בחר קובץ
          <input
            type="file"
            className="hidden"
            accept=".pdf,.docx,.json,.txt,.md"
            onChange={(e) => void handleFiles(e.target.files)}
          />
        </label>
        {uploading ? (
          <div className="mt-4 w-full max-w-sm">
            <div className="mb-1 flex justify-between text-xs text-slate-400">
              <span>מעלה ומנתח…</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-l from-cyan-400 to-blue-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
