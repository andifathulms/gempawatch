/**
 * Golden-fixture suite: the TypeScript risk engine must reproduce what Django
 * computes, point for point.
 *
 * Fixtures come from `manage.py export_risk_fixtures` and are committed. If the
 * Python methodology changes, regenerate them and fix this port until the suite
 * passes again. A failure here means the static build would publish different
 * risk numbers than the API — which for this app is a correctness bug, not a
 * cosmetic one.
 *
 * Requires a prior `manage.py export_static` into frontend/public (see
 * `npm run export:check` in the deploy workflow).
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

import { loadEngineData, type EngineData } from "../dataset";
import { buildPointRiskReport } from "../report";
import fixtures from "../__fixtures__/risk-reports.json";

const PUBLIC_DIR = path.resolve(__dirname, "../../../../public");

// Distances are computed on a sphere here vs PostGIS's own geodetic maths, and
// exported coordinates are rounded to 3dp. Sub-100m disagreement is expected;
// anything larger means the port has genuinely diverged.
const DISTANCE_TOLERANCE_KM = 0.1;
// A distance difference of that size can only move the proximity component of
// the score by a hair.
const SCORE_TOLERANCE = 0.2;

let data: EngineData;

beforeAll(async () => {
  data = await loadEngineData(async (p) =>
    readFile(path.join(PUBLIC_DIR, p), "utf-8"),
  );
}, 60_000);

describe("engine dataset", () => {
  it("loads events, regions and faults", () => {
    expect(data.events.count).toBeGreaterThan(10_000);
    expect(data.regions.length).toBeGreaterThan(0);
    expect(data.faults.length).toBeGreaterThan(0);
    expect(data.storedScores.length).toBeGreaterThan(0);
  });

  it("every fault carries a usable geometry", () => {
    for (const fault of data.faults) {
      expect(fault.name).toBeTruthy();
      expect(["LineString", "MultiLineString"]).toContain(fault.geometry.type);
    }
  });
});

describe("risk report matches Django golden fixtures", () => {
  it.each(fixtures.map((f) => [f.name, f] as const))(
    "%s",
    (_name, fixture) => {
      const actual = buildPointRiskReport(data, fixture.lat, fixture.lng);
      const want = fixture.expected;

      // Exact: anything users read as a category or a count.
      expect(actual.event_count_m4_within_50km).toBe(
        want.event_count_m4_within_50km,
      );
      expect(actual.largest_magnitude_within_50km).toBe(
        want.largest_magnitude_within_50km,
      );
      expect(actual.overall_risk_band).toBe(want.overall_risk_band);
      expect(actual.activity_tier).toBe(want.activity_tier);
      expect(actual.tsunami_risk_tier).toBe(want.tsunami_risk_tier);
      expect(actual.comparison.relation).toBe(want.comparison_relation);
      expect(actual.nearest_region?.slug ?? null).toBe(want.nearest_region_slug);
      expect(actual.nearest_fault?.name ?? null).toBe(want.nearest_fault_name);
      expect(actual.data_coverage).toEqual(want.data_coverage);

      // Tolerant: continuous values subject to spherical-vs-geodetic drift.
      if (want.nearest_fault_distance_km !== null) {
        expect(actual.nearest_fault?.distance_km).toBeCloseTo(
          want.nearest_fault_distance_km,
          // toBeCloseTo's digits arg: 1 => within 0.05. Use explicit delta
          // via a manual assertion instead for a clearer failure message.
          1,
        );
        const delta = Math.abs(
          (actual.nearest_fault?.distance_km ?? 0) -
            want.nearest_fault_distance_km,
        );
        expect(delta).toBeLessThanOrEqual(DISTANCE_TOLERANCE_KM);
      }

      const scoreDelta = Math.abs(actual.composite_score - want.composite_score);
      expect(scoreDelta).toBeLessThanOrEqual(SCORE_TOLERANCE);

      expect(actual.activity_percentile).toBe(want.activity_percentile);
    },
  );
});
