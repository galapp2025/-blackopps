"use client";

import Link from "next/link";
import { ChangeEvent, useState } from "react";

import { type AnalyzedVoter, metricsList } from "@/lib/metrics";

const demoNames = ["אברהם כהן", "מיכל לוי", "דוד מזרחי", "סביון גולדברג", "רוני אלוני"];

function buildFallbackVoters(names: string[]): AnalyzedVoter[] {
  return names.map((name, index) => {
    const metrics: Record<string, number> = {};
    metricsList.forEach((metric) => {
      metrics[metric] = Math.floor(Math.random() * 41) + 60;
    });

    return {
      id: `V-${index + 1}`,
      name,
      metrics,
      recommendations: {
        channel: index % 2 === 0 ? "WhatsApp (הודעה מותאמת)" : "שיחת טלפון אישית מנציג",
        trigger: "להדגיש יציבות כלכלית וביטחון אישי במקרו.",
        avoid: "להימנע לחלוטין מדיונים אידאולוגיים מורכבים.",
      },
    };
  });
}

export default function DashboardPage() {
  const [fileUploaded, setFileUploaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [voters, setVoters] = useState<AnalyzedVoter[]>([]);
  const [selectedVoter, setSelectedVoter] = useState<AnalyzedVoter | null>(null);

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;

    setLoading(true);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ names: demoNames }),
      });

      const data = (await response.json()) as { voters?: AnalyzedVoter[] };
      if (data.voters) {
        setVoters(data.voters);
        setSelectedVoter(data.voters[0]);
        setFileUploaded(true);
      }
    } catch (error) {
      console.error("Analysis failed, running fallback", error);
      const fallbackData = buildFallbackVoters(demoNames);
      setVoters(fallbackData);
      setSelectedVoter(fallbackData[0]);
      setFileUploaded(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 font-sans text-slate-100" dir="rtl">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">BLACKOPPS // חמ"ל ניתוח ואקשן</h1>
            <p className="mt-1 text-sm text-slate-400">
              מנוע מודיעין פסיכולוגי ומערך המלצות אופרטיבי לפי 30 נקודות נתונים
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/roadmap"
              className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-300 transition-all hover:border-red-500/50"
            >
              יכולות מבצעיות (בפיתוח) ⚡
            </Link>
          </div>
        </div>

        {!fileUploaded && (
          <div className="mx-auto my-12 flex max-w-2xl flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/40 p-16 text-center">
            <div className="mb-4 text-4xl">📊</div>
            <h3 className="mb-2 text-xl font-bold text-white">טעינת קובץ בוחרים / אקסל מבצעי</h3>
            <p className="mb-6 max-w-md text-sm text-slate-400">
              העלה את קובץ המקור כדי להריץ את מודל ה-AI ולמפות כל ישות לפי 30 נקודות הנתונים וההמלצות הטקטיות.
            </p>

            <label className="cursor-pointer rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-red-700">
              {loading ? "מריץ אנליזת AI עמוקה..." : "בחר קובץ להעלאה"}
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileUpload}
                disabled={loading}
              />
            </label>
          </div>
        )}

        {fileUploaded && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="h-[680px] overflow-y-auto rounded-xl border border-slate-800 bg-slate-900 p-4">
              <h3 className="text-md mb-4 px-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                רשימת ישויות שנותחו בקובץ
              </h3>
              <div className="space-y-2">
                {voters.map((voter) => (
                  <button
                    key={voter.id}
                    type="button"
                    onClick={() => setSelectedVoter(voter)}
                    className={`flex w-full items-center justify-between rounded-lg border p-3.5 text-right transition-all ${
                      selectedVoter?.id === voter.id
                        ? "border-red-800 bg-red-950/40 text-white"
                        : "border-slate-800/80 bg-slate-950/50 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <span className="font-bold">{voter.name}</span>
                    <span className="font-mono text-xs opacity-60">{voter.id}</span>
                  </button>
                ))}
              </div>
            </div>

            {selectedVoter && (
              <div className="gap-8 lg:col-span-2 lg:grid lg:grid-cols-3">
                <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 lg:col-span-2">
                  <h3 className="mb-4 border-b border-slate-800 pb-2 text-sm font-bold uppercase tracking-wider text-slate-400">
                    פרופיל אסטרטגי מלא: 30 נקודות מפתח ({selectedVoter.name})
                  </h3>
                  <div className="grid max-h-[550px] grid-cols-1 gap-4 overflow-y-auto pr-1 sm:grid-cols-2">
                    {Object.entries(selectedVoter.metrics).map(([name, value]) => (
                      <div key={name} className="rounded-lg border border-slate-800/60 bg-slate-950/60 p-3">
                        <div className="mb-1.5 flex justify-between text-xs">
                          <span className="font-medium text-slate-400">{name}</span>
                          <span className="font-mono font-bold text-red-400">{value}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-400"
                            style={{ width: `${value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900 p-6">
                  <div>
                    <h3 className="mb-4 flex items-center gap-2 border-b border-slate-800 pb-2 text-sm font-bold uppercase tracking-wider text-red-500">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                      המלצות פעולה אופרטיביות (AI)
                    </h3>

                    <div className="space-y-6">
                      <div>
                        <h4 className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">
                          ערוץ תקשורת אופטימלי:
                        </h4>
                        <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-sm font-bold text-white">
                          {selectedVoter.recommendations.channel}
                        </div>
                      </div>

                      <div>
                        <h4 className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">
                          טריגר מניע לפעולה:
                        </h4>
                        <p className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-sm leading-relaxed text-slate-200">
                          {selectedVoter.recommendations.trigger}
                        </p>
                      </div>

                      <div>
                        <h4 className="mb-1 text-xs font-bold uppercase tracking-wide text-red-400">
                          ממה להימנע (קווים אדומים):
                        </h4>
                        <p className="rounded-lg border border-red-900/30 bg-red-950/20 p-3 text-sm leading-relaxed text-red-200/90">
                          {selectedVoter.recommendations.avoid}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 border-t border-slate-800 pt-4">
                    <button
                      type="button"
                      onClick={() => alert("מערך ההפצה נמצא בשלב פיתוח.")}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2.5 text-xs font-bold text-white transition-all hover:bg-slate-700"
                    >
                      שגר מסר אוטומטי במערך 🚀
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
