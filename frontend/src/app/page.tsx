"use client";

import { Loader2, Radar, Send, Swords, Target, Users } from "lucide-react";
import dynamic from "next/dynamic";
import { Suspense, useCallback, useEffect, useRef } from "react";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { FileUploader } from "@/components/FileUploader";
import { Skeleton } from "@/components/Skeleton";
import { useToast } from "@/components/Toast";
import { useTabState } from "@/hooks/useTabState";
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

const GOTVPanel = dynamic(() => import("@/components/GOTVPanel").then((m) => m.GOTVPanel), {
  loading: () => <Skeleton variant="card" lines={4} />,
  ssr: false,
});
const OppositionView = dynamic(() => import("@/components/OppositionView").then((m) => m.OppositionView), {
  loading: () => <Skeleton variant="card" lines={4} />,
  ssr: false,
});
const DispatchPanel = dynamic(() => import("@/components/DispatchPanel").then((m) => m.DispatchPanel), {
  loading: () => <Skeleton variant="card" lines={4} />,
  ssr: false,
});
const OSINTResults = dynamic(() => import("@/components/OSINTResults").then((m) => m.OSINTResults), {
  loading: () => <Skeleton variant="card" />,
  ssr: false,
});
const VoterTable = dynamic(() => import("@/components/VoterTable").then((m) => m.VoterTable), {
  loading: () => <Skeleton variant="table" />,
  ssr: false,
});

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

