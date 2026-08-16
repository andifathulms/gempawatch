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

interface ScaleConfig {
  vbW: number;
  vbH: number;
  margin: { top: number; right: number; bottom: number; left: number };
  axisFontSize: number;
  labelFontSize: number;
  /** Years between x-axis ticks. Wider on mobile so labels don't collide. */
  decadeStep: number;
}

/**
 * Rendered at roughly its real on-screen width, so text sizes as specified
 * rather than being scaled by the gap between viewBox units and CSS pixels.
 *
 * The first version of this component used one 1000-unit-wide viewBox
 * stretched to fit any container via `width: 100%`. On a ~750px desktop card
 * that scale factor (~0.75) was close enough to invisible; on a 300px phone
 * card it was ~0.3, and every label — axis years, the M5/M6/M7 lines, the
 * quiet-stretch and largest-event text — shrank and smeared into the same
 * illegible cluster (checked at 375px, see DESIGN.md §10). A single scale
 * cannot serve both widths, so this renders two variants tuned to each,
 * swapped by a CSS breakpoint rather than JS, which keeps the component
 * server-renderable.
 */
const DESKTOP_SCALE: ScaleConfig = {
  vbW: 1000,
  vbH: 280,
  margin: { top: 28, right: 14, bottom: 28, left: 30 },
  axisFontSize: 11,
  labelFontSize: 12,
  decadeStep: 10,
};

/**
 * Also drops to M5+-only spikes (see `reducedEvents` below) — the same
 * shrink that mangled the text also compressed a dense region's 1,600 spikes
 * into a solid smear with no visible quiet stretch, which defeats the one
 * thing this component exists to show. Fewer, taller spikes stay legible at
 * this width where all of them together would not.
 */
const MOBILE_SCALE: ScaleConfig = {
  vbW: 340,
  vbH: 210,
  margin: { top: 24, right: 8, bottom: 22, left: 26 },
  axisFontSize: 10,
  labelFontSize: 10,
  decadeStep: 20,
};

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
 * ticker-as-right-edge are later migration steps and not built here.
 */
