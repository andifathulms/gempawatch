import { describe, expect, it } from "vitest";

import {
  findLargestEvent,
  findLongestQuietStretch,
  formatDurationId,
  magnitudeToUnitHeight,
  REFERENCE_MAGNITUDES,
} from "../seismogram";
import { SEISMOGRAM_REGION_FIXTURES } from "../../components/risk/__fixtures__/seismogramRegions";

// Fixed so the "quiet stretch ending at now" case (Kota Semarang) is deterministic.
const NOW = new Date("2026-08-16T00:00:00Z");

describe("magnitudeToUnitHeight", () => {
  it("is monotonically increasing across the reference magnitudes", () => {
    const heights = REFERENCE_MAGNITUDES.map(magnitudeToUnitHeight);
    expect(heights[0]).toBeLessThan(heights[1]);
    expect(heights[1]).toBeLessThan(heights[2]);
  });

  it("compresses the top so a major event does not erase the M4 background", () => {
    // Linear-in-magnitude would make M9/M4 = 2.25x. Linear-in-energy (~10^1.5*mag)
    // would make it ~5600x. The mild power curve must land between the two.
    const m4 = magnitudeToUnitHeight(4);
    const m9 = magnitudeToUnitHeight(9);
    const ratio = m9 / m4;
    expect(ratio).toBeGreaterThan(2.25);
    expect(ratio).toBeLessThan(5600);
  });

  it("clamps outside the plotted range instead of extrapolating", () => {
    expect(magnitudeToUnitHeight(1)).toBe(magnitudeToUnitHeight(3));
    expect(magnitudeToUnitHeight(12)).toBe(magnitudeToUnitHeight(9));
  });
});

describe("findLargestEvent", () => {
  it("returns null for an empty region", () => {
    expect(findLargestEvent([])).toBeNull();
  });

  it("finds the real largest event in each fixture region", () => {
    const { active, dominant, quiet } = SEISMOGRAM_REGION_FIXTURES;
    expect(findLargestEvent(active.events)?.magnitude).toBe(6.7);
    expect(findLargestEvent(dominant.events)?.magnitude).toBe(7.8);
    expect(findLargestEvent(quiet.events)?.magnitude).toBe(5.2);
  });
});

describe("findLongestQuietStretch", () => {
  it("returns null for a region with no events", () => {
    expect(findLongestQuietStretch([], NOW)).toBeNull();
  });

  it("never counts time before the region's first recorded event", () => {
    // Kota Gunungsitoli's catalogue starts 1974-02-27 with nothing before it —
    // the 1970-1974 span must not be reported as "quiet" (see lib/seismogram.ts).
    const { active } = SEISMOGRAM_REGION_FIXTURES;
    const stretch = findLongestQuietStretch(active.events, NOW);
    expect(stretch?.startIso.slice(0, 10)).not.toBe("1970-01-01");
  });

  it("finds the real longest interior gap for the dominant-event region (Sikka)", () => {
    const { dominant } = SEISMOGRAM_REGION_FIXTURES;
    const stretch = findLongestQuietStretch(dominant.events, NOW);
    expect(stretch?.startIso.slice(0, 10)).toBe("2011-11-08");
    expect(stretch?.endIso.slice(0, 10)).toBe("2016-01-14");
    expect(stretch?.days).toBe(1528);
  });

  it("runs to `now` when the last M5+ event is decades old (Kota Semarang)", () => {
    const { quiet } = SEISMOGRAM_REGION_FIXTURES;
    const stretch = findLongestQuietStretch(quiet.events, NOW);
    expect(stretch?.startIso.slice(0, 10)).toBe("1979-10-07");
    expect(stretch?.endIso).toBe(NOW.toISOString());
  });

  it("treats a region with zero M5+ events as quiet for its entire record", () => {
    const events = [
      { event_time: "2000-01-01T00:00:00Z", magnitude: 4.1, depth_km: 10 },
      { event_time: "2010-01-01T00:00:00Z", magnitude: 4.8, depth_km: 20 },
    ];
    const stretch = findLongestQuietStretch(events, NOW);
    expect(stretch?.startIso).toBe("2000-01-01T00:00:00.000Z");
    expect(stretch?.endIso).toBe(NOW.toISOString());
  });
});

describe("formatDurationId", () => {
  it.each([
    [10, "10 hari"],
    [90, "3 bulan"],
    [1528, "4,2 tahun"],
  ])("formatDurationId(%s) === %s", (days, expected) => {
    expect(formatDurationId(days as number)).toBe(expected);
  });
});
