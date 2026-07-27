"use client";

import { FileSpreadsheet, Loader2, UploadCloud } from "lucide-react";
import { DragEvent, useRef, useState } from "react";

type FileUploaderProps = {
  loading?: boolean;
  statusText?: string | null;
  error?: string | null;
  onFile: (file: File) => void;
  onRetry?: () => void;
};

export function FileUploader({ loading, statusText, error, onFile, onRetry }: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files?.[0] || loading) return;
    onFile(files[0]);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    handleFiles(event.dataTransfer.files);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`glass-panel relative overflow-hidden rounded-3xl p-6 text-center transition ${dragging ? "glow-ring" : ""}`}
      role="region"
      aria-label="העלאת קובץ מצביעים"
    >
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 ring-1 ring-red-500/25">
        {loading ? <Loader2 className="h-6 w-6 animate-spin text-red-400" /> : <UploadCloud className="h-6 w-6 text-red-400" />}
      </div>
      <p className="text-sm font-semibold text-white">ייבוא מצביעים</p>
      <p className="mt-1 text-xs text-slate-500">xlsx · xls · csv · txt</p>
      <button type="button" className="btn-primary mt-4" disabled={loading} onClick={() => inputRef.current?.click()} aria-label="העלה קובץ מצביעים" aria-describedby="upload-help">
        <FileSpreadsheet className="h-4 w-4" />
        {loading ? "טוען…" : "בחר קובץ"}
      </button>
      <span id="upload-help" className="sr-only">
        פורמטים נתמכים: Excel, CSV, TXT. גודל מקסימלי: 10MB.
      </span>
      {statusText ? <p className="mt-3 text-sm text-cyan-200">{statusText}</p> : null}
      {error ? (
        <div className="mt-3 text-sm text-red-300" role="alert">
          {error}
          {onRetry ? (
            <button type="button" className="btn-ghost ms-2 text-red-200" onClick={onRetry}>
              נסה שוב
            </button>
          ) : null}
        </div>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv,.txt"
        className="hidden"
        disabled={loading}
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
