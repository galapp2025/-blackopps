import { tierStyles } from "@/lib/tierStyles";

type TierBadgeProps = {
  tier: string;
  className?: string;
};

export function TierBadge({ tier, className = "" }: TierBadgeProps) {
  const styles = tierStyles(tier);
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${styles.badge} ${className}`}
    >
      {tier}
    </span>
  );
}
