"use client";

type SmartRecommendationProps = {
  swingCount: number;
  atRiskCount: number;
};

export function SmartRecommendation({ swingCount, atRiskCount }: SmartRecommendationProps) {
  if (swingCount <= 0 && atRiskCount <= 0) return null;

  const top = Math.min(50, swingCount);
  const rest = Math.max(0, swingCount - top);
  const volunteers = Math.max(1, Math.ceil(swingCount / 25));

  return (
    <div className="glass-panel rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
      <p className="tactical-header text-cyan-300/90">המלצה אופרטיבית</p>
      <p className="command-text mt-2 text-sm leading-relaxed text-slate-200">
        זוהו <strong>{swingCount.toLocaleString("he-IL")}</strong> מצביעי SWING
        {atRiskCount > 0 ? ` ו-${atRiskCount.toLocaleString("he-IL")} AT_RISK` : ""}. מומלץ WhatsApp מיידי ל-
        {top} בעדיפות גבוהה, ואז phone bank ל-{rest} הנותרים. הערכת שטח: ~{volunteers} מתנדבים × 3 שעות.
      </p>
    </div>
  );
}
