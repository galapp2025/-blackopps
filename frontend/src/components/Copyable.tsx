"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

type CopyableProps = {
  text: string;
  label?: string;
  className?: string;
};

export function Copyable({ text, label, className = "" }: CopyableProps) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        } catch {
          setCopied(false);
        }
      }}
      className={`btn-press group inline-flex items-center gap-1 transition-colors hover:text-cyan-400 ${className}`}
      aria-label={`העתק ${label || text}`}
    >
      <span>{label || text}</span>
      {copied ? (
        <Check className="h-3 w-3 text-emerald-400" aria-hidden />
      ) : (
        <Copy className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
      )}
    </button>
  );
}
