"use client";

import { Download, Loader2 } from "lucide-react";
import { useState } from "react";

import { ApiError, api } from "@/lib/api";

type PdfDownloaderProps = {
  name: string;
  className?: string;
  label?: string;
};

export function PdfDownloader({ name, className = "", label = "הורד תדריך PDF" }: PdfDownloaderProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const download = async () => {
    setLoading(true);
    setError(null);
    try {
      const blob = await api.getBriefingPdf(name);
      if (!(blob instanceof Blob) || blob.type.includes("text") || blob.size < 100) {
        const text = blob instanceof Blob ? await blob.text() : "";
        throw new Error(text || "יצירת PDF נכשלה");
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `briefing-${name.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "הורדת PDF נכשלה");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      <button type="button" className="btn-secondary text-xs" disabled={loading || !name} onClick={() => void download()}>
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
        {loading ? "טוען…" : label}
      </button>
      {error ? (
        <p className="mt-1 text-[11px] text-red-300" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
