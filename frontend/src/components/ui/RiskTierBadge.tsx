import { riskTierColor, riskTierTextColor, riskTierLabel } from "@/lib/seismic";
import type { RiskTier } from "@/lib/types";

interface Props {
  tier: RiskTier | null;
  /** Optional prefix, e.g. "Risiko Tsunami". */
  label?: string;
  size?: "sm" | "md";
}

/**
 * LOW / MODERATE / HIGH pill.
 *
 * Text uses the lightened tier tone and the dot uses the solid one: the dot is
 * a shape, so it can afford the darker, more saturated colour, while the label
 * has to clear contrast as small text on charcoal.
 */
export function RiskTierBadge({ tier, label, size = "md" }: Props) {
  const dot = riskTierColor(tier);
  const text = riskTierTextColor(tier);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${
        size === "sm" ? "px-2.5 py-0.5 text-fluid-000" : "px-3 py-1 text-fluid-000"
      }`}
      style={{
        backgroundColor: `${dot}1f`,
        color: text,
        border: `1px solid ${dot}55`,
      }}
    >
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: dot }}
      />
      {label ? `${label}: ` : ""}
      {riskTierLabel(tier)}
    </span>
  );
}
