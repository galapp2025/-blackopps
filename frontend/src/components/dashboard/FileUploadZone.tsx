"use client";

import { FileSpreadsheet, Loader2, UploadCloud } from "lucide-react";
import { DragEvent, useRef, useState } from "react";

type FileUploadZoneProps = {
  loading: boolean;
  onFileSelect: (file: File) => void;
};

export function FileUploadZone({ loading, onFileSelect }: FileUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0 || loading) return;
    onFileSelect(files[0]);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    handleFiles(event.dataTransfer.files);
  };

  return (
    <div className="animate-fade-up mx-auto max-w-3xl">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`glass-panel-strong relative overflow-hidden rounded-3xl p-10 text-center transition-all ${
          dragging ? "glow-ring scale-[1.01]" : ""
        }`}
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-red-500/5 via-transparent to-cyan-500/5" />

        <div className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 ring-1 ring-red-500/20">
          {loading ? <Loader2 className="h-8 w-8 animate-spin text-red-400" /> : <UploadCloud className="h-8 w-8 text-red-400" />}
        </div>

        <h2 className="relative text-2xl font-bold tracking-tight text-white">טעינת קובץ בוחרים / אקסל מבצעי</h2>
        <p className="relative mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-400">
          העלה קובץ מקור (XLSX, CSV, TXT) להרצת האנליזה ומיפוי 30 נקודות המפתח בזמן אמת.
        </p>

        <div className="relative mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button type="button" className="btn-primary" disabled={loading} onClick={() => inputRef.current?.click()}>
            <FileSpreadsheet className="h-4 w-4" />
            {loading ? "מריץ אנליזת עומק..." : "בחר קובץ להעלאה"}
          </button>
          <p className="text-xs text-slate-500">תומך ב־.csv · .txt · .xlsx · .xls</p>
        </div>


        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv,.txt"
          className="hidden"
          disabled={loading}
          onChange={(event) => handleFiles(event.target.files)}
        />
      </div>
    </div>
  );
}
