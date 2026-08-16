import { depthColor } from "@/lib/seismic";
import {
  findEventNear,
  magnitudeToUnitHeight,
  type SeismogramEvent,
} from "@/lib/seismogram";
import { magnitude as fmtMagnitude } from "@/lib/format";

interface Props {
  regionName: string;
  events: SeismogramEvent[];
  /** The disaster's own curated date — matched to its recorded event via findEventNear. */
  disasterDateIso: string;
  now?: Date;
}

const DOMAIN_START = new Date("1970-01-01T00:00:00Z");
const VB_W = 600;
const VB_H = 56;
const MARGIN = { top: 6, right: 4, bottom: 6, left: 4 };
const PLOT_W = VB_W - MARGIN.left - MARGIN.right;
const PLOT_H = VB_H - MARGIN.top - MARGIN.bottom;
const BASELINE_Y = MARGIN.top + PLOT_H;

/**
 * A disaster entry's regional context, ties the archive to the signature
 * object (DESIGN.md §9) — same 1970–now axis and the same magnitude curve
 * and depth colour RegionSeismogram uses, shrunk to an illustration rather
 * than an instrument. No axis, no reference lines, no annotations: the only
 * thing this has to say is "here is the shape of the record this event sits
 * in," which is what shows a 2004 or a 2018 as the outlier it was.
 *
 * Deliberately not a compact mode of RegionSeismogram itself — that
 * component's responsive two-scale, comparison-mode structure has no shared
 * surface with a chrome-less illustration this small, and forcing them
 * together would complicate both for no shared benefit. What is shared is
 * the encoding (magnitudeToUnitHeight, depthColor), which is what actually
 * needed to match.
 */
export function DisasterSeismogramFragment({
  regionName,
  events,
  disasterDateIso,
  now,
}: Props) {
  const rightEdge = now ?? new Date();
  const domainStartMs = DOMAIN_START.getTime();
  const domainSpan = Math.max(1, rightEdge.getTime() - domainStartMs);

  const sorted = [...events].sort((a, b) => a.event_time.localeCompare(b.event_time));
  const highlight = findEventNear(sorted, disasterDateIso);
  // Reduced to M5+ same as RegionSeismogram's mobile mode, at this size dense
  // regions would smear into a block otherwise — but the matched event stays
  // even if it falls below M5, so the highlight always corresponds to a
  // visible spike.
  const reduced = sorted.filter((e) => e.magnitude >= 5 || e === highlight);

  function xOf(iso: string): number {
    const frac = (new Date(iso).getTime() - domainStartMs) / domainSpan;
    return MARGIN.left + frac * PLOT_W;
  }
  function yTopOf(mag: number): number {
    return BASELINE_Y - magnitudeToUnitHeight(mag) * PLOT_H;
  }

  const caption = highlight
    ? `Rekaman gempa ${regionName} 1970–sekarang, dengan kejadian ini (${fmtMagnitude(highlight.magnitude)}) ditandai di antara ${sorted.length} kejadian tercatat.`
    : `Rekaman gempa ${regionName} 1970–sekarang, ${sorted.length} kejadian tercatat.`;

  return (
    <figure className="m-0">
      <figcaption className="sr-only">{caption}</figcaption>
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="h-10 w-full sm:h-12" aria-hidden="true">
        <line
          x1={MARGIN.left}
          x2={VB_W - MARGIN.right}
          y1={BASELINE_Y}
          y2={BASELINE_Y}
          stroke="#33302B"
          strokeWidth={1}
        />
        {reduced.map((e, i) => {
          const isHighlight = e === highlight;
          if (isHighlight) return null; // drawn last, on top
          const x = xOf(e.event_time);
          return (
            <line
              key={i}
              x1={x}
              x2={x}
              y1={BASELINE_Y}
              y2={yTopOf(e.magnitude)}
              stroke={depthColor(e.depth_km)}
              strokeWidth={1}
              strokeOpacity={0.4}
            />
          );
        })}
        {highlight && (
          <g>
            <line
              x1={xOf(highlight.event_time)}
              x2={xOf(highlight.event_time)}
              y1={BASELINE_Y}
              y2={yTopOf(highlight.magnitude)}
              stroke="var(--seismic-bright)"
              strokeWidth={2}
            />
            <circle
              cx={xOf(highlight.event_time)}
              cy={yTopOf(highlight.magnitude)}
              r={2.5}
              fill="var(--seismic-bright)"
            />
          </g>
        )}
      </svg>
    </figure>
  );
}
