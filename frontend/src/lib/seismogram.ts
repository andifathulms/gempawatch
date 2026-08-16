// Pure, testable maths behind RegionSeismogram — kept out of the "use client"
// component so a future server-rendered fragment (e.g. a /timeline entry's
// regional-context trace, see DESIGN.md §9) can reuse it without pulling in a
// client boundary.

import type { Source } from "./types";

export interface SeismogramEvent {
  event_time: string;
  magnitude: number;
  depth_km: number;
  source?: Source;
}

/** Height stops growing below this — the USGS bootstrap floor is M4.0 anyway; this only clamps defensively. */
const MAG_FLOOR = 3;
/** Height stops growing above this — no recorded Indonesian event has approached it since Aceh 2004 (M9.1). */
const MAG_CEIL = 9;
/**
 * >1 on purpose: a linear-in-magnitude curve makes an M9 spike only about
 * twice an M4 (unreadable — the whole point of the trace is that a major
 * event dominates), while linear-in-energy (~10^1.5*mag) makes every M4–M6
 * spike invisible next to it. This is the middle ground — "mild" because it
 * is a low fractional power, not the seismic-energy exponent.
 */
const POWER = 1.7;

/**
 * 0..1. Reference lines (see REFERENCE_MAGNITUDES) MUST run through this same
 * function — the curve is non-linear, so the moment a reference line is drawn
 * by any other maths the labelled scale stops being an honest description of
 * what the spikes show (DESIGN.md §5.1).
 */
export function magnitudeToUnitHeight(mag: number): number {
  const clamped = Math.min(MAG_CEIL, Math.max(MAG_FLOOR, mag));
  return ((clamped - MAG_FLOOR) / (MAG_CEIL - MAG_FLOOR)) ** POWER;
}

/** The only reference lines the trace draws — see DESIGN.md §5.1 ("must be labelled"). */
export const REFERENCE_MAGNITUDES = [5, 6, 7] as const;

export function findLargestEvent<T extends SeismogramEvent>(events: T[]): T | null {
  if (events.length === 0) return null;
  return events.reduce((largest, e) => (e.magnitude > largest.magnitude ? e : largest));
}

export interface QuietStretch {
  startIso: string;
  endIso: string;
  days: number;
}

/**
 * The largest span containing no M5+ event, bounded by the first event this
 * region ever recorded (of any magnitude) and `now` — never by the chart's
 * fixed 1970 axis origin.
 *
 * A region's catalogue can start well after 1970 (Kota Gunungsitoli's begins
 * in 1974 — nothing at all is recorded before that, not even an M4). Counting
 * that pre-catalogue span as a "quiet stretch" would claim an absence of
 * earthquakes where there is really only an absence of a seismograph — an
 * overclaim in the reassuring direction, but CLAUDE.md's ban on
 * predictive/alarmist framing is about accuracy, not about which direction
 * the error points.
 */
export function findLongestQuietStretch(
  events: SeismogramEvent[],
  now: Date,
): QuietStretch | null {
  if (events.length === 0) return null;

  const sorted = [...events].sort((a, b) => a.event_time.localeCompare(b.event_time));
  const earliest = new Date(sorted[0].event_time);
  const majorEventTimes = sorted
    .filter((e) => e.magnitude >= 5)
    .map((e) => new Date(e.event_time));
  const anchors = [earliest, ...majorEventTimes, now];

  let longest: { start: Date; end: Date; days: number } | null = null;
  for (let i = 0; i < anchors.length - 1; i++) {
    const days = (anchors[i + 1].getTime() - anchors[i].getTime()) / 86_400_000;
    if (!longest || days > longest.days) {
      longest = { start: anchors[i], end: anchors[i + 1], days };
    }
  }
  if (!longest) return null;

  return {
    startIso: longest.start.toISOString(),
    endIso: longest.end.toISOString(),
    days: Math.round(longest.days),
  };
}

/** "4,2 tahun" / "8 bulan" / "12 hari" — whichever unit the span actually reads as. */
export function formatDurationId(days: number): string {
  if (days < 60) return `${days} hari`;
  if (days < 730) return `${Math.round(days / 30)} bulan`;
  const years = days / 365.25;
  return `${years.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} tahun`;
}
