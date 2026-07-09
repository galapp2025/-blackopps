import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

import { AppShell } from "@/components/AppShell";

const roadmapItems = [
  {
    id: "01",
    title: "מנוע הפצה אוטומטי בלחיצת כפתור (Omnichannel Execution)",
    description:
      "מעבר מהמלצה ביצועית לפעולה מיידית. חיבור ישיר ל-APIs של WhatsApp, SMS ומערכות דיוור לשילוח מסרים מותאמים אישית בלחיצת כפתור אחת מהמערכת.",
    status: "Pipeline",
    tone: "bg-cyan-500/10 text-cyan-300 ring-cyan-500/20",
  },
  {
    id: "02",
    title: "אופטימיזציית מסרים בלולאה סגורה (AI Message A/B Testing)",
    description:
      "מנגנון למידה אקטיבי שמנתח את אחוזי המענה והתגובה של הבוחרים בשטח, ומעדכן אוטומטית את מודל ה-AI כדי לחדד את טון הדיבור והטקטיקה הפסיכולוגית הבאה.",
    status: "Pipeline",
    tone: "bg-cyan-500/10 text-cyan-300 ring-cyan-500/20",
  },
  {
    id: "03",
    title: "הזרמת דאטה והעשרה בזמן אמת (Real-time Data Enrichment)",
    description:
      "סריקה והצלבת מידע אוטומטית (OSINT) מרשתות חברתיות ופעילות דיגיטלית ציבורית, כדי להשלים ולעדכן את 24 נקודות המידע על הבוחר ללא צורך בריענון ידני של האקסל.",
    status: "R&D Phase",
    tone: "bg-violet-500/10 text-violet-300 ring-violet-500/20",
  },
  {
    id: "04",
    title: "סימולטור תרחישים וחיזוי תוצאות (Predictive Simulator)",
    description:
      "הרצת 'משחקי מלחמה' אסטרטגיים על בסיס הדאטה הקיים. ניבוי אחוזי הצלחה ותגובת קהל היעד למהלכים פוליטיים או עסקיים עוד לפני שהושקע שקל אחד בשטח.",
    status: "R&D Phase",
    tone: "bg-violet-500/10 text-violet-300 ring-violet-500/20",
  },
  {
    id: "05",
    title: "ניהול משימות שטח חכם לנציגים (AI Task Routing)",
    description:
      "מערכת ניהול משימות מבוססת מיקום ופרופיל עבור פעילים בשטח. הנציג מקבל לנייד רשימת יעדים מדויקת עם הנחיות ברורות: 'מה להגיד למי, וממה להימנע' בכל דלת.",
    status: "Pipeline",
    tone: "bg-cyan-500/10 text-cyan-300 ring-cyan-500/20",
  },
  {
    id: "06",
    title: "זיהוי אנומליות ונקודות תפנית (Micro-Targeting Flash Alerts)",
    description:
      "אלגוריתם הסורק אלפי שורות בזמן אמת ומקפיץ התרעות חמות על קבוצות בוחרים בעלות נקודות תורפה משותפות, המהוות חלון הזדמנות קריטי לשינוי דעה או הנעה לפעולה.",
    status: "Specs Ready",
    tone: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20",
  },
];

export default function RoadmapPage() {
  return (
    <AppShell active="roadmap" subtitle="ארסנל יכולות מבצעיות והנעה לפעולה">
      <div className="animate-fade-up mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300 ring-1 ring-red-500/20">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
            BlackOpps Strategic Vision
          </div>
          <h2 className="text-gradient text-3xl font-extrabold tracking-tight sm:text-4xl">
            ארסנל יכולות מבצעיות והנעה לפעולה
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-400 sm:text-base">
            הפיכת כלי הניתוח המודיעיני לפלטפורמת השפעה והנעה לפעולה אקטיבית, אוטונומית ומבוססת דאטה בזמן אמת.
          </p>
        </div>
        <Link href="/" className="btn-secondary self-start">
          <ArrowLeft className="h-4 w-4" />
          חזרה לדשבורד
        </Link>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {roadmapItems.map((item, index) => (
          <article
            key={item.id}
            className="glass-panel group animate-fade-up rounded-3xl p-6 transition-all hover:-translate-y-1 hover:border-white/10"
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <span className="font-mono text-2xl font-bold text-slate-600 transition-colors group-hover:text-red-400">
                {item.id}
              </span>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${item.tone}`}>
                {item.status}
              </span>
            </div>
            <h3 className="mb-2 text-lg font-bold leading-snug text-white">{item.title}</h3>
            <p className="text-sm leading-relaxed text-slate-400">{item.description}</p>
          </article>
        ))}
      </div>

      <div className="glass-panel-strong animate-fade-up-delay mt-8 rounded-3xl p-6 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 ring-1 ring-red-500/20">
          <Sparkles className="h-5 w-5 text-red-400" />
        </div>
        <p className="text-sm leading-relaxed text-slate-400">
          כל היכולות מתוכננות להתממשק ישירות לפרופיל ה-30 נקודות הקיים במערכת, תוך שמירה על ארכיטקטורת AI מבוזרת
          ומאובטחת.
        </p>
      </div>
    </AppShell>
  );
}
