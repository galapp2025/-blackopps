import { AlertTriangle, BellRing, MessageSquare, Rocket, Sparkles, Target } from "lucide-react";

import { type AnalyzedVoter } from "@/lib/metrics";

type ActionPanelProps = {
  voter: AnalyzedVoter;
  onDispatch: () => void;
};

export function ActionPanel({ voter, onDispatch }: ActionPanelProps) {
  return (
    <section className="glass-panel-strong flex flex-col justify-between rounded-3xl p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-white/5 pb-4">
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
          <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-red-400">המלצות פעולה AI</h3>
        </div>

        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-300">
            <BellRing className="h-3.5 w-3.5" />
            Micro-Targeting Flash Alert
          </div>
          <p className="text-sm leading-relaxed text-amber-100/90">{voter.operational.flashAlert}</p>
        </div>

        <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <MessageSquare className="h-3.5 w-3.5" />
            ערוץ תקשורת מועדף
          </div>
          <p className="text-sm font-semibold leading-relaxed text-white">{voter.recommendations.channel}</p>
        </div>

        <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <Target className="h-3.5 w-3.5" />
            טריגר פסיכולוגי מניע לפעולה
          </div>
          <p className="text-sm leading-relaxed text-slate-200">{voter.recommendations.trigger}</p>
        </div>

        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-cyan-300">
            <Sparkles className="h-3.5 w-3.5" />
            Omnichannel Message
          </div>
          <p className="text-sm leading-relaxed text-slate-100">{voter.operational.actionableMessage}</p>
        </div>

        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-red-300">
            <AlertTriangle className="h-3.5 w-3.5" />
            קווים אדומים (ממה להימנע)
          </div>
          <p className="text-sm leading-relaxed text-red-100/90">{voter.recommendations.avoid}</p>
        </div>
      </div>

      <div className="mt-6 space-y-3 border-t border-white/5 pt-5">
        <button type="button" onClick={onDispatch} className="btn-primary w-full">
          <Rocket className="h-4 w-4" />
          שגר מסר אוטומטי במערך
        </button>
      </div>
    </section>
  );
}
