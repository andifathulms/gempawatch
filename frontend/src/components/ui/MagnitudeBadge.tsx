import { magnitudeSize, depthColor, onFillTextColor } from "@/lib/seismic";

interface Props {
  magnitude: number;
  depthKm: number;
  /** Fixed pixel size override (e.g. small inline badges). */
  size?: number;
}

/**
 * Signature element: size encodes magnitude, colour encodes depth.
 *
 * The soft outer ring is drawn in the same hue at low alpha, which gives the
 * badge a halo like a seismograph trace and — more usefully — separates it from
 * whatever surface it sits on without needing a hard border.
 */
export function MagnitudeBadge({ magnitude, depthKm, size }: Props) {
  const px = size ?? magnitudeSize(magnitude);
  const color = depthColor(depthKm);
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-mono font-bold tabular-nums"
      style={{
        width: px,
        height: px,
        backgroundColor: color,
        // Shallow-quake red is dark enough that the usual near-black ink fails
        // WCAG AA at this size; the foreground is chosen per fill.
        color: onFillTextColor(color),
        fontSize: Math.max(11, px * 0.34),
        boxShadow: `0 0 0 ${Math.max(2, px * 0.09)}px ${color}22`,
      }}
      title={`M${magnitude.toFixed(1)} · kedalaman ${depthKm.toFixed(0)} km`}
    >
      {magnitude.toFixed(1)}
    </span>
  );
}
