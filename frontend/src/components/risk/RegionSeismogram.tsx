import { ChartFigure } from "./ChartFigure";
import { AXIS, GRID } from "./chartTheme";
import { SourceAttribution } from "@/components/ui/SourceAttribution";
import { DEPTH_BANDS, depthColor } from "@/lib/seismic";
import { magnitude as fmtMagnitude, num, shortDate } from "@/lib/format";
import {
  REFERENCE_MAGNITUDES,
  findLargestEvent,
  findLongestQuietStretch,
  formatDurationId,
  magnitudeToUnitHeight,
  type SeismogramEvent,
} from "@/lib/seismogram";
import type { Source } from "@/lib/types";

interface Props {
  regionName: string;
  events: SeismogramEvent[];
  /** Right edge of the trace. Defaults to render time; a prop so tests and the golden fixtures are deterministic. */
  now?: Date;
  className?: string;
}

const DOMAIN_START = new Date("1970-01-01T00:00:00Z");
const VB_W = 1000;
const VB_H = 280;
const MARGIN = { top: 28, right: 14, bottom: 28, left: 30 };
const PLOT_W = VB_W - MARGIN.left - MARGIN.right;
const PLOT_H = VB_H - MARGIN.top - MARGIN.bottom;
const BASELINE_Y = MARGIN.top + PLOT_H;

/**
 * A fifty-year instrument trace, not a scatter plot: one vertical spike per
 * event, height = magnitude (mild power curve, see lib/seismogram.ts),
 * colour = depth. A scatter shows the same numbers; it does not show a quiet
 * decade the way a flat stretch in a trace does at a glance. See DESIGN.md §5.
 *
 * No trend line, no forward-looking mark of any kind — CLAUDE.md's ban on
 * predictive framing is absolute, and a line drawn across a seismic record
 * reads as "this is where it's headed" whether or not that's the intent.
 *
 * §5.4's comparison mode (two traces on one shared scale) and §5.3's
 * ticker-as-right-edge are later migration steps and not built here — this
 * is step 1 of DESIGN.md §10: the trace standing alone, correct against real
 * per-region data, nothing wired into a page yet.
 */
