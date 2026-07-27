import { TierBadge } from "@/components/ui/TierBadge";
import { compositeScoreTone, initialsFromName, tierStyles } from "@/lib/tierStyles";
import type { DashboardEntity } from "@/lib/types/dashboard";

type EntityHeroProps = {
  entity: DashboardEntity;
};

export function EntityHero({ entity }: EntityHeroProps) {
  const composite = Math.round(entity.profile.scores.composite);
  const ring = tierStyles(entity.profile.tier).ring;
  const confidence = Math.round(entity.profile.confidence * 100);

  return (
    <div className="glass-panel-strong animate-fade-up overflow-hidden rounded-3xl p-5 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${ring} text-lg font-bold text-white shadow-lg shadow-black/30`}
            aria-hidden
          >
            {initialsFromName(entity.name)}
          </div>
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">{entity.name}</h2>
              <TierBadge tier={entity.profile.tier} />
            </div>
            <p className="font-mono text-xs text-slate-500">{entity.id}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 sm:gap-8">
          <div className="text-center sm:text-left">
            <p className="section-eyebrow mb-0.5">ציון מורכב</p>
            <p className={`font-mono text-3xl font-black tabular-nums ${compositeScoreTone(composite)}`}>
              {composite}
            </p>
          </div>
          <div
            className="relative mx-auto h-16 w-16 sm:mx-0"
            role="img"
            aria-label={`ביטחון מודל ${confidence} אחוז`}
          >
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: `conic-gradient(#22d3ee ${confidence}%, rgba(30,41,59,0.9) 0)`,
              }}
            />
            <div className="absolute inset-[5px] flex items-center justify-center rounded-full bg-slate-950 text-[11px] font-semibold text-cyan-300">
              {confidence}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
