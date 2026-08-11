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
 *
 * Depth used to live only in the fill colour and a `title` tooltip, so for
 * anyone not using a mouse it was simply absent — colour as the sole carrier of
 * information (WCAG 1.4.1), for the value this app calls its own damage proxy.
 * The visible glyph stays the magnitude alone, because the badge is used in
 * dense lists where a second number would not fit; the depth rides along as
 * visually-hidden text so it is read out with the magnitude.
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
    >
      <span aria-hidden="true">{magnitude.toFixed(1)}</span>
      <span className="sr-only">
        Magnitudo {magnitude.toFixed(1)}, kedalaman {depthKm.toFixed(0)} km
      </span>
    </span>
  );
}
