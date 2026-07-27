"use client";

import { Loader2, Radar, Send, Swords, Target, Users } from "lucide-react";
import { useCallback, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { DispatchPanel } from "@/components/DispatchPanel";
import { DispatchToast } from "@/components/dashboard/DispatchToast";
import { FileUploader } from "@/components/FileUploader";
import { GOTVPanel } from "@/components/GOTVPanel";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { OppositionView } from "@/components/OppositionView";
import { OSINTResults } from "@/components/OSINTResults";
import { VoterTable } from "@/components/VoterTable";
import { ApiError, api } from "@/lib/api";
import { extractNamesFromFile } from "@/lib/fileParser";
import type {
  ComparisonResult,
  DashboardTab,
  EnrichmentResult,
  GOTVBattlePlan,
  GOTVPrediction,
  ImportResult,
  Voter,
} from "@/lib/types";

const TABS: { id: DashboardTab; label: string; icon: typeof Radar }[] = [
  { id: "osint", label: "מודיעין", icon: Radar },
  { id: "gotv", label: "GOTV", icon: Target },
  { id: "opposition", label: "מחקר אופוזיציה", icon: Swords },
  { id: "dispatch", label: "שיגור", icon: Send },
];

function parseManualNames(text: string): string[] {
  return text
    .split(/[\n,;]+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function DashboardPage() {
  const [tab, setTab] = useState<DashboardTab>("osint");
  const [manual, setManual] = useState("");
  const [osintLoading, setOsintLoading] = useState(false);
  const [osintProgress, setOsintProgress] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<EnrichmentResult[]>([]);
  const [osintError, setOsintError] = useState<string | null>(null);

  const [importLoading, setImportLoading] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [lastFile, setLastFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [voters, setVoters] = useState<Voter[]>([]);

  const [gotvPlan, setGotvPlan] = useState<GOTVBattlePlan | null>(null);
  const [gotvLoading, setGotvLoading] = useState(false);
  const [gotvError, setGotvError] = useState<string | null>(null);

  const [compareResult, setCompareResult] = useState<ComparisonResult | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);

  const [dispatchPrefill, setDispatchPrefill] = useState<GOTVPrediction | null>(null);
  const [toast, setToast] = useState<{ message: string; tone: "ok" | "err" } | null>(null);

  const showToast = useCallback((message: string, tone: "ok" | "err" = "ok") => {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), 3000);
  }, []);

  const runOsint = async (names: string[]) => {
    if (!names.length) {
      setOsintError("לא נמצאו שמות לניתוח");
      return;
    }
    setOsintLoading(true);
    setOsintError(null);
    setOsintProgress(`מנתח ${names.length} שמות…`);
    try {
      // Batch in chunks of 3 to keep UI responsive on Railway
      const all: EnrichmentResult[] = [];
      const chunk = 3;
      for (let i = 0; i < names.length; i += chunk) {
        const slice = names.slice(i, i + chunk);
        setOsintProgress(`אצווה ${Math.floor(i / chunk) + 1} מתוך ${Math.ceil(names.length / chunk)}`);
        const res = await api.analyze(slice);
        all.push(...res.profiles);
        setProfiles([...all]);
      }
      showToast("הניתוח הושלם");
    } catch (err) {
      setOsintError(err instanceof ApiError || err instanceof Error ? err.message : "ניתוח OSINT נכשל");
    } finally {
      setOsintLoading(false);
      setOsintProgress(null);
    }
  };

  const refreshGotv = async (names?: string[]) => {
    setGotvLoading(true);
    setGotvError(null);
    try {
      const plan = names?.length
        ? await api.gotvByNames(names)
        : await api.gotv(
            voters.length
              ? voters.map((v) => ({
                  name: `${v.first_name} ${v.last_name}`.trim(),
                  support_score: v.support_score ?? 0.5,
                  turnout_history: v.turnout_history ?? v.turnout_score ?? 0.55,
                }))
              : undefined,
          );
      setGotvPlan(plan);
      return plan;
    } catch (err) {
      const msg = err instanceof ApiError || err instanceof Error ? err.message : "טעינת GOTV נכשלה";
      setGotvError(msg);
      return null;
    } finally {
      setGotvLoading(false);
    }
  };

  const handleImport = async (file: File) => {
    setLastFile(file);
    setImportLoading(true);
    setImportError(null);
    setImportStatus("מייבא מצביעים…");
    try {
      let result: ImportResult | null = null;

      try {
        result = await api.importVoters(file);
        setImportStatus(
          `יובאו ${result.imported}, כפילויות ${result.duplicates}${
            result.classified != null ? ` · סווגו ${result.classified}` : ""
          }`,
        );
        const listed = await api.getVoters({ limit: 200 });
        setVoters(listed.voters);
      } catch (err) {
        if (err instanceof ApiError && (err.status === 404 || err.status === 405)) {
          setImportStatus("ייבוא API לא זמין — מעבד קובץ מקומית…");
          const names = await extractNamesFromFile(file);
          result = {
            imported: names.length,
            duplicates: 0,
            total: names.length,
            names,
            source: "client",
          };
          setImportStatus(`יובאו ${names.length} שמות מהקובץ`);
          const plan = await refreshGotv(names.slice(0, 150));
          setImportResult(result);
          if (plan) {
            showToast(`יובאו ${names.length} מצביעים`);
            setTab("gotv");
          }
          return;
        }
        throw err;
      }

      setImportResult(result);
      setImportStatus("מרענן GOTV…");
      const plan = await refreshGotv();
      if (plan || result?.categories) {
        setImportStatus(
          `יובאו ${result.imported}, כפילויות ${result.duplicates} · סווגו ${
            plan?.classified ?? result.classified ?? 0
          }`,
        );
        showToast(
          result.imported > 0
            ? `יובאו ${result.imported} מצביעים`
            : `כפילויות ${result.duplicates} · GOTV עודכן`,
        );
        setTab("gotv");
      }
    } catch (err) {
      setImportError(err instanceof ApiError || err instanceof Error ? err.message : "ייבוא נכשל");
    } finally {
      setImportLoading(false);
    }
  };

  const handleCompare = async (a: string, b: string) => {
    setCompareLoading(true);
    setCompareError(null);
    try {
      const result = await api.compare(a, b);
      setCompareResult(result);
    } catch (err) {
      setCompareError(err instanceof ApiError || err instanceof Error ? err.message : "השוואה נכשלה");
    } finally {
      setCompareLoading(false);
    }
  };

  return (
    <AppShell title="BlackOpps" subtitle="מודיעין בחירות · GOTV · אופוזיציה · שיגור">
      <div className="mb-6 flex flex-wrap gap-1 rounded-2xl border border-white/[0.06] bg-slate-900/40 p-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`focus-ring inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition sm:flex-none sm:px-4 ${
              tab === id
                ? "bg-white/[0.08] text-white shadow-sm ring-1 ring-white/10"
                : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
            }`}
            aria-current={tab === id ? "page" : undefined}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {label}
          </button>
        ))}
      </div>

      {tab === "osint" ? (
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <FileUploader
              loading={importLoading}
              statusText={importStatus}
              error={importError}
              onFile={(f) => void handleImport(f)}
              onRetry={lastFile ? () => void handleImport(lastFile) : undefined}
            />

            <div className="glass-panel rounded-3xl p-5 sm:p-6">
              <label htmlFor="manual-names" className="mb-2 block text-sm font-semibold text-slate-200">
                הדבקת שמות לניתוח OSINT
              </label>
              <textarea
                id="manual-names"
                value={manual}
                onChange={(e) => setManual(e.target.value)}
                rows={7}
                placeholder={"ישראל ישראלי\nשרה כהן\nמשה לוי"}
                className="input custom-scrollbar w-full resize-y font-mono text-sm leading-relaxed"
                disabled={osintLoading}
              />
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="btn-primary"
                  disabled={osintLoading || !manual.trim()}
                  onClick={() => void runOsint(parseManualNames(manual))}
                >
                  {osintLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radar className="h-4 w-4" />}
                  {osintLoading ? "מנתח…" : "הרץ ניתוח OSINT"}
                </button>
                {osintProgress ? <span className="text-xs text-slate-400">{osintProgress}</span> : null}
              </div>
              {osintError ? (
                <div className="mt-3 rounded-xl border border-red-500/30 bg-red-950/40 px-3 py-2 text-sm text-red-100" role="alert">
                  {osintError}
                  <button type="button" className="btn-ghost ms-2 text-red-200" onClick={() => void runOsint(parseManualNames(manual))}>
                    נסה שוב
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          {importResult ? (
            <div className="glass-panel flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3 text-sm text-slate-300">
              <Users className="h-4 w-4 text-cyan-400" />
                  ייבוא אחרון: {importResult.imported} · כפילויות {importResult.duplicates}
              {importResult.classified != null ? ` · סווגו ${importResult.classified}` : ""}
              {importResult.source === "client" ? " · עיבוד מקומי" : ""}
              {importResult.categories ? (
                <span className="w-full text-xs text-slate-500 sm:w-auto">
                  SAFE {importResult.categories.safe ?? 0} · LEANING {importResult.categories.leaning ?? 0} · SWING{" "}
                  {importResult.categories.swing ?? 0} · AT_RISK {importResult.categories.at_risk ?? 0}
                </span>
              ) : null}
            </div>
          ) : null}

          {osintLoading && profiles.length === 0 ? <LoadingSkeleton rows={3} /> : null}
          <OSINTResults profiles={profiles} />
          {voters.length > 0 ? <VoterTable voters={voters} /> : null}
        </div>
      ) : null}

      {tab === "gotv" ? (
        <GOTVPanel
          plan={gotvPlan}
          loading={gotvLoading}
          error={gotvError}
          onRefresh={() => void refreshGotv()}
          onDispatch={(voter) => {
            setDispatchPrefill(voter);
            setTab("dispatch");
          }}
        />
      ) : null}

      {tab === "opposition" ? (
        <OppositionView result={compareResult} loading={compareLoading} error={compareError} onCompare={(a, b) => void handleCompare(a, b)} />
      ) : null}

      {tab === "dispatch" ? <DispatchPanel prefill={dispatchPrefill} onToast={showToast} /> : null}

      {toast ? (
        <DispatchToast
          message={toast.message}
          tone={toast.tone}
          onClose={() => setToast(null)}
        />
      ) : null}
    </AppShell>
  );
}
