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

interface Trace {
  regionName: string;
  events: SeismogramEvent[];
}

interface Props {
  regionName: string;
  events: SeismogramEvent[];
  /**
   * A second trace stacked below the first, sharing the same x and y scale
   * (DESIGN.md §5.4 — "the single most important constraint in this
   * component"). Both scales are fixed and absolute (1970–now on x, the same
   * magnitude curve on y) rather than fit to each dataset, so passing a
   * comparison trace can never silently rescale either one.
   */
  comparison?: Trace | null;
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
  /**
   * Fraction of vbW, measured from the right edge, inside which the
   * largest-event label switches from centred to right-anchored so it can't
   * run past the plot. A monospace label is a much bigger fraction of a
   * 340-unit mobile viewBox than a 1000-unit desktop one at the same
   * character count, so this can't be one constant for both scales — it was,
   * and "M7.5 · 28 Sep 2018" clipped at the mobile card's right edge.
   */
  labelEdgeFraction: number;
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
  vbH: 240,
  margin: { top: 28, right: 14, bottom: 28, left: 30 },
  axisFontSize: 11,
  labelFontSize: 12,
  decadeStep: 10,
  labelEdgeFraction: 0.14,
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
  vbH: 190,
  margin: { top: 24, right: 8, bottom: 22, left: 26 },
  axisFontSize: 10,
  labelFontSize: 10,
  decadeStep: 20,
  labelEdgeFraction: 0.34,
};

interface RegionTraceData {
  regionName: string;
  sorted: SeismogramEvent[];
  reduced: SeismogramEvent[];
  largest: SeismogramEvent | null;
  quietStretch: ReturnType<typeof findLongestQuietStretch>;
  sourcesPresent: Source[];
  rows: Array<[string, string]>;
}

function analyzeTrace(trace: Trace, rightEdge: Date): RegionTraceData {
  const sorted = [...trace.events].sort((a, b) => a.event_time.localeCompare(b.event_time));
  const largest = findLargestEvent(sorted);
  const quietStretch = findLongestQuietStretch(sorted, rightEdge);

  // Dropping sub-M5 events on mobile must never change what "largest event" or
  // "quiet stretch" means, only how many background spikes surround them. The
  // largest event stays in the reduced set even when it is itself below M5 (a
  // region that has never had an M5+ at all), so the label always points at a
  // spike that is actually on screen.
  const reduced = sorted.filter((e) => e.magnitude >= 5 || e === largest);

  const sourcesPresent = Array.from(
    new Set(sorted.map((e) => e.source).filter((s): s is Source => Boolean(s))),
  );

  // Decade summary — the same reasoning as EventScatterTimeline's old sr-only
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

  return {
    regionName: trace.regionName,
    sorted,
    reduced,
    largest,
    quietStretch,
    sourcesPresent,
    rows: [...annotationRows, ...decadeRows],
  };
}

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
 * §5.3's ticker-as-right-edge is a later migration step and not built here.
 */
export function RegionSeismogram({ regionName, events, comparison, now, className }: Props) {
  const rightEdge = now ?? new Date();
  const domainStartMs = DOMAIN_START.getTime();
  const domainEndMs = rightEdge.getTime();
  const domainSpan = Math.max(1, domainEndMs - domainStartMs);

  const main = analyzeTrace({ regionName, events }, rightEdge);
  const ref = comparison ? analyzeTrace(comparison, rightEdge) : null;
  const traces = ref ? [main, ref] : [main];

  const sourcesPresent = Array.from(
    new Set(traces.flatMap((t) => t.sourcesPresent)),
  );

  const rows: Array<[string, string]> = ref
    ? traces.flatMap((t) => t.rows.map(([label, value]) => [`${t.regionName} — ${label}`, value] as [string, string]))
    : main.rows;

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

  function renderTrace(scale: ScaleConfig, data: RegionTraceData, useReduced: boolean, showXAxis: boolean) {
    const { vbW, vbH, margin, axisFontSize, labelFontSize, decadeStep, labelEdgeFraction } = scale;
    const plotW = vbW - margin.left - margin.right;
    const plotH = vbH - margin.top - margin.bottom;
    const baselineY = margin.top + plotH;
    const { largest, quietStretch } = data;
    const eventsToPlot = useReduced ? data.reduced : data.sorted;

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
    if (showXAxis) {
      for (let y = startYear; y <= endYear; y += decadeStep) decadeTicks.push(y);
    }

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

        {/* Decade ticks — only on the bottom-most trace when two are stacked, so the shared x-axis isn't printed twice. */}
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
            textAnchor={xOf(largest.event_time) > vbW - vbW * labelEdgeFraction ? "end" : "middle"}
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

  function renderStack(scale: ScaleConfig, useReduced: boolean) {
    return (
      <div className="space-y-1">
        {traces.map((t, i) => {
          const isLast = i === traces.length - 1;
          return (
            <div key={t.regionName}>
              {ref && (
                <p className="text-fluid-000 font-semibold uppercase tracking-wide text-text-secondary">
                  {t.regionName}
                  {i === 1 && " (pembanding)"}
                </p>
              )}
              {renderTrace(scale, t, useReduced, isLast)}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={className}>
      <ChartFigure
        caption={
          ref
            ? `Rekaman gempa 1970–sekarang untuk ${regionName} dibandingkan ${ref.regionName}, sumbu waktu dan magnitudo sama untuk keduanya`
            : `Rekaman gempa 1970–sekarang untuk ${regionName}, tinggi paku = magnitudo, warna = kedalaman`
        }
        columns={["Ringkasan", "Nilai"]}
        rows={rows}
        note={legend}
      >
        {/*
          Two renders per trace, not one stretched via CSS — see the scale
          comments above. `hidden sm:block` / `sm:hidden` is a CSS-only
          breakpoint switch so the component stays server-renderable; no
          ResizeObserver, no client boundary. Comparison mode stacks a second
          trace under the first at each breakpoint, both built from the same
          xOf/yTopOf closures — there is no per-trace scale to drift.
        */}
        <div className="hidden sm:block">{renderStack(DESKTOP_SCALE, false)}</div>
        <div className="sm:hidden">{renderStack(MOBILE_SCALE, true)}</div>
      </ChartFigure>
      <SourceAttribution
        variant="inline"
        sources={sourcesPresent.length > 0 ? sourcesPresent : undefined}
        className="mt-2"
      />
    </div>
  );
}