export function RegionSeismogram({ regionName, events, now, className }: Props) {
  const rightEdge = now ?? new Date();
  const sorted = [...events].sort((a, b) => a.event_time.localeCompare(b.event_time));

  const domainStartMs = DOMAIN_START.getTime();
  const domainEndMs = rightEdge.getTime();
  const domainSpan = Math.max(1, domainEndMs - domainStartMs);

  const largest = findLargestEvent(sorted);
  const quietStretch = findLongestQuietStretch(sorted, rightEdge);

  // The annotations above are always computed from the full record — dropping
  // sub-M5 events on mobile must never change what "largest event" or "quiet
  // stretch" means, only how many background spikes surround them. The
  // largest event stays in the reduced set even when it is itself below M5
  // (a region that has never had an M5+ at all), so the label always points
  // at a spike that is actually on screen.
  const reducedEvents = sorted.filter((e) => e.magnitude >= 5 || e === largest);

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

  function renderTrace(scale: ScaleConfig, eventsToPlot: SeismogramEvent[]) {
    const { vbW, vbH, margin, axisFontSize, labelFontSize, decadeStep } = scale;
    const plotW = vbW - margin.left - margin.right;
    const plotH = vbH - margin.top - margin.bottom;
    const baselineY = margin.top + plotH;

    function xOf(iso: string): number {
      const t = new Date(iso).getTime();
      const frac = (t - domainStartMs) / domainSpan;
      return margin.left + frac * plotW;
    }
    function yTopOf(mag: number): number {
      return baselineY - magnitudeToUnitHeight(mag) * plotH;
    }

    const startYear = 1970;
    const endYear = rightEdge.getUTCFullYear();
    const decadeTicks: number[] = [];
    for (let y = startYear; y <= endYear; y += decadeStep) decadeTicks.push(y);

    return (
      <svg viewBox={`0 0 ${vbW} ${vbH}`} className="w-full" style={{ height: vbH }}>
        {/* Reference lines — same magnitudeToUnitHeight curve as the spikes, or the labelled scale would lie. */}
        {REFERENCE_MAGNITUDES.map((m) => {
          const y = yTopOf(m);
          return (
            <g key={m}>
              <line
                x1={margin.left}
                x2={vbW - margin.right}
                y1={y}
                y2={y}
                stroke={GRID.stroke}
                strokeDasharray={GRID.strokeDasharray}
                strokeWidth={1}
              />
              <text
                x={margin.left - 6}
                y={y}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={axisFontSize}
                fill={AXIS.stroke}
              >
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
              y={margin.top}
              width={Math.max(0, xOf(quietStretch.endIso) - xOf(quietStretch.startIso))}
              height={plotH}
              fill={GRID.stroke}
              fillOpacity={0.28}
            />
            <text
              x={(xOf(quietStretch.startIso) + xOf(quietStretch.endIso)) / 2}
              y={margin.top - 10}
              textAnchor="middle"
              fontSize={axisFontSize}
              fill={AXIS.stroke}
            >
              {formatDurationId(quietStretch.days)} tenang
            </text>
          </g>
        )}

        {/* Baseline */}
        <line
          x1={margin.left}
          x2={vbW - margin.right}
          y1={baselineY}
          y2={baselineY}
          stroke={GRID.stroke}
          strokeWidth={1}
        />

        {/* Decade ticks */}
        {decadeTicks.map((year) => {
          const x = xOf(new Date(Date.UTC(year, 0, 1)).toISOString());
          if (x > vbW - margin.right) return null;
          return (
            <text key={year} x={x} y={vbH - 8} textAnchor="middle" fontSize={axisFontSize} fill={AXIS.stroke}>
              {year}
            </text>
          );
        })}

        {/* The spikes themselves */}
        {eventsToPlot.map((e, i) => {
          const x = xOf(e.event_time);
          const yTop = yTopOf(e.magnitude);
          const isLargest = largest === e;
          return (
            <line
              key={i}
              x1={x}
              x2={x}
              y1={baselineY}
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
            x={Math.min(vbW - margin.right - 4, Math.max(margin.left + 4, xOf(largest.event_time)))}
            y={Math.max(labelFontSize + 2, yTopOf(largest.magnitude) - 8)}
            textAnchor={xOf(largest.event_time) > vbW - vbW * 0.14 ? "end" : "middle"}
            fontSize={labelFontSize}
            fontFamily="var(--font-mono)"
            fill="var(--text-primary)"
          >
            {fmtMagnitude(largest.magnitude)} · {shortDate(largest.event_time)}
          </text>
        )}

        {/* Live marker — the right edge is "now", per DESIGN.md §5.3 (the ticker-as-right-edge migration lands later; this is the static anchor it will attach to). */}
        <circle cx={vbW - margin.right} cy={baselineY} r={3} fill="var(--seismic-bright)" />
      </svg>
    );
  }

  return (
    <div className={className}>
      <ChartFigure
        caption={`Rekaman gempa 1970–sekarang untuk ${regionName}, tinggi paku = magnitudo, warna = kedalaman`}
        columns={["Ringkasan", "Nilai"]}
        rows={[...annotationRows, ...decadeRows]}
        note={legend}
      >
        {/*
          Two renders, not one stretched via CSS — see DESIGN_SCALE comments
          above. `hidden sm:block` / `sm:hidden` is a CSS-only breakpoint
          switch so the component stays server-renderable; no ResizeObserver,
          no client boundary.
        */}
        <div className="hidden sm:block">{renderTrace(DESKTOP_SCALE, sorted)}</div>
        <div className="sm:hidden">{renderTrace(MOBILE_SCALE, reducedEvents)}</div>
      </ChartFigure>
      <SourceAttribution
        variant="inline"
        sources={sourcesPresent.length > 0 ? sourcesPresent : undefined}
        className="mt-2"
      />
    </div>
  );
}
