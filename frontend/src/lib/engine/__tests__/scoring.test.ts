/**
 * pyRound has to agree with CPython's round() bit for bit, because composite
 * scores are compared against stored region scores to produce a percentile —
 * a step function where a 0.1 disagreement moves a user's reported rank.
 *
 * Expected values below were produced by the Python in the backend container:
 *   python -c "print(round(67.45, 1))"
 */
import { describe, expect, it } from "vitest";

import {
  computeCompositeScore,
  percentileRank,
  pyRound,
  scoreBreakdown,
  scoreInputsFromProfile,
  scoreToTier,
} from "../scoring";

describe("pyRound", () => {
  it.each([
    // [value, digits, expected]  — verified against CPython
    [67.45, 1, 67.5], // near-tie ABOVE the midpoint in binary → rounds up
    [80.45, 1, 80.5],
    [71.05, 1, 71.0], // near-tie BELOW the midpoint → rounds down
    [73.85, 1, 73.8],
    [69.25, 1, 69.2], // exact dyadic tie → half-to-even
    [0.5, 0, 0], // exact tie → 0 is even
    [1.5, 0, 2],
    [2.5, 0, 2],
    [37.5, 0, 38],
    [42.5, 0, 42], // half-to-even, where JS Math.round would give 43
    [102.135, 2, 102.14],
  ])("pyRound(%s, %s) === %s", (value, digits, expected) => {
    expect(pyRound(value as number, digits as number)).toBe(expected);
  });

  it("differs from Math.round exactly where Python does", () => {
    expect(pyRound(42.5)).toBe(42);
    expect(Math.round(42.5)).toBe(43);
  });
});

describe("scoreToTier", () => {
  it.each([
    [null, null],
    [0, "LOW"],
    [29.9, "LOW"],
    [30, "MODERATE"],
    [59.9, "MODERATE"],
    [60, "HIGH"],
    [100, "HIGH"],
  ])("scoreToTier(%s) === %s", (score, expected) => {
    expect(scoreToTier(score as number | null)).toBe(expected);
  });
});

describe("computeCompositeScore", () => {
  it("returns 0 for a location with no history and no nearby fault", () => {
    expect(
      computeCompositeScore({
        m4Count: 0,
        coverageYears: 0,
        largestMagnitude: null,
        shallowRatio: null,
        nearestFaultDistanceKm: null,
      }),
    ).toBe(0);
  });

  it("saturates each component at its documented weight", () => {
    // 10/yr is double the saturation rate, M9 is the top of the magnitude ramp,
    // all-shallow, and sitting on the fault: every component maxed = 100.
    expect(
      computeCompositeScore({
        m4Count: 500,
        coverageYears: 50,
        largestMagnitude: 9.0,
        shallowRatio: 1,
        nearestFaultDistanceKm: 0,
      }),
    ).toBe(100);
  });

  it("ignores a fault beyond the proximity range rather than going negative", () => {
    const far = computeCompositeScore({
      m4Count: 0,
      coverageYears: 10,
      largestMagnitude: null,
      shallowRatio: null,
      nearestFaultDistanceKm: 5000,
    });
    expect(far).toBe(0);
  });
});

describe("percentileRank", () => {
  it("returns 0 when nothing has been scored", () => {
    expect(percentileRank(50, [])).toBe(0);
  });

  it("counts scores at or below, inclusive", () => {
    expect(percentileRank(50, [10, 20, 50, 80])).toBe(75);
    expect(percentileRank(5, [10, 20, 50, 80])).toBe(0);
    expect(percentileRank(99, [10, 20, 50, 80])).toBe(100);
  });
});

