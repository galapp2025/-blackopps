/**
 * BlackOpps UI self-audit — browser DOM checks + Node source scanner.
 */

export type AuditCheck = {
  id: string;
  name: string;
  pass: boolean;
  weight: number;
  detail?: string;
};

export type AuditReport = {
  timestamp: string;
  checks: AuditCheck[];
  score: number;
  maxScore: number;
  grade: "A+" | "B" | "C" | "F";
};

function gradeOf(score: number, max: number): AuditReport["grade"] {
  const ratio = max === 0 ? 0 : score / max;
  if (ratio >= 0.9) return "A+";
  if (ratio >= 0.7) return "B";
  if (ratio >= 0.5) return "C";
  return "F";
}

function finalize(report: AuditReport): AuditReport {
  report.score = report.checks.filter((c) => c.pass).reduce((s, c) => s + c.weight, 0);
  report.maxScore = report.checks.reduce((s, c) => s + c.weight, 0);
  report.grade = gradeOf(report.score, report.maxScore);
  return report;
}

function addCheck(report: AuditReport, name: string, pass: boolean, weight: number, detail?: string) {
  report.checks.push({
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name,
    pass,
    weight,
    detail,
  });
}

function checkStyleRules(re: RegExp, cssText: string): boolean {
  return re.test(cssText);
}

/** Browser audit — call from client after mount. */
export function auditUI(cssText?: string): AuditReport {
  const report: AuditReport = {
    timestamp: new Date().toISOString(),
    checks: [],
    score: 0,
    maxScore: 0,
    grade: "F",
  };

  if (typeof document === "undefined") {
    addCheck(report, "Browser Context", false, 1, "document unavailable");
    return finalize(report);
  }

  const styles =
    cssText ||
    Array.from(document.styleSheets)
      .map((sheet) => {
        try {
          return Array.from(sheet.cssRules || [])
            .map((r) => r.cssText)
            .join("\n");
        } catch {
          return "";
        }
      })
      .join("\n") +
      document.documentElement.outerHTML;

  const html = document.documentElement.outerHTML;

  addCheck(report, "CSS Transitions & Animations", checkStyleRules(/transition|@keyframes|animation/, styles + html), 5);
  addCheck(
    report,
    "Micro-interactions (hover/focus/active)",
    /hover:|focus:|active:|btn-press/.test(html + styles),
    5,
  );
  addCheck(report, "Glass Morphism Effects", /backdrop-blur|glass-panel|backdrop-filter/.test(html + styles), 3);
  addCheck(report, "ARIA Attributes", document.querySelectorAll("[aria-label], [aria-labelledby], [aria-describedby], [aria-current], [aria-hidden]").length > 0, 5);
  addCheck(report, "Semantic Roles", document.querySelectorAll("[role]").length > 0, 5);
  addCheck(report, "Keyboard Navigation", /tabIndex|onKeyDown|onKeyDown=|onkeydown/.test(html) || document.querySelectorAll("[tabindex]").length > 0, 5);
  addCheck(report, "Loading Skeletons", /skeleton|shimmer|animate-pulse|animate-shimmer/.test(html + styles), 5);
  addCheck(report, "Toast Notification System", /toast|Toast|notification|snackbar/.test(html), 5);
  addCheck(report, "Empty State Components", document.querySelectorAll("[data-empty]").length > 0, 4);
  addCheck(report, "Error State Components", document.querySelectorAll("[data-error]").length > 0, 4);
  addCheck(report, "Data Visualizations", /recharts|chart|radar|ChannelBar|radial|svg/.test(html), 5);
  addCheck(report, "Responsive Breakpoints", /@media|sm:|md:|lg:|xl:/.test(html + styles), 5);
  addCheck(report, "Dark Theme Completeness", /slate-950|bg-\[#0a0a0f\]|--bg-deep|#020617/.test(html + styles), 3);
  addCheck(report, "Typography Scale", /stat-mega|text-xs|text-sm|text-lg|text-2xl|text-3xl/.test(html + styles), 3);
  addCheck(report, "RTL Support", document.dir === "rtl" || /dir="rtl"|rtl:/.test(html), 5);
  addCheck(report, "CSS Content-Visibility (perf)", /content-visibility/.test(styles + html), 3);
  addCheck(report, "Visible Focus Indicators", /focus-visible:|focus:ring|\*:focus-visible/.test(html + styles), 4);
  addCheck(report, "Reduced Motion Support", /prefers-reduced-motion/.test(styles + html), 4);
  addCheck(report, "Smooth Scrolling", /scroll-behavior:\s*smooth|scroll-smooth/.test(styles + html), 2);
  addCheck(report, "Custom Selection Styling", /::selection/.test(styles + html), 2);

  return finalize(report);
}

/** Node / static source audit — used for pre/post JSON reports. */
export function auditSourceCorpus(corpus: string): AuditReport {
  const report: AuditReport = {
    timestamp: new Date().toISOString(),
    checks: [],
    score: 0,
    maxScore: 0,
    grade: "F",
  };

  addCheck(report, "CSS Transitions & Animations", /transition|@keyframes|animation/.test(corpus), 5);
  addCheck(report, "Micro-interactions (hover/focus/active)", /hover:|focus:|active:|btn-press|:active/.test(corpus), 5);
  addCheck(report, "Glass Morphism Effects", /backdrop-blur|glass-panel|backdrop-filter/.test(corpus), 3);
  addCheck(report, "ARIA Attributes", /aria-label|aria-labelledby|aria-describedby|aria-current|aria-hidden/.test(corpus), 5);
  addCheck(report, "Semantic Roles", /role=("|')(banner|navigation|main|region|contentinfo|status|alert|tablist|tab|tabpanel)/.test(corpus), 5);
  addCheck(report, "Keyboard Navigation", /tabIndex|onKeyDown|onKeyDown=/.test(corpus), 5);
  addCheck(report, "Loading Skeletons", /skeleton|shimmer|animate-pulse|animate-shimmer|Skeleton/.test(corpus), 5);
  addCheck(report, "Toast Notification System", /Toast|toast-|useToast|DispatchToast/.test(corpus), 5);
  addCheck(report, "Empty State Components", /data-empty|EmptyState/.test(corpus), 4);
  addCheck(report, "Error State Components", /data-error|ErrorState/.test(corpus), 4);
  addCheck(report, "Data Visualizations", /ComparisonRadar|ChannelBar|radial|GOTVCategoryCard|svg/.test(corpus), 5);
  addCheck(report, "Responsive Breakpoints", /@media|sm:|md:|lg:|xl:/.test(corpus), 5);
  addCheck(report, "Dark Theme Completeness", /slate-950|--bg-deep|#020617/.test(corpus), 3);
  addCheck(report, "Typography Scale", /stat-mega|text-xs|text-sm|text-lg|text-2xl|text-3xl/.test(corpus), 3);
  addCheck(report, "RTL Support", /dir=["']rtl["']|lang=["']he["']|rtl:/.test(corpus), 5);
  addCheck(report, "CSS Content-Visibility (perf)", /content-visibility/.test(corpus), 3);
  addCheck(report, "Visible Focus Indicators", /focus-visible:|focus:ring|\*:focus-visible/.test(corpus), 4);
  addCheck(report, "Reduced Motion Support", /prefers-reduced-motion/.test(corpus), 4);
  addCheck(report, "Smooth Scrolling", /scroll-behavior:\s*smooth|scroll-smooth/.test(corpus), 2);
  addCheck(report, "Custom Selection Styling", /::selection/.test(corpus), 2);

  return finalize(report);
}
