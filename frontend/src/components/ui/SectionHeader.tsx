import type { LucideIcon } from "lucide-react";

type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  icon?: LucideIcon;
  trailing?: React.ReactNode;
};

export function SectionHeader({ eyebrow, title, icon: Icon, trailing }: SectionHeaderProps) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.06] pb-4">
      <div className="flex min-w-0 items-center gap-3">
        {Icon ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] ring-1 ring-white/[0.08]">
            <Icon className="h-5 w-5 text-red-400" aria-hidden />
          </div>
        ) : null}
        <div className="min-w-0">
          <p className="section-eyebrow">{eyebrow}</p>
          <h3 className="truncate text-lg font-semibold tracking-tight text-white">{title}</h3>
        </div>
      </div>
      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </div>
  );
}
