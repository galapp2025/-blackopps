"use client";

/** Simplified Petah Tikva neighborhood heat — proportional blocks */
const BLOCKS = [
  { id: "center", label: "מרכז", weight: 0.22 },
  { id: "north", label: "צפון", weight: 0.18 },
  { id: "east", label: "מזרח", weight: 0.2 },
  { id: "west", label: "מערב", weight: 0.2 },
  { id: "south", label: "דרום", weight: 0.2 },
];

type NeighborhoodHeatMapProps = {
  swingTotal: number;
  atRiskTotal: number;
  safeTotal: number;
};

export function NeighborhoodHeatMap({ swingTotal, atRiskTotal, safeTotal }: NeighborhoodHeatMapProps) {
  const total = Math.max(1, swingTotal + atRiskTotal + safeTotal);
  const swingRatio = swingTotal / total;

  return (
    <div className="glass-panel rounded-2xl p-4">
      <p className="tactical-header mb-2">Battleground — פתח תקווה</p>
      <svg viewBox="0 0 200 120" className="h-auto w-full" role="img" aria-label="מפת שכונות">
        {BLOCKS.map((b, i) => {
          const x = (i % 3) * 66 + 4;
          const y = i < 3 ? 8 : 64;
          const intensity = swingRatio + (i % 3) * 0.08;
          const fill =
            intensity > 0.35
              ? "rgba(245, 158, 11, 0.55)"
              : intensity > 0.2
                ? "rgba(239, 68, 68, 0.35)"
                : "rgba(16, 185, 129, 0.35)";
          return (
            <g key={b.id}>
              <rect
                x={x}
                y={y}
                width={58}
                height={48}
                rx={6}
                fill={fill}
                className={intensity > 0.3 ? "animate-pulse-soft" : undefined}
              />
              <text x={x + 29} y={y + 28} textAnchor="middle" fill="#e2e8f0" fontSize="9">
                {b.label}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="mt-2 text-[11px] text-slate-500">ירוק = SAFE · כתום = SWING · אדום = AT_RISK (היוריסטי)</p>
    </div>
  );
}
