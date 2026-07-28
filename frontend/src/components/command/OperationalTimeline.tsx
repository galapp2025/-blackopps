"use client";

export type TimelineEvent = {
  id: string;
  time: string;
  label: string;
  detail?: string;
};

type OperationalTimelineProps = {
  events: TimelineEvent[];
};

export function OperationalTimeline({ events }: OperationalTimelineProps) {
  if (!events.length) return null;
  return (
    <div className="glass-panel rounded-2xl p-4">
      <p className="tactical-header mb-3">Timeline</p>
      <div className="relative flex items-center justify-between gap-1 overflow-x-auto pb-2">
        {events.map((ev, i) => (
          <div key={ev.id} className="flex min-w-[4.5rem] flex-1 flex-col items-center text-center">
            <div className={`h-2 w-2 rounded-full ${i === events.length - 1 ? "bg-red-400 live-indicator" : "bg-slate-500"}`} />
            <p className="mt-2 font-mono text-[10px] text-slate-500">{ev.time}</p>
            <p className="command-text mt-1 text-[11px] text-slate-300">{ev.label}</p>
            {ev.detail ? <p className="text-[10px] text-slate-500">{ev.detail}</p> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