function DashboardInner() {
  const { push: pushToast } = useToast();
  const [tab, setTab] = useTabState("osint");
  const tablistRef = useRef<HTMLDivElement>(null);
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

  const showToast = useCallback(
    (message: string, tone: "ok" | "err" | "warning" | "info" = "ok") => {
      const type = tone === "ok" ? "success" : tone === "err" ? "error" : tone;
      pushToast({ type, message });
    },
    [pushToast],
  );

  const runOsint = useCallback(async (names: string[]) => {
    if (!names.length) {
      setOsintError("לא נמצאו שמות לניתוח");
      return;
    }
    setOsintLoading(true);
    setOsintError(null);
    setOsintProgress(`מנתח ${names.length} שמות…`);
    try {
      const all: EnrichmentResult[] = [];
      const chunk = 3;
      for (let i = 0; i < names.length; i += chunk) {
        const slice = names.slice(i, i + chunk);
        setOsintProgress(`אצווה ${Math.floor(i / chunk) + 1} מתוך ${Math.ceil(names.length / chunk)}`);
        const res = await api.analyze(slice);
        all.push(...res.profiles);
        setProfiles([...all]);
      }
      showToast(`ניתוח OSINT הושלם עבור ${names.length} שמות`, "ok");
    } catch (err) {
      const msg = err instanceof ApiError || err instanceof Error ? err.message : "ניתוח OSINT נכשל";
      setOsintError(msg);
      showToast(msg, "err");
    } finally {
      setOsintLoading(false);
      setOsintProgress(null);
    }
  }, [showToast]);

  // Auto-OSINT: paste names → debounce 500ms → analyze (no button required)
  useEffect(() => {
    const names = parseManualNames(manual);
    if (!names.length) return;
    const timer = window.setTimeout(() => {
      void runOsint(names);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [manual, runOsint]);

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
            showToast(`יובאו ${names.length.toLocaleString("he-IL")} מצביעים`, "ok");
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
            ? `יובאו ${result.imported.toLocaleString("he-IL")} מצביעים`
            : `כפילויות ${result.duplicates} · GOTV עודכן`,
          "ok",
        );
        if ((result.osint_enriched ?? 0) > 0) {
          showToast(`הועשרו ${result.osint_enriched} שמות בניתוח OSINT`, "ok");
          if (result.osint_samples?.length) {
            setProfiles((prev) => [
              ...result.osint_samples!.map((s) => ({
                name: s.name,
                scores: {
                  composite: s.composite,
                  political: s.political,
                  community: s.community,
                  voter: s.voter_reliability,
                  financial: s.financial,
                },
                tier: s.tier || "UNKNOWN",
                recommendation: "Auto-OSINT on import",
              })),
              ...prev,
            ]);
          }
        }
        setTab("gotv");
      }
    } catch (err) {
      const msg = err instanceof ApiError || err instanceof Error ? err.message : "ייבוא נכשל";
      setImportError(msg);
      showToast(msg, "err");
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
      showToast("השוואת מועמדים הושלמה", "info");
    } catch (err) {
      const msg = err instanceof ApiError || err instanceof Error ? err.message : "השוואה נכשלה";
      setCompareError(msg);
      showToast(msg, "err");
    } finally {
      setCompareLoading(false);
    }
  };

  const onTabKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const idx = TABS.findIndex((t) => t.id === tab);
    if (idx < 0) return;
    // RTL: ArrowRight moves to previous visually (index -1), ArrowLeft to next
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setTab(TABS[(idx + 1) % TABS.length].id);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      setTab(TABS[(idx - 1 + TABS.length) % TABS.length].id);
    } else if (event.key === "Home") {
      event.preventDefault();
      setTab(TABS[0].id);
    } else if (event.key === "End") {
      event.preventDefault();
      setTab(TABS[TABS.length - 1].id);
    }
  };

  return (
    <AppShell title="BlackOpps" subtitle="מודיעין בחירות · GOTV · אופוזיציה · שיגור">
      <div
        ref={tablistRef}
        role="tablist"
        aria-label="ניווט לשוניות חמ״ל"
        className="mb-6 flex flex-wrap gap-1 rounded-2xl border border-white/[0.06] bg-slate-900/40 p-1"
        onKeyDown={onTabKeyDown}
      >
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`tab-${id}`}
            aria-selected={tab === id}
            aria-controls={`panel-${id}`}
            tabIndex={tab === id ? 0 : -1}
            onClick={() => setTab(id)}
            className={`focus-ring inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition sm:flex-none sm:px-4 ${
              tab === id
                ? "bg-white/[0.08] text-white shadow-sm ring-1 ring-white/10"
                : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
            }`}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {label}
          </button>
        ))}
      </div>

      {tab === "osint" ? (
        <section
          id="panel-osint"
          role="tabpanel"
          aria-labelledby="tab-osint"
          className="tab-panel-enter content-auto space-y-6"
        >
          <div className="card-stagger grid gap-4 lg:grid-cols-2">
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
                aria-describedby="osint-help"
              />
              <span id="osint-help" className="sr-only">
                הזן שמות בעברית, שורה לכל שם. הניתוח רץ אוטומטית לאחר חצי שנייה.
              </span>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div
                  className="btn-primary pointer-events-none opacity-90"
                  aria-live="polite"
                  aria-label={osintLoading ? "מנתח OSINT אוטומטית" : "ניתוח OSINT אוטומטי פעיל"}
                >
                  {osintLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radar className="h-4 w-4" />}
                  {osintLoading ? "מנתח אוטומטית…" : "OSINT אוטומטי"}
                </div>
                <button
                  type="button"
                  className="btn-ghost text-xs"
                  disabled={osintLoading || !manual.trim()}
                  onClick={() => void runOsint(parseManualNames(manual))}
                  aria-label="הפעל ניתוח OSINT מחדש"
                >
                  הרץ שוב
                </button>
                {osintProgress ? <span className="text-xs text-slate-400">{osintProgress}</span> : null}
              </div>
              <p className="mt-2 text-xs text-slate-500">הדבקת שמות מפעילה ניתוח OSINT אוטומטית (debounce 500ms).</p>
              {osintError ? (
                <div className="mt-3">
                  <ErrorState message={osintError} onRetry={() => void runOsint(parseManualNames(manual))} />
                </div>
              ) : null}
            </div>
          </div>

          {importResult ? (
            <div className="glass-panel data-refreshed flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3 text-sm text-slate-300">
              <Users className="h-4 w-4 text-cyan-400" aria-hidden />
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

          {osintLoading && profiles.length === 0 ? <Skeleton variant="card" lines={4} /> : null}
          {!osintLoading && profiles.length === 0 && !importResult ? (
            <EmptyState
              icon={<Radar className="mx-auto h-10 w-10" />}
              title="התחל בניתוח מודיעין"
              description="הזן שמות או העלה קובץ כדי להתחיל בניתוח OSINT"
              action={{
                label: "העלה קובץ מצביעים",
                onClick: () => document.querySelector<HTMLButtonElement>('button[aria-label="העלה קובץ מצביעים"]')?.click(),
              }}
            />
          ) : null}
          <OSINTResults profiles={profiles} />
          {voters.length > 0 ? <VoterTable voters={voters} /> : null}
        </section>
      ) : null}

      {tab === "gotv" ? (
        <section id="panel-gotv" role="tabpanel" aria-labelledby="tab-gotv" className="tab-panel-enter content-auto">
          <GOTVPanel
            plan={gotvPlan}
            loading={gotvLoading}
            error={gotvError}
            onRefresh={() => void refreshGotv()}
            onImportHint={() => setTab("osint")}
            onDispatch={(voter) => {
              setDispatchPrefill(voter);
              setTab("dispatch");
            }}
          />
        </section>
      ) : null}

      {tab === "opposition" ? (
        <section
          id="panel-opposition"
          role="tabpanel"
          aria-labelledby="tab-opposition"
          className="tab-panel-enter content-auto"
        >
          <OppositionView
            result={compareResult}
            loading={compareLoading}
            error={compareError}
            onCompare={(a, b) => void handleCompare(a, b)}
          />
        </section>
      ) : null}

      {tab === "dispatch" ? (
        <section id="panel-dispatch" role="tabpanel" aria-labelledby="tab-dispatch" className="tab-panel-enter content-auto">
          <DispatchPanel prefill={dispatchPrefill} onToast={showToast} />
        </section>
      ) : null}
    </AppShell>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <AppShell title="BlackOpps" subtitle="טוען…">
          <Skeleton variant="card" lines={5} />
        </AppShell>
      }
    >
      <DashboardInner />
    </Suspense>
  );
}
