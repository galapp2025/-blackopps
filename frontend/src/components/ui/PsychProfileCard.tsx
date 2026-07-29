"use client";

import { useEffect, useState } from "react";

import { ErrorState } from "@/components/ErrorState";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Skeleton } from "@/components/ui/Skeleton";
import { api, ApiError } from "@/lib/api";
import type { PsychoProfileResult } from "@/lib/types/features78";

const traitLabels: Record<string, string> = {
  openness: "פתיחות",
  conscientiousness: "מצפוניות",
  extraversion: "מוחצנות",
  agreeableness: "נעימות",
  neuroticism: "יציבות רגשית",
};

type PsychProfileCardProps = {
  voterId: string;
};

export function PsychProfileCard({ voterId }: PsychProfileCardProps) {
  const [profile, setProfile] = useState<PsychoProfileResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!voterId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const data = await api.psychoProfile(voterId);
        if (!cancelled) setProfile(data);
      } catch (err) {
        if (!cancelled) {
          setProfile(null);
          setError(err instanceof ApiError ? err.message : "לא ניתן לטעון פרופיל");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [voterId]);

  if (loading) {
    return (
      <GlassPanel className="space-y-4 p-6" dir="rtl">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
      </GlassPanel>
    );
  }

  if (error || !profile) {
    return <ErrorState message={error || "לא ניתן לטעון פרופיל"} />;
  }

  const p = profile.profile;

  return (
    <GlassPanel className="animate-scale-in space-y-5 p-6" dir="rtl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-white">{profile.full_name}</h3>
          <p className="text-sm text-slate-400">
            {profile.neighborhood} · {profile.gotv_category} · גיל {profile.age}
          </p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-300">
          ביטחון {(profile.confidence * 100).toFixed(0)}%
        </span>
      </div>

      <div className="glass-card rounded-2xl border border-white/5 bg-white/[0.03] p-4">
        <h4 className="mb-2 text-sm font-semibold text-slate-300">מעמד סוציו-אקונומי</h4>
        <div className="flex items-center gap-3">
          <div className="text-2xl font-bold text-blue-300">{p.socio_economic.tier}/10</div>
          <div className="text-sm text-slate-400">
            <div>{p.socio_economic.estimated_income_range}</div>
            <div>
              {p.socio_economic.likely_profession} · {p.socio_economic.education_level}
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl border border-white/5 bg-white/[0.03] p-4">
        <h4 className="mb-3 text-sm font-semibold text-slate-300">פרופיל אישיותי (Big Five)</h4>
        {Object.entries(p.personality.big_five).map(([trait, value]) => {
          const display =
            trait === "neuroticism" ? Math.round((1 - Number(value)) * 100) : Math.round(Number(value) * 100);
          const width = trait === "neuroticism" ? (1 - Number(value)) * 100 : Number(value) * 100;
          return (
            <div key={trait} className="mb-2 flex items-center justify-between">
              <span className="w-24 text-xs text-slate-400">{traitLabels[trait] || trait}</span>
              <div className="mx-3 h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-l from-sky-500 to-cyan-400"
                  style={{ width: `${width}%`, transition: "width 1s ease-out" }}
                />
              </div>
              <span className="w-8 text-right text-xs text-slate-300">{display}</span>
            </div>
          );
        })}
      </div>

      <div className="glass-card rounded-2xl border border-white/5 bg-white/[0.03] p-4">
        <h4 className="mb-2 text-sm font-semibold text-slate-300">מנופי שכנוע</h4>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-green-500/20 bg-green-500/10 px-2 py-1 text-xs text-green-300">
            {p.persuasion.primary_lever}
          </span>
          <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-1 text-xs text-blue-300">
            {p.persuasion.secondary_lever}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">רתיעה מאובדן</span>
            <span className="text-red-300">{(p.persuasion.loss_aversion_sensitivity * 100).toFixed(0)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">הוכחה חברתית</span>
            <span className="text-slate-300">{(p.persuasion.social_proof_weight * 100).toFixed(0)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">סמכות</span>
            <span className="text-slate-300">{(p.persuasion.authority_weight * 100).toFixed(0)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">הדדיות</span>
            <span className="text-slate-300">{(p.persuasion.reciprocity_weight * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl border border-white/5 border-r-2 border-r-blue-500/30 bg-white/[0.03] p-4">
        <h4 className="mb-2 text-sm font-semibold text-blue-300">איך לפנות</h4>
        <div className="space-y-2 text-sm text-slate-300">
          <div>
            <span className="text-slate-500">טון: </span>
            {p.recommended_approach.tone}
          </div>
          <div>
            <span className="text-slate-500">ערוץ: </span>
            {p.recommended_approach.best_channel}
          </div>
          <div>
            <span className="text-slate-500">פתיחה: </span>
            {p.recommended_approach.opening_strategy}
          </div>
          <div>
            <span className="text-slate-500">נושאים: </span>
            {p.recommended_approach.topics_to_emphasize.map((t) => (
              <span key={t} className="mr-1 inline-block rounded bg-green-500/5 px-1.5 py-0.5 text-green-300">
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card rounded-2xl border border-white/5 bg-white/[0.03] p-3 text-center">
          <div className="text-lg font-bold text-green-300">{(p.loyalty.loyalty_score * 100).toFixed(0)}%</div>
          <div className="text-xs text-slate-500">נאמנות</div>
        </div>
        <div className="glass-card rounded-2xl border border-white/5 bg-white/[0.03] p-3 text-center">
          <div className="text-lg font-bold text-yellow-300">{(p.loyalty.volatility_score * 100).toFixed(0)}%</div>
          <div className="text-xs text-slate-500">תנודתיות</div>
        </div>
        <div className="glass-card rounded-2xl border border-white/5 bg-white/[0.03] p-3 text-center">
          <div className="text-lg font-bold text-blue-300">
            {(p.loyalty.influenceability_score * 100).toFixed(0)}%
          </div>
          <div className="text-xs text-slate-500">השפעה</div>
        </div>
      </div>
    </GlassPanel>
  );
}
