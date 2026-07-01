import { magnitudeSize, depthColor } from "@/lib/seismic";

interface Props {
  magnitude: number;
  depthKm: number;
  /** Fixed pixel size override (e.g. small inline badges). */
  size?: number;
}

// Signature element: circular badge, size scales with magnitude, color with depth.
// Used everywhere an earthquake is referenced (list, map popup, timeline).
export function MagnitudeBadge({ magnitude, depthKm, size }: Props) {
  const px = size ?? magnitudeSize(magnitude);
  return (
    <span
      className="inline-flex items-center justify-center rounded-full font-mono font-medium text-earth-dark shrink-0"
      style={{
        width: px,
        height: px,
        backgroundColor: depthColor(depthKm),
        fontSize: Math.max(11, px * 0.32),
      }}
      title={`M${magnitude.toFixed(1)} · ${depthKm.toFixed(0)} km`}
    >
      {magnitude.toFixed(1)}
    </span>
  );
}
