"use client";

import { Eye, EyeOff, Shield } from "lucide-react";
import { useEffect, useState } from "react";

import { ApiError, api } from "@/lib/api";

const STORAGE_KEY = "blackopps-api-key";
const SKIP_KEY = "blackopps-api-key-skipped";

type ApiKeyGateProps = {
  children: React.ReactNode;
};

export function ApiKeyGate({ children }: ApiKeyGateProps) {
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [shake, setShake] = useState(false);
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    const existing = localStorage.getItem(STORAGE_KEY);
    const skipped = localStorage.getItem(SKIP_KEY) === "1";
    const envDefault = process.env.NEXT_PUBLIC_DEFAULT_API_KEY;
    if (envDefault && !existing) {
      localStorage.setItem(STORAGE_KEY, envDefault);
      setOpen(false);
    } else if (!existing && !skipped) {
      setOpen(true);
    }
    setReady(true);

    const onOpen = () => {
      setValue(localStorage.getItem(STORAGE_KEY) || "");
      setError(null);
      setOpen(true);
    };
    window.addEventListener("blackopps:open-api-key", onOpen);
    return () => window.removeEventListener("blackopps:open-api-key", onOpen);
  }, []);

  const save = async () => {
    if (!value.trim()) {
      setError("הזן מפתח API לפני אישור");
      setShake(true);
      window.setTimeout(() => setShake(false), 400);
      return;
    }
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      localStorage.setItem(STORAGE_KEY, value.trim());
      localStorage.removeItem(SKIP_KEY);
      await api.health();
      setGranted(true);
      window.setTimeout(() => {
        setOpen(false);
        setGranted(false);
      }, 450);
    } catch (err) {
      if (err instanceof ApiError && err.code === "unauthorized") {
        setError("מפתח API לא תקין");
        setShake(true);
        window.setTimeout(() => setShake(false), 400);
        return;
      }
      // Health may succeed even without auth in open mode
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const skip = () => {
    localStorage.setItem(SKIP_KEY, "1");
    setOpen(false);
  };

  if (!ready) return null;

  return (
    <>
      {children}
      {open ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-red-950/70 p-4 backdrop-blur-md">
          <div
            className={`glass-panel-strong tactical-header w-full max-w-md rounded-3xl border border-red-500/25 p-6 sm:p-8 ${shake ? "auth-shake" : ""} ${granted ? "auth-granted" : ""}`}
            role="dialog"
            aria-modal
            aria-labelledby="api-key-title"
          >
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/20 ring-1 ring-red-400/40">
                <Shield className="h-5 w-5 text-red-200" aria-hidden />
              </div>
              <div>
                <h2 id="api-key-title" className="command-text text-lg font-bold text-white">
                  אישור גישה — חדר מצב
                </h2>
                <p className="text-xs text-red-200/70">הזן מפתח API מאושר. נשמר מקומית בלבד.</p>
              </div>
            </div>

            <label className="mb-2 block text-xs font-medium text-slate-400" htmlFor="api-key-input">
              מפתח API
            </label>
            <div className="relative">
              <input
                id="api-key-input"
                type={show ? "text" : "password"}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="input w-full pe-12"
                placeholder="sk-..."
                autoComplete="off"
              />
              <button
                type="button"
                className="btn-ghost absolute start-2 top-1/2 -translate-y-1/2 p-2"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? "הסתר מפתח" : "הצג מפתח"}
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {error ? (
              <p className="mt-3 text-sm text-red-300" role="alert">
                {error}
              </p>
            ) : null}

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <button type="button" className="btn-primary flex-1" disabled={saving} onClick={() => void save()}>
                <Shield className="h-4 w-4" aria-hidden />
                {saving ? "טוען…" : "אשר גישה"}
              </button>
              <button type="button" className="btn-secondary flex-1" onClick={skip}>
                המשך ללא מפתח
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function openApiKeySettings() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("blackopps:open-api-key"));
  }
}
