import { riskTierColor, riskTierLabel } from "@/lib/seismic";
import type { RiskTier } from "@/lib/types";

interface Props {
  score: number | null;
  tier: RiskTier | null;
  percentile?: number | null;
  size?: number;
}

// The single calibrated number, shown as a semicircular gauge so users get a
// judgment at a glance instead of interpreting raw counts.
export function RiskScoreGauge({ score, tier, percentile, size = 180 }: Props) {
  const color = riskTierColor(tier);
  const pct = Math.max(0, Math.min(100, score ?? 0)) / 100;
  const r = size / 2 - 12;
  const circumference = Math.PI * r; // semicircle
  const dash = circumference * pct;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 12} viewBox={`0 0 ${size} ${size / 2 + 12}`}>
        {/* track */}
        <path
          d={`M 12 ${size / 2} A ${r} ${r} 0 0 1 ${size - 12} ${size / 2}`}
          fill="none"
          stroke="#3A3A3A"
          strokeWidth={12}
          strokeLinecap="round"
        />
        {/* value arc */}
        <path
          d={`M 12 ${size / 2} A ${r} ${r} 0 0 1 ${size - 12} ${size / 2}`}
          fill="none"
          stroke={color}
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
        />
      </svg>
      <div className="-mt-8 flex flex-col items-center">
        <span className="font-mono text-4xl font-bold" style={{ color }}>
          {score != null ? score.toFixed(0) : "—"}
        </span>
        <span className="text-xs text-text-muted">skor / 100</span>
      </div>
      <div className="mt-2 flex flex-col items-center">
        <span className="text-sm font-semibold" style={{ color }}>
          Aktivitas {riskTierLabel(tier)}
        </span>
        {percentile != null && (
          <span className="text-xs text-text-secondary">
            Lebih aktif dari {percentile}% wilayah
          </span>
        )}
      </div>
    </div>
  );
}
