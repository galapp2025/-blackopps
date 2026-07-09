export const operationalCapabilities = [
  {
    id: "01",
    title: "מנוע הפצה אוטומטי בלחיצת כפתור (Omnichannel Execution)",
    status: "ACTIVE // מבצעי",
    statusColor: "text-green-400 border-green-500/30 bg-green-950/20",
    desc: "מעבר מהמלצה ביצועית לפעולה מיידית. חיבור ישיר ל-APIs של WhatsApp, SMS ומערכות דיוור לשילוח מסרים מותאמים אישית בלחיצת כפתור אחת מהמערכת.",
  },
  {
    id: "02",
    title: "אופטימיזציית מסרים בלולאה סגורה (AI Message A/B Testing)",
    status: "ACTIVE // מבצעי",
    statusColor: "text-green-400 border-green-500/30 bg-green-950/20",
    desc: "מנגנון למידה אקטיבי שמנתח את אחוזי המענה והתגובה של הבוחרים בשטח, ומעדכן אוטומטית את מודל ה-AI כדי לחדד את טון הדיבור והטקטיקה הפסיכולוגית הבאה.",
  },
  {
    id: "03",
    title: "הזרמת דאטה והעשרה בזמן אמת (Real-time Data Enrichment)",
    status: "ACTIVE // מבצעי",
    statusColor: "text-green-400 border-green-500/30 bg-green-950/20",
    desc: "סריקה והצלבת מידע אוטומטית (OSINT) מרשתות חברתיות ופעילות דיגיטלית ציבורית, כדי להשלים ולעדכן את 30 נקודות המידע על הבוחר ללא צורך בריענון ידני של האקסל.",
  },
  {
    id: "04",
    title: "סימולטור תרחישים וחיזוי תוצאות (Predictive Simulator)",
    status: "ACTIVE // מבצעי",
    statusColor: "text-green-400 border-green-500/30 bg-green-950/20",
    desc: "הרצת 'משחקי מלחמה' אסטרטגיים על בסיס הדאטה הקיים. ניבוי אחוזי הצלחה ותגובת קהל היעד למהלכים פוליטיים או עסקיים עוד לפני שהושקע שקל אחד בשטח.",
  },
  {
    id: "05",
    title: "ניהול משימות שטח חכם לנציגים (AI Task Routing)",
    status: "ACTIVE // מבצעי",
    statusColor: "text-green-400 border-green-500/30 bg-green-950/20",
    desc: "מערכת ניהול משימות מבוססת מיקום ופרופיל עבור פעילים בשטח. הנציג מקבל לנייד רשימת יעדים מדויקת עם הנחיות ברורות: 'מה להגיד למי, וממה להימנע' בכל דלת.",
  },
  {
    id: "06",
    title: "זיהוי אנומליות ונקודות תפנית (Micro-Targeting Flash Alerts)",
    status: "ACTIVE // מבצעי",
    statusColor: "text-green-400 border-green-500/30 bg-green-950/20",
    desc: "אלגוריתם הסורק אלפי שורות בזמן אמת ומקפיץ התרעות חמות על קבוצות בוחרים בעלות נקודות תורפה משותפות, המהוות חלון הזדמנות קריטי לשינוי דעה או הנעה לפעולה.",
  },
] as const;

export type OperationalCapability = (typeof operationalCapabilities)[number];
