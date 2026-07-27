"use client";

type ComparisonRadarProps = {
  aName: string;
  bName: string;
  aDims: Record<string, number>;
  bDims: Record<string, number>;
};

const AXES = [
  { key: "political", label: "פוליטי" },
  { key: "community", label: "קהילתי" },
  { key: "voter", label: "בוחר" },
  { key: "financial", label: "פיננסי" },
] as const;

function point(cx: number, cy: number, r: number, i: number, n: number, value: number) {
  const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const rr = (Math.max(0, Math.min(100, value)) / 100) * r;
  return [cx + rr * Math.cos(angle), cy + rr * Math.sin(angle)] as const;
}

function polygon(cx: number, cy: number, r: number, dims: Record<string, number>) {
  return AXES.map((a, i) => point(cx, cy, r, i, AXES.length, dims[a.key] ?? 0).join(",")).join(" ");
}

export function ComparisonRadar({ aName, bName, aDims, bDims }: ComparisonRadarProps) {
  const cx = 100;
  const cy = 100;
  const r = 70;

  return (
    <div className="glass-panel rounded-3xl p-5">
      <h3 className="mb-3 text-sm font-semibold text-white">מפת ממדים</h3>
      <div className="mx-auto max-w-sm">
        <svg viewBox="0 0 200 200" className="h-auto w-full" role="img" aria-label="השוואת ממדים רדאר">
          {[0.25, 0.5, 0.75, 1].map((t) => (
            <polygon
              key={t}
              points={AXES.map((_, i) => point(cx, cy, r * t, i, AXES.length, 100).join(",")).join(" ")}
              fill="none"
              stroke="rgba(148,163,184,0.2)"
              strokeWidth="1"
            />
          ))}
          {AXES.map((a, i) => {
            const [x, y] = point(cx, cy, r, i, AXES.length, 100);
            return (
              <g key={a.key}>
                <line x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(148,163,184,0.25)" />
                <text x={x} y={y} dy={y < cy ? -6 : 14} textAnchor="middle" fill="#94a3b8" fontSize="8">
                  {a.label}
                </text>
              </g>
            );
          })}
          <polygon
            className="radar-draw"
            points={polygon(cx, cy, r, aDims)}
            fill="rgba(239,68,68,0.25)"
            stroke="#ef4444"
            strokeWidth="1.5"
          />
          <polygon
            className="radar-draw"
            style={{ animationDelay: "120ms" }}
            points={polygon(cx, cy, r, bDims)}
            fill="rgba(34,211,238,0.2)"
            stroke="#22d3ee"
            strokeWidth="1.5"
          />
        </svg>
      </div>
      <div className="mt-2 flex justify-center gap-4 text-xs">
        <span className="text-red-300">● {aName}</span>
        <span className="text-cyan-300">● {bName}</span>
      </div>
    </div>
  );
}