export function RegionSeismogram({ regionName, events, now, className }: Props) {
  const rightEdge = now ?? new Date();
  const sorted = [...events].sort((a, b) => a.event_time.localeCompare(b.event_time));

  const domainStartMs = DOMAIN_START.getTime();
  const domainEndMs = rightEdge.getTime();
  const domainSpan = Math.max(1, domainEndMs - domainStartMs);

  function xOf(iso: string): number {
    const t = new Date(iso).getTime();
    const frac = (t - domainStartMs) / domainSpan;
    return MARGIN.left + frac * PLOT_W;
  }

  function yTopOf(mag: number): number {
    return BASELINE_Y - magnitudeToUnitHeight(mag) * PLOT_H;
  }

  const largest = findLargestEvent(sorted);
  const quietStretch = findLongestQuietStretch(sorted, rightEdge);

  const sourcesPresent = Array.from(
    new Set(sorted.map((e) => e.source).filter((s): s is Source => Boolean(s))),
  );

  // Decade summary — the same reasoning as EventScatterTimeline's sr-only
  // table: a per-spike row for a region with 1,600 events tells a
  // screen-reader user nothing a chart-shaped table wouldn't already fail to
  // tell them. Decade counts answer the same question the trace answers.
  const byDecade = new Map<number, { count: number; largest: number }>();
  for (const e of sorted) {
    const decade = Math.floor(new Date(e.event_time).getFullYear() / 10) * 10;
    const prev = byDecade.get(decade);
    if (!prev) byDecade.set(decade, { count: 1, largest: e.magnitude });
    else {
      prev.count++;
      if (e.magnitude > prev.largest) prev.largest = e.magnitude;
    }
  }
  const decadeRows: Array<[string, string]> = [...byDecade.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([decade, v]) => [
      `${decade}-an`,
      `${num(v.count)} kejadian, terbesar ${fmtMagnitude(v.largest)}`,
    ]);

  const annotationRows: Array<[string, string]> = [];
  if (quietStretch) {
    annotationRows.push([
      "Rentang tenang terpanjang (tanpa M5 ke atas)",
      `${formatDurationId(quietStretch.days)}, ${shortDate(quietStretch.startIso)}–${shortDate(quietStretch.endIso)}`,
    ]);
  }
  if (largest) {
    annotationRows.push([
      "Gempa terbesar tercatat",
      `${fmtMagnitude(largest.magnitude)} pada ${shortDate(largest.event_time)}`,
    ]);
  }

  const legend = (
    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-fluid-000 text-text-muted">
      <span>Warna = kedalaman:</span>
      {DEPTH_BANDS.map((b) => (
        <span key={b.label} className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: b.color }}
          />
          {b.label}
        </span>
      ))}
    </div>
  );

  return (
    <div className={className}>
      <ChartFigure
        caption={`Rekaman gempa 1970–sekarang untuk ${regionName}, tinggi paku = magnitudo, warna = kedalaman`}
        columns={["Ringkasan", "Nilai"]}
        rows={[...annotationRows, ...decadeRows]}
        note={legend}
      >
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="w-full"
          style={{ height: 280 }}
          preserveAspectRatio="none"
        >
          {/* Reference lines — same magnitudeToUnitHeight curve as the spikes, or the labelled scale would lie. */}
          {REFERENCE_MAGNITUDES.map((m) => {
            const y = yTopOf(m);
            return (
              <g key={m}>
                <line
                  x1={MARGIN.left}
                  x2={VB_W - MARGIN.right}
                  y1={y}
                  y2={y}
                  stroke={GRID.stroke}
                  strokeDasharray={GRID.strokeDasharray}
                  strokeWidth={1}
                />
                <text x={MARGIN.left - 6} y={y} textAnchor="end" dominantBaseline="middle" fontSize={11} fill={AXIS.stroke}>
                  M{m}
                </text>
              </g>
            );
          })}

          {/* Quiet stretch — shaded span, duration stated in place, never decorative. */}
          {quietStretch && (
            <g>
              <rect
                x={xOf(quietStretch.startIso)}
                y={MARGIN.top}
                width={Math.max(0, xOf(quietStretch.endIso) - xOf(quietStretch.startIso))}
                height={PLOT_H}
                fill={GRID.stroke}
                fillOpacity={0.28}
              />
              <text
                x={(xOf(quietStretch.startIso) + xOf(quietStretch.endIso)) / 2}
                y={MARGIN.top - 10}
                textAnchor="middle"
                fontSize={11}
                fill={AXIS.stroke}
              >
                {formatDurationId(quietStretch.days)} tenang
              </text>
            </g>
          )}

          {/* Baseline */}
          <line
            x1={MARGIN.left}
            x2={VB_W - MARGIN.right}
            y1={BASELINE_Y}
            y2={BASELINE_Y}
            stroke={GRID.stroke}
            strokeWidth={1}
          />

          {/* Decade ticks */}
          {Array.from({ length: 6 }, (_, i) => 1970 + i * 10).map((year) => {
            const x = xOf(new Date(Date.UTC(year, 0, 1)).toISOString());
            if (x > VB_W - MARGIN.right) return null;
            return (
              <text key={year} x={x} y={VB_H - 10} textAnchor="middle" fontSize={11} fill={AXIS.stroke}>
                {year}
              </text>
            );
          })}

          {/* The spikes themselves */}
          {sorted.map((e, i) => {
            const x = xOf(e.event_time);
            const yTop = yTopOf(e.magnitude);
            const isLargest = largest === e;
            return (
              <line
                key={i}
                x1={x}
                x2={x}
                y1={BASELINE_Y}
                y2={yTop}
                stroke={depthColor(e.depth_km)}
                strokeWidth={isLargest ? 2 : 1}
                strokeOpacity={isLargest ? 1 : 0.55}
              />
            );
          })}

          {/* Largest event — labelled in place, magnitude and date, never a name it doesn't have. */}
          {largest && (
            <text
              x={Math.min(VB_W - MARGIN.right - 4, Math.max(MARGIN.left + 4, xOf(largest.event_time)))}
              y={Math.max(14, yTopOf(largest.magnitude) - 8)}
              textAnchor={xOf(largest.event_time) > VB_W - 140 ? "end" : "middle"}
              fontSize={12}
              fontFamily="var(--font-mono)"
              fill="var(--text-primary)"
            >
              {fmtMagnitude(largest.magnitude)} · {shortDate(largest.event_time)}
            </text>
          )}

          {/* Live marker — the right edge is "now", per DESIGN.md §5.3 (the ticker-as-right-edge migration lands later; this is the static anchor it will attach to). */}
          <circle
            cx={VB_W - MARGIN.right}
            cy={BASELINE_Y}
            r={3}
            fill="var(--seismic-bright)"
          />
        </svg>
      </ChartFigure>
      <SourceAttribution
        variant="inline"
        sources={sourcesPresent.length > 0 ? sourcesPresent : undefined}
        className="mt-2"
      />
    </div>
  );
}
