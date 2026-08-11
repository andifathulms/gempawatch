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

      // Derived output has to match too. Pinning only the headline score let
      // the engines disagree about WHICH event the counterfactual removed while
      // both reported a plausible number — two M6.3s at Yogyakarta, one deep and
      // one shallow, picked by primary key in Django and by array order here.
      expect(actual.activity_percentile_basis).toEqual(
        want.activity_percentile_basis,
      );
      expect(actual.comparison_set).toEqual(want.comparison_set);

      // Components are exact except for the proximity term, which inherits the
      // spherical-vs-geodetic fault distance drift the block above tolerates.
      expect(actual.score_breakdown.map((c) => c.key)).toEqual(
        want.score_breakdown.map((c) => c.key),
      );
      actual.score_breakdown.forEach((got, i) => {
        const expected = want.score_breakdown[i];
        expect(got.max_points).toBe(expected.max_points);
        expect(got.saturated).toBe(expected.saturated);
        expect(Math.abs(got.points - expected.points)).toBeLessThanOrEqual(
          got.key === "proximity" ? SCORE_TOLERANCE : 0,
        );
      });

      // The tsunami tier is a verdict; the count and thresholds behind it have
      // to match too, or the two engines could agree on "SEDANG" while
      // disagreeing about how many events said so.
      expect(actual.tsunami_evidence).toEqual(want.tsunami_evidence);
      expect(actual.tsunami_evidence.tier).toBe(actual.tsunami_risk_tier);

      // The identity of the removed event is exact — that is the whole point.
      if (want.largest_event_sensitivity === null) {
        expect(actual.largest_event_sensitivity).toBeNull();
      } else {
        const got = actual.largest_event_sensitivity!;
        const expected = want.largest_event_sensitivity;
        expect(got.removed).toEqual(expected.removed);
        expect(got.next_largest_magnitude).toBe(expected.next_largest_magnitude);
        expect(got.tier_without).toBe(expected.tier_without);
        expect(
          Math.abs(got.score_without - expected.score_without),
        ).toBeLessThanOrEqual(SCORE_TOLERANCE);
      }
    },
  );
});

describe("a number never travels without the set it was ranked against", () => {
  // "82nd percentile" reads as a claim about Indonesia. It is a rank against
  // the regions this deployment scored, so the size of that set has to ship
  // with it or the sentence overstates its own reach.
  it("reports the percentile basis alongside the percentile", () => {
    const r = buildPointRiskReport(data, -6.2, 106.8);
    expect(r.activity_percentile_basis.region_count).toBe(data.storedScores.length);
    expect(r.activity_percentile_basis.region_count).toBeGreaterThan(0);
  });

  it("compares against every reference anchor, not only the first", () => {
    const r = buildPointRiskReport(data, -6.2, 106.8);
    expect(r.comparison_set.map((c) => c.reference_city)).toEqual([
      "Jakarta",
      "Padang",
      "Palu",
    ]);
    // The singular `comparison` still anchors on Jakarta, unchanged.
    expect(r.comparison.reference_city).toBe("Jakarta");
    expect(r.comparison_set[0].relation).toBe(r.comparison.relation);
  });

  it("ranks a busy point above an anchor that a quiet point falls below", () => {
    const palu = buildPointRiskReport(data, -0.9, 119.87); // high-activity
    const surabaya = buildPointRiskReport(data, -7.25, 112.75); // low-activity
    expect(palu.event_count_m4_within_50km).toBeGreaterThan(
      surabaya.event_count_m4_within_50km,
    );

    const against = (r: typeof palu, city: string) =>
      r.comparison_set.find((c) => c.reference_city === city)!.relation;

    // Palu clears Jakarta's anchor; Surabaya sits under Padang's.
    expect(against(palu, "Jakarta")).toBe("higher");
    expect(against(surabaya, "Padang")).toBe("lower");
  });

  it("itemises the score for the same point the total describes", () => {
    const r = buildPointRiskReport(data, -0.9, 119.87);
    const sum = r.score_breakdown.reduce((a, c) => a + c.points, 0);
    expect(Math.abs(sum - r.composite_score)).toBeLessThanOrEqual(0.2);
    expect(r.score_breakdown).toHaveLength(4);
  });
});

describe("largest-event sensitivity", () => {
  // Palu: high activity, and a 2018 M7.5 that dominates the magnitude term.
  const palu = () => buildPointRiskReport(data, -0.9, 119.87);

  it("removes the largest event and reports a lower score", () => {
    const s = palu().largest_event_sensitivity!;
    expect(s).not.toBeNull();
    expect(s.score_without).toBeLessThan(palu().composite_score);
    expect(s.score_delta).toBeGreaterThan(0);
  });

  it("removes exactly one event, so the next largest is at most the removed one", () => {
    const s = palu().largest_event_sensitivity!;
    expect(s.next_largest_magnitude).not.toBeNull();
    expect(s.next_largest_magnitude!).toBeLessThanOrEqual(s.removed.magnitude);
  });

  it("names the event it removed, matching the largest in the scoring radius", () => {
    const r = palu();
    const s = r.largest_event_sensitivity!;
    // The 50km inner radius can hold a smaller max than the 100km scoring
    // radius, so compare against what the score actually used.
    const magnitudeTerm = r.score_breakdown.find((c) => c.key === "magnitude")!;
    expect(s.removed.magnitude).toBe(magnitudeTerm.basis.largest_magnitude);
    expect(s.removed.year).toBeGreaterThanOrEqual(1970);
  });

  it("agrees with the delta it reports", () => {
    const r = palu();
    const s = r.largest_event_sensitivity!;
    expect(Math.abs(r.composite_score - s.score_without - s.score_delta)).toBeLessThan(
      0.05,
    );
  });

  it("recomputes every input, not just magnitude", () => {
    // Holding the other three fixed would make the delta exactly the magnitude
    // term's drop. Removing an event also moves the M4 count and shallow ratio,
    // so the two must not coincide — this is what makes the counterfactual
    // honest rather than convenient.
    const r = palu();
    const s = r.largest_event_sensitivity!;
    const magTerm = r.score_breakdown.find((c) => c.key === "magnitude")!;
    const magnitudeOnlyDelta =
      magTerm.points -
      ((s.next_largest_magnitude! - 4.0) / 5.0) * magTerm.max_points;
    expect(Math.abs(s.score_delta - magnitudeOnlyDelta)).toBeGreaterThan(0);
  });

  it("declines to speculate where there is no record to remove", () => {
    // Deep Indian Ocean, far outside the Indonesian catalogue.
    const empty = buildPointRiskReport(data, -30, 80);
    expect(empty.largest_event_sensitivity).toBeNull();
  });
});
