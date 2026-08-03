import { DEPTH_BANDS } from "@/lib/seismic";

/**
 * Legend for the magnitude/depth encoding.
 *
 * The maps have always encoded two variables in every marker — radius for
 * magnitude, colour for depth — and never said so anywhere. Without this a red
 * dot reads as "bad" rather than "shallow", which is a different claim than the
 * one the data supports.
 */
export function DepthLegend({ className }: { className?: string }) {
  return (
    <div
      className={`flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-text-muted ${className ?? ""}`}
    >
      <span className="flex items-center gap-2">
        <span aria-hidden="true" className="flex items-end gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-text-muted" />
          <span className="h-2.5 w-2.5 rounded-full bg-text-muted" />
          <span className="h-3.5 w-3.5 rounded-full bg-text-muted" />
        </span>
        Ukuran = magnitudo
      </span>
      <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span>Warna = kedalaman:</span>
        {DEPTH_BANDS.map((b) => (
          <span key={b.label} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: b.color }}
            />
            <span className="text-text-secondary">{b.label}</span>
            <span className="font-mono text-[11px]">{b.detail}</span>
          </span>
        ))}
      </span>
    </div>
  );
}
