import { riskTierColor, riskTierTextColor, riskTierLabel } from "@/lib/seismic";
import type { RiskTier } from "@/lib/types";

interface Props {
  score: number | null;
  tier: RiskTier | null;
  percentile?: number | null;
  /**
   * How many regions the percentile was ranked against. Required to state the
   * percentile at all — see the note below on why.
   */
  percentileRegionCount?: number | null;
  size?: number;
}

/**
 * The single calibrated number, as a semicircular gauge.
 *
 * Three things make the reading legible that the flat arc did not:
 *
 * - Tick marks every 20 points. Without a scale, an arc filled to 60% is just
 *   a shape; with one, the reader can see where the value sits on the range.
 * - A rounded cap at the value end, so the arc terminates at a readable point
 *   rather than fading into the track.
 * - The percentile stated as its own line, because "more active than 94% of
 *   regions" is the sentence people actually repeat — the raw score is not.
 *
 * Because it is the sentence people repeat, it has to be true. This line used
 * to read "lebih aktif dari X% wilayah di Indonesia", which is a national claim
 * the number cannot support: the rank is against the regions this deployment
 * has actually scored — two dozen of them, themselves skewed towards already
 * seismic places. The count now travels with the percentile, and the percentile
 * is not shown at all without it, so the honest denominator cannot be dropped
 * by a caller that forgets to pass it.
 */
export function RiskScoreGauge({
  score,
  tier,
  percentile,
  percentileRegionCount,
  size = 200,
}: Props) {
  const fill = riskTierColor(tier);
  const text = riskTierTextColor(tier);
  const pct = Math.max(0, Math.min(100, score ?? 0)) / 100;

  const stroke = 13;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - stroke;
  const circumference = Math.PI * r; // semicircle
  const arc = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;

  // Ticks at 0/20/40/60/80/100, drawn as short radial strokes just inside the
  // track so they read as a scale rather than as extra data.
  const ticks = [0, 20, 40, 60, 80, 100].map((t) => {
    const angle = Math.PI * (1 - t / 100);
    const inner = r - stroke / 2 - 4;
    const outer = r - stroke / 2 - 1;
    return {
      t,
      x1: cx + Math.cos(angle) * inner,
      y1: cy - Math.sin(angle) * inner,
      x2: cx + Math.cos(angle) * outer,
      y2: cy - Math.sin(angle) * outer,
    };
  });

  return (
    <div className="flex flex-col items-center">
      <svg
        width={size}
        height={size / 2 + 14}
        viewBox={`0 0 ${size} ${size / 2 + 14}`}
        aria-hidden="true"
      >
        <path
          d={arc}
          fill="none"
          stroke="var(--border)"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        {ticks.map((t) => (
          <line
            key={t.t}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke="var(--border-strong)"
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        ))}
        <path
          d={arc}
          fill="none"
          stroke={fill}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference * pct} ${circumference}`}
          style={{ transition: "stroke-dasharray 700ms var(--ease-out)" }}
        />
      </svg>

      <div className="-mt-9 flex flex-col items-center">
        <span
          className="font-mono text-fluid-4 font-bold leading-none tabular-nums"
          style={{ color: text }}
        >
          {score != null ? score.toFixed(0) : "—"}
        </span>
        <span className="mt-1 text-fluid-000 uppercase tracking-[0.12em] text-text-muted">
          skor / 100
        </span>
      </div>

      <p className="mt-3 font-display text-fluid-00 font-semibold" style={{ color: text }}>
        Aktivitas {riskTierLabel(tier)}
      </p>
      {percentile != null && (
        <p className="mt-0.5 max-w-[20rem] text-center text-fluid-000 text-text-secondary">
          Lebih aktif dari{" "}
          <span className="font-mono font-medium tabular-nums text-text-primary">
            {percentile}%
          </span>{" "}
          {percentileRegionCount ? (
            <>
              dari{" "}
              <span className="font-mono font-medium tabular-nums text-text-primary">
                {percentileRegionCount}
              </span>{" "}
              wilayah
            </>
          ) : (
            "wilayah"
          )}{" "}
          yang sudah diskor di sini —{" "}
          <span className="text-text-muted">bukan seluruh Indonesia</span>
        </p>
      )}
    </div>
  );
}
