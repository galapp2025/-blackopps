const roadmapItems = [
  {
    id: "01",
    title: "מנוע הפצה אוטומטי בלחיצת כפתור (Omnichannel Execution)",
    description:
      "מעבר מהמלצה ביצועית לפעולה מיידית. חיבור ישיר ל-APIs של WhatsApp, SMS ומערכות דיוור לשילוח מסרים מותאמים אישית בלחיצת כפתור אחת מהמערכת.",
    status: "Pipeline",
  },
  {
    id: "02",
    title: "אופטימיזציית מסרים בלולאה סגורה (AI Message A/B Testing)",
    description:
      "מנגנון למידה אקטיבי שמנתח את אחוזי המענה והתגובה של הבוחרים בשטח, ומעדכן אוטומטית את מודל ה-AI כדי לחדד את טון הדיבור והטקטיקה הפסיכולוגית הבאה.",
    status: "Pipeline",
  },
  {
    id: "03",
    title: "הזרמת דאטה והעשרה בזמן אמת (Real-time Data Enrichment)",
    description:
      "סריקה והצלבת מידע אוטומטית (OSINT) מרשתות חברתיות ופעילות דיגיטלית ציבורית, כדי להשלים ולעדכן את 24 נקודות המידע על הבוחר ללא צורך בריענון ידני של האקסל.",
    status: "R&D Phase",
  },
  {
    id: "04",
    title: "סימולטור תרחישים וחיזוי תוצאות (Predictive Simulator)",
    description:
      "הרצת 'משחקי מלחמה' אסטרטגיים על בסיס הדאטה הקיים. ניבוי אחוזי הצלחה ותגובת קהל היעד למהלכים פוליטיים או עסקיים עוד לפני שהושקע שקל אחד בשטח.",
    status: "R&D Phase",
  },
  {
    id: "05",
    title: "ניהול משימות שטח חכם לנציגים (AI Task Routing)",
    description:
      "מערכת ניהול משימות מבוססת מיקום ופרופיל עבור פעילים בשטח. הנציג מקבל לנייד רשימת יעדים מדויקת עם הנחיות ברורות: 'מה להגיד למי, וממה להימנע' בכל דלת.",
    status: "Pipeline",
  },
  {
    id: "06",
    title: "זיהוי אנומליות ונקודות תפנית (Micro-Targeting Flash Alerts)",
    description:
      "אלגוריתם הסורק אלפי שורות בזמן אמת ומקפיץ התרעות חמות על קבוצות בוחרים בעלות נקודות תורפה משותפות, המהוות חלון הזדמנות קריטי לשינוי דעה או הנעה לפעולה.",
    status: "Specs Ready",
  },
];

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-slate-950 p-8 font-sans text-slate-100" dir="rtl">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 border-b border-slate-800 pb-6">
          <div className="mb-2 flex items-center gap-3 font-mono text-sm uppercase tracking-wider text-red-500">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            BlackOpps Strategic Vision
          </div>
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-white">
            ארסנל יכולות מבצעיות והנעה לפעולה
          </h1>
          <p className="max-w-3xl text-lg text-slate-400">
            הפיכת כלי הניתוח המודיעיני לפלטפורמת השפעה והנעה לפעולה אקטיבית, אוטונומית ומבוססת דאטה בזמן
            אמת.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {roadmapItems.map((item) => (
            <div
              key={item.id}
              className="group relative rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl transition-all duration-300 hover:border-slate-700"
            >
              <div className="mb-4 flex items-start justify-between">
                <span className="font-mono text-xl font-bold text-slate-700 transition-colors group-hover:text-red-500">
                  {item.id}
                </span>
                <span className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-1 font-mono text-xs text-slate-400">
                  {item.status}
                </span>
              </div>

              <h3 className="mb-2 text-xl font-bold text-slate-100 group-hover:text-white">{item.title}</h3>

              <p className="text-sm leading-relaxed text-slate-400">{item.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-xl border border-red-900/30 bg-gradient-to-r from-red-950/20 to-slate-900 p-6 text-center">
          <p className="text-sm text-slate-400">
            כל היכולות מתוכננות להתממשק ישירות לפרופיל ה-24 נקודות הקיים במערכת, תוך שמירה על ארכיטקטורת AI
            מבוזרת ומאובטחת.
          </p>
        </div>
      </div>
    </div>
  );
}
