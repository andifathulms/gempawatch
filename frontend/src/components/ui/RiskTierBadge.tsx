import { riskTierColor, riskTierLabel } from "@/lib/seismic";
import type { RiskTier } from "@/lib/types";

interface Props {
  tier: RiskTier | null;
  /** Optional prefix, e.g. "Risiko Tsunami". */
  label?: string;
}

// LOW / MODERATE / HIGH pill. Used sparingly — HIGH (red) only where warranted.
export function RiskTierBadge({ tier, label }: Props) {
  const color = riskTierColor(tier);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
      style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}55` }}
    >
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {label ? `${label}: ` : ""}
      {riskTierLabel(tier)}
    </span>
  );
}
