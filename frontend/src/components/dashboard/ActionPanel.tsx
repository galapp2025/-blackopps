"use client";

import { AlertTriangle, BellRing, Copy, MessageSquare, Rocket, Sparkles, Target } from "lucide-react";
import { useState } from "react";

import { SectionHeader } from "@/components/ui/SectionHeader";
import { type DashboardEntity } from "@/lib/types/dashboard";

type ActionPanelProps = {
  voter: DashboardEntity;
  onDispatch: () => void;
};

function ActionCard({
  icon: Icon,
  label,
  children,
  variant = "default",
}: {
  icon: typeof BellRing;
  label: string;
  children: React.ReactNode;
  variant?: "default" | "amber" | "cyan" | "danger";
}) {
  const styles = {
    default: "border-white/[0.06] bg-slate-950/50",
    amber: "border-amber-500/20 bg-amber-500/[0.04]",
    cyan: "border-cyan-500/20 bg-cyan-500/[0.04]",
    danger: "border-red-500/20 bg-red-500/[0.04]",
  };
  const labelTone = {
    default: "text-slate-400",
    amber: "text-amber-300",
    cyan: "text-cyan-300",
    danger: "text-red-300",
  };

  return (
    <div className={`rounded-2xl border p-4 ${styles[variant]}`}>
      <div className={`mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide ${labelTone[variant]}`}>
        <Icon className="h-3.5 w-3.5" aria-hidden />
        {label}
      </div>
      <div className="text-sm leading-relaxed text-slate-200">{children}</div>
    </div>
  );
}

export function ActionPanel({ voter, onDispatch }: ActionPanelProps) {
  const [copied, setCopied] = useState(false);

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(voter.operational.actionableMessage);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="glass-panel-strong flex flex-col rounded-3xl p-6 lg:max-h-[min(720px,calc(100vh-12rem))]">
      <SectionHeader
        eyebrow="המלצות פעולה"
        title="AI Ops"
        trailing={
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-red-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
            פעיל
          </span>
        }
      />

      <div className="custom-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        <ActionCard icon={BellRing} label="התרעת מיקרו-טארגט" variant="amber">
          <p className="text-amber-100/95">{voter.operational.flashAlert}</p>
        </ActionCard>

        <ActionCard icon={MessageSquare} label="ערוץ מועדף">
          <p className="font-semibold text-white">{voter.operational.channel}</p>
        </ActionCard>

        <ActionCard icon={Target} label="טריגר פסיכולוגי">
          {voter.operational.trigger}
        </ActionCard>

        <ActionCard icon={Sparkles} label="מסר אומניצ'אנל" variant="cyan">
          <p className="text-slate-100">{voter.operational.actionableMessage}</p>
          <button type="button" onClick={() => void copyMessage()} className="btn-ghost mt-3 !px-2 !py-1.5 text-xs">
            <Copy className="h-3.5 w-3.5" aria-hidden />
            {copied ? "הועתק" : "העתק מסר"}
          </button>
        </ActionCard>

        <ActionCard icon={AlertTriangle} label="קווים אדומים" variant="danger">
          <p className="text-red-100/90">{voter.operational.avoid}</p>
        </ActionCard>
      </div>

      <div className="mt-5 shrink-0 space-y-2 border-t border-white/[0.06] pt-5">
        <button type="button" onClick={onDispatch} className="btn-primary w-full">
          <Rocket className="h-4 w-4" aria-hidden />
          שלח לתור הפצה
        </button>
        <p className="text-center text-[10px] text-slate-500">המסר יועתק ללוח וייכנס ל-Redis dispatch</p>
      </div>
    </section>
  );
}
