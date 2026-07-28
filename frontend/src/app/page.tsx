"use client";

import { Loader2, Radar } from "lucide-react";
import dynamic from "next/dynamic";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CommandPalette, useCommandPaletteToggle, type CommandAction } from "@/components/command/CommandPalette";
import { CommandShell } from "@/components/command/CommandShell";
import { CommandSidebar } from "@/components/command/CommandSidebar";
import { CommandTopBar } from "@/components/command/CommandTopBar";
import { GlobalDropOverlay } from "@/components/command/GlobalDropOverlay";
import { IntelPanel } from "@/components/command/IntelPanel";
import { MissionMap } from "@/components/command/MissionMap";
import { NeighborhoodHeatMap } from "@/components/command/NeighborhoodHeatMap";
import { OnboardingHero } from "@/components/command/OnboardingHero";
import { OperationalTimeline, type TimelineEvent } from "@/components/command/OperationalTimeline";
import { QuickActions } from "@/components/command/QuickActions";
import { SmartRecommendation } from "@/components/command/SmartRecommendation";
import { ErrorState } from "@/components/ErrorState";
import { FileUploader } from "@/components/FileUploader";
import { Skeleton } from "@/components/Skeleton";
import { useToast } from "@/components/Toast";
import { useCommandView } from "@/hooks/useCommandView";
import { useIntelRefresh } from "@/hooks/useIntelRefresh";
import { useSystemCheck } from "@/hooks/useSystemCheck";
import { ApiError, api } from "@/lib/api";
import { extractNamesFromFile } from "@/lib/fileParser";
import type {
  ComparisonResult,
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

function parseManualNames(text: string): string[] {
  return text
    .split(/[\n,;]+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function nowLabel() {
  return new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
}

function DashboardInner() {
  const { push: pushToast } = useToast();
  const [view, setView] = useCommandView("command");
  const { open: paletteOpen, setOpen: setPaletteOpen } = useCommandPaletteToggle();
  const { status, nominal, refresh: refreshSystem } = useSystemCheck();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const osintTextRef = useRef<HTMLTextAreaElement>(null);

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
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [reportLoading, setReportLoading] = useState(false);

  const pushTimeline = useCallback((label: string, detail?: string) => {
    setTimeline((prev) => [
      ...prev.slice(-8),
      { id: `${Date.now()}-${label}`, time: nowLabel(), label, detail },
    ]);
  }, []);

  const categories = gotvPlan?.categories || {};
  const swingCount = Number(categories.swing ?? 0);
  const atRiskCount = Number(categories.at_risk ?? 0);
  const safeCount = Number(categories.safe ?? 0);

  const { intel, refreshIntel } = useIntelRefresh(30_000, swingCount, atRiskCount);
  const activeOps = (intel.dispatch?.queued ?? 0) + (intel.dispatch?.in_progress ?? 0);

  const hasOperationalData =
    Boolean(gotvPlan?.classified) ||
    Boolean(importResult) ||
    voters.length > 0 ||
    status.voterTotal > 0;

  const showToast = useCallback(
    (message: string, tone: "ok" | "err" | "warning" | "info" = "ok") => {
      const type = tone === "ok" ? "success" : tone === "err" ? "error" : tone;
      pushToast({ type, message });
    },
    [pushToast],
  );

  const runOsint = useCallback(
    async (names: string[]) => {
      if (!names.length) {
        setOsintError("לא נמצאו שמות לניתוח");
        showToast("הדבק שמות לפני ניתוח", "warning");
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
        pushTimeline("OSINT", `${names.length} שמות`);
        showToast(`ניתוח OSINT הושלם (${names.length})`, "ok");
      } catch (err) {
        const msg = err instanceof ApiError || err instanceof Error ? err.message : "ניתוח OSINT נכשל";
        setOsintError(msg);
        showToast(msg, "err");
      } finally {
        setOsintLoading(false);
        setOsintProgress(null);
      }
    },
    [pushTimeline, showToast],
  );

  useEffect(() => {
    const names = parseManualNames(manual);
    if (!names.length) return;
    const timer = window.setTimeout(() => void runOsint(names), 500);
    return () => window.clearTimeout(timer);
  }, [manual, runOsint]);

  const refreshGotv = useCallback(
    async (names?: string[]) => {
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
        pushTimeline("GOTV", `סווגו ${plan.classified ?? 0}`);
        void refreshIntel();
        return plan;
      } catch (err) {
        const msg = err instanceof ApiError || err instanceof Error ? err.message : "טעינת GOTV נכשלה";
        setGotvError(msg);
        return null;
      } finally {
        setGotvLoading(false);
      }
    },
    [pushTimeline, refreshIntel, voters],
  );

  const handleImport = useCallback(
    async (file: File) => {
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
            pushTimeline("Import", `+${names.length}`);
            if (plan) showToast(`יובאו ${names.length} מצביעים`, "ok");
            void refreshSystem();
            return;
          }
          throw err;
        }

        setImportResult(result);
        pushTimeline("Import", `+${result!.imported} / dup ${result!.duplicates}`);
        setImportStatus("מרענן GOTV…");
        const plan = await refreshGotv();
        if (plan || result?.categories) {
          showToast(
            result!.imported > 0
              ? `יובאו ${result!.imported.toLocaleString("he-IL")} מצביעים`
              : `כפילויות ${result!.duplicates} · GOTV עודכן`,
            "ok",
          );
          if ((result!.osint_enriched ?? 0) > 0 && result!.osint_samples?.length) {
            setProfiles((prev) => [
              ...result!.osint_samples!.map((s) => ({
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
        void refreshSystem();
      } catch (err) {
        const msg = err instanceof ApiError || err instanceof Error ? err.message : "ייבוא נכשל";
        setImportError(msg);
        showToast(msg, "err");
      } finally {
        setImportLoading(false);
      }
    },
    [pushTimeline, refreshGotv, refreshSystem, showToast],
  );

  const handleCompare = async (a: string, b: string) => {
    setCompareLoading(true);
    setCompareError(null);
    try {
      const result = await api.compare(a, b);
      setCompareResult(result);
      pushTimeline("Compare", `${a} vs ${b}`);
      showToast("השוואה הושלמה", "info");
    } catch (err) {
      const msg = err instanceof ApiError || err instanceof Error ? err.message : "השוואה נכשלה";
      setCompareError(msg);
      showToast(msg, "err");
    } finally {
      setCompareLoading(false);
    }
  };

  const dispatchSwingBatch = useCallback(async () => {
    const rows =
      gotvPlan?.battle_plan?.top_swing ||
      gotvPlan?.voters?.filter((v) => v.category.toUpperCase() === "SWING").slice(0, 10) ||
      [];
    if (!rows.length) {
      showToast("אין מצביעי SWING לשיגור — רענן GOTV", "warning");
      return;
    }
    let ok = 0;
    for (const row of rows.slice(0, 10)) {
      try {
        await api.dispatch({
          voter_name: row.name,
          channel: row.optimal_channel || "WhatsApp",
          priority: Math.round(row.priority_score) || 70,
          message_template: "civic_duty",
        });
        ok += 1;
      } catch {
        /* continue batch */
      }
    }
    pushTimeline("Dispatch", `${ok} SWING queued`);
    showToast(`נוצרו ${ok} משימות SWING`, "ok");
    void refreshIntel();
    setView("dispatch");
  }, [gotvPlan, pushTimeline, refreshIntel, setView, showToast]);

  const exportBattleReport = useCallback(async () => {
    setReportLoading(true);
    try {
      const payload = {
        generated_at: new Date().toISOString(),
        gotv: gotvPlan,
        import: importResult,
        recommendation: { swing: swingCount, at_risk: atRiskCount },
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `blackopps-battle-report-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      const topSwing = gotvPlan?.battle_plan?.top_swing?.[0]?.name;
      if (topSwing) {
        try {
          const pdf = await api.getBriefingPdf(topSwing);
          if (pdf instanceof Blob && pdf.size > 100) {
            const pdfUrl = URL.createObjectURL(pdf);
            const link = document.createElement("a");
            link.href = pdfUrl;
            link.download = `briefing-${topSwing.replace(/\s+/g, "_")}.pdf`;
            link.click();
            URL.revokeObjectURL(pdfUrl);
          }
        } catch {
          /* JSON report still delivered */
        }
      }
      pushTimeline("Report", "Battle report");
      showToast("דו״ח מבצעי הורד", "ok");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "ייצוא נכשל", "err");
    } finally {
      setReportLoading(false);
    }
  }, [gotvPlan, importResult, pushTimeline, showToast, swingCount, atRiskCount]);

  const paletteActions: CommandAction[] = useMemo(
    () => [
      { id: "import", label: "import voters", hint: "Excel", run: () => fileInputRef.current?.click() },
      {
        id: "analyze",
        label: "analyze pasted names",
        run: () => {
          setView("intel");
          osintTextRef.current?.focus();
          void runOsint(parseManualNames(manual));
        },
      },
      { id: "gotv", label: "goto gotv", run: () => setView("gotv") },
      { id: "refresh", label: "refresh all data", run: () => void refreshGotv().then(() => refreshSystem()) },
      { id: "dispatch-swing", label: "dispatch swing batch", run: () => void dispatchSwingBatch() },
      { id: "compare", label: "compare candidates", run: () => setView("opposition") },
      { id: "export", label: "export battle report", run: () => void exportBattleReport() },
    ],
    [dispatchSwingBatch, exportBattleReport, manual, refreshGotv, refreshSystem, runOsint, setView],
  );

  useEffect(() => {
    if (!hasOperationalData && status.voterTotal > 0 && !gotvPlan) {
      void refreshGotv();
    }
  }, [hasOperationalData, status.voterTotal, gotvPlan, refreshGotv]);

  const commandCanvas = !hasOperationalData ? (
    <OnboardingHero
      voterTotal={status.voterTotal}
      onPickFile={() => fileInputRef.current?.click()}
      onPasteFocus={() => {
        setView("intel");
        window.setTimeout(() => osintTextRef.current?.focus(), 100);
      }}
    />
  ) : (
    <div className="card-stagger space-y-4">
      {importResult ? (
        <div className="glass-panel data-refreshed rounded-2xl px-4 py-3 text-sm text-emerald-100">
          ✅ יובאו {importResult.imported} · כפילויות {importResult.duplicates}
          {importResult.classified != null ? ` · סווגו ${importResult.classified}` : ""}
        </div>
      ) : null}
      <MissionMap plan={gotvPlan} loading={gotvLoading} />
      <SmartRecommendation swingCount={swingCount} atRiskCount={atRiskCount} />
      <NeighborhoodHeatMap swingTotal={swingCount} atRiskTotal={atRiskCount} safeTotal={safeCount} />
      <QuickActions
        loading={reportLoading}
        onImport={() => fileInputRef.current?.click()}
        onFocusOsint={() => {
          setView("intel");
          osintTextRef.current?.focus();
        }}
        onCompare={() => setView("opposition")}
        onDispatch={() => setView("dispatch")}
        onBattleReport={() => void exportBattleReport()}
      />
      <OperationalTimeline events={timeline} />
    </div>
  );

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv,.txt"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleImport(f);
          e.target.value = "";
        }}
      />

      <CommandShell
        topBar={
          <CommandTopBar
            status={status}
            nominal={nominal}
            activeOps={activeOps}
            onOpenPalette={() => setPaletteOpen(true)}
          />
        }
        sidebar={<CommandSidebar view={view} onChange={setView} />}
        intelPanel={
          <IntelPanel
            flash={intel.flash}
            alertTotal={intel.alertTotal}
            swingCount={intel.swingHint}
            atRiskCount={intel.atRiskHint}
            dispatch={intel.dispatch}
          />
        }
        dropOverlay={<GlobalDropOverlay active onFile={(f) => void handleImport(f)} />}
      >
        <div className="mb-3 lg:hidden">
          <CommandSidebar view={view} onChange={setView} horizontal />
        </div>

        {view === "command" ? (
          <section role="region" aria-label="חמ״ל מבצעי" className="tab-panel-enter content-auto">
            {commandCanvas}
          </section>
        ) : null}

        {view === "gotv" ? (
          <section role="region" aria-label="GOTV" className="tab-panel-enter content-auto">
            <GOTVPanel
              plan={gotvPlan}
              loading={gotvLoading}
              error={gotvError}
              onRefresh={() => void refreshGotv()}
              onImportHint={() => setView("command")}
              onDispatch={(voter) => {
                setDispatchPrefill(voter);
                setView("dispatch");
              }}
            />
          </section>
        ) : null}

        {view === "intel" ? (
          <section role="region" aria-label="מודיעין" className="tab-panel-enter content-auto space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <FileUploader
                loading={importLoading}
                statusText={importStatus}
                error={importError}
                onFile={(f) => void handleImport(f)}
                onRetry={lastFile ? () => void handleImport(lastFile) : undefined}
              />
              <div className="glass-panel rounded-3xl p-5">
                <label htmlFor="manual-names" className="mb-2 block text-sm font-semibold text-slate-200">
                  הדבקת שמות — OSINT אוטומטי
                </label>
                <textarea
                  ref={osintTextRef}
                  id="manual-names"
                  value={manual}
                  onChange={(e) => setManual(e.target.value)}
                  rows={7}
                  placeholder={"ישראל ישראלי\nשרה כהן"}
                  className="input custom-scrollbar w-full resize-y font-mono text-sm"
                />
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-xl bg-white/[0.06] px-3 py-2 text-xs text-slate-300">
                    {osintLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Radar className="h-3.5 w-3.5" />}
                    {osintLoading ? osintProgress || "מנתח…" : "OSINT אוטומטי פעיל"}
                  </span>
                  <button
                    type="button"
                    className="btn-ghost text-xs"
                    onClick={() => void runOsint(parseManualNames(manual))}
                  >
                    הרץ שוב
                  </button>
                </div>
                {osintError ? <ErrorState message={osintError} onRetry={() => void runOsint(parseManualNames(manual))} /> : null}
              </div>
            </div>
            {osintLoading && profiles.length === 0 ? <Skeleton variant="card" lines={4} /> : null}
            <OSINTResults profiles={profiles} />
            {voters.length > 0 ? <VoterTable voters={voters} /> : null}
          </section>
        ) : null}

        {view === "opposition" ? (
          <section role="region" aria-label="אופוזיציה" className="tab-panel-enter content-auto">
            <OppositionView
              result={compareResult}
              loading={compareLoading}
              error={compareError}
              onCompare={(a, b) => void handleCompare(a, b)}
              onToast={showToast}
            />
          </section>
        ) : null}

        {view === "dispatch" ? (
          <section role="region" aria-label="שיגור" className="tab-panel-enter content-auto">
            <DispatchPanel prefill={dispatchPrefill} onToast={showToast} />
          </section>
        ) : null}
      </CommandShell>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} actions={paletteActions} />

      {/* Mobile intel panel */}
      <div className="mt-4 px-2 xl:hidden">
        <IntelPanel
          flash={intel.flash}
          alertTotal={intel.alertTotal}
          swingCount={intel.swingHint}
          atRiskCount={intel.atRiskHint}
          dispatch={intel.dispatch}
        />
      </div>
    </>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<Skeleton variant="card" lines={6} className="m-4" />}>
      <DashboardInner />
    </Suspense>
  );
}
