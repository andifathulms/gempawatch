/**
 * pyRound has to agree with CPython's round() bit for bit, because composite
 * scores are compared against stored region scores to produce a percentile —
 * a step function where a 0.1 disagreement moves a user's reported rank.
 *
 * Expected values below were produced by the Python in the backend container:
 *   python -c "print(round(67.45, 1))"
 */
import { describe, expect, it } from "vitest";

import { computeCompositeScore, percentileRank, pyRound, scoreToTier } from "../scoring";

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