describe("scoreBreakdown", () => {
  // The panel's whole claim is that a reader can check the arithmetic against
  // the documented rule, so these pin the rule, not just the output.
  const inputs = {
    m4Count: 120,
    coverageYears: 40, // 3.0/yr → 3/5 of the frequency weight
    largestMagnitude: 6.5, // (6.5-4)/5 = 0.5 → half the magnitude weight
    shallowRatio: 0.6,
    nearestFaultDistanceKm: 40, // (100-40)/100 = 0.6
  };

  it("itemises the four documented terms, in order", () => {
    expect(scoreBreakdown(inputs).map((c) => c.key)).toEqual([
      "frequency",
      "magnitude",
      "shallow",
      "proximity",
    ]);
  });

  it("resolves each term to the value its rule dictates", () => {
    const by = Object.fromEntries(scoreBreakdown(inputs).map((c) => [c.key, c]));
    expect(by.frequency.points).toBe(24); // 0.6 * 40
    expect(by.magnitude.points).toBe(15); // 0.5 * 30
    expect(by.shallow.points).toBe(9); // 0.6 * 15
    expect(by.proximity.points).toBe(9); // 0.6 * 15
    expect(by.frequency.max_points).toBe(40);
    expect(by.magnitude.max_points).toBe(30);
  });

  it("reports the input that drove each term, so the rule can be checked", () => {
    const by = Object.fromEntries(scoreBreakdown(inputs).map((c) => [c.key, c]));
    expect(by.frequency.basis.events_per_year).toBe(3);
    expect(by.magnitude.basis.largest_magnitude).toBe(6.5);
    expect(by.shallow.basis.shallow_ratio).toBe(0.6);
    expect(by.proximity.basis.nearest_fault_distance_km).toBe(40);
  });

  it("flags a term that has hit its ceiling and stopped differentiating", () => {
    const saturated = scoreBreakdown({ ...inputs, m4Count: 400 }); // 10/yr
    const frequency = saturated.find((c) => c.key === "frequency")!;
    expect(frequency.points).toBe(40);
    expect(frequency.saturated).toBe(true);
    expect(scoreBreakdown(inputs).find((c) => c.key === "frequency")!.saturated).toBe(
      false,
    );
  });

  it("sums to the composite score the engine reports", () => {
    const sum = scoreBreakdown(inputs).reduce((a, c) => a + c.points, 0);
    // Components round independently, hence the tolerance the UI copy warns of.
    expect(Math.abs(sum - computeCompositeScore(inputs))).toBeLessThanOrEqual(0.2);
  });

  it("contributes nothing for terms whose input is missing", () => {
    const empty = scoreBreakdown({
      m4Count: 0,
      coverageYears: 0,
      largestMagnitude: null,
      shallowRatio: null,
      nearestFaultDistanceKm: null,
    });
    expect(empty.every((c) => c.points === 0)).toBe(true);
    expect(empty.every((c) => !c.saturated)).toBe(true);
  });
});

describe("scoreInputsFromProfile", () => {
  // Values are Sukabumi's shipped profile. If reconstruction ever drifts, the
  // region page would itemise a score that disagrees with the one beside it.
  const sukabumi = {
    event_count_m4: 432,
    earliest_event_year: 1971,
    latest_event_year: 2026,
    largest_magnitude: 6.5,
    shallow_ratio: 0.4942263279445728,
    nearest_fault_distance_km: 53.99,
    composite_score: 69.3,
  };

  it("reproduces the stored composite score exactly", () => {
    const inputs = scoreInputsFromProfile(sukabumi)!;
    expect(inputs).not.toBeNull();
    expect(computeCompositeScore(inputs)).toBe(sukabumi.composite_score);
  });

  it("derives the coverage window inclusively", () => {
    expect(scoreInputsFromProfile(sukabumi)!.coverageYears).toBe(56); // 1971..2026
  });

  it("declines to itemise when an input is missing", () => {
    expect(scoreInputsFromProfile({ ...sukabumi, earliest_event_year: null })).toBeNull();
    expect(scoreInputsFromProfile({ ...sukabumi, event_count_m4: null })).toBeNull();
  });
});
