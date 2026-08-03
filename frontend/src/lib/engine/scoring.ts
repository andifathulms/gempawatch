/**
 * Port of backend/apps/regions/scoring.py.
 *
 * Python is the source of truth. Any change to the weights or thresholds must
 * be made there first, fixtures regenerated, and this file brought back in line
 * — the golden-fixture suite fails until it is.
 *
 * Components (weights sum to 100):
 *   frequency  (0–40)  events M4+ per year within 100km, saturating at 5/yr
 *   magnitude  (0–30)  largest recorded magnitude, mapped M4→0 … M9→30
 *   shallow    (0–15)  share of nearby events shallower than 70km
 *   proximity  (0–15)  closeness to nearest fault, full within ~10km, 0 by 100km
 */
export const FREQUENCY_WEIGHT = 40;
export const MAGNITUDE_WEIGHT = 30;
export const SHALLOW_WEIGHT = 15;
export const PROXIMITY_WEIGHT = 15;

export const FREQUENCY_SATURATION_PER_YEAR = 5.0;
export const FAULT_PROXIMITY_RANGE_KM = 100.0;

export const HIGH_THRESHOLD = 60;
export const MODERATE_THRESHOLD = 30;

export interface ScoreInputs {
  m4Count: number;
  coverageYears: number;
  largestMagnitude: number | null;
  shallowRatio: number | null;
  nearestFaultDistanceKm: number | null;
}

/**
 * Replicate Python's round() exactly.
 *
 * Both Python's round() and JS toFixed() round the *true binary value* of the
 * double, so they already agree everywhere except exact ties, where Python
 * rounds half-to-even and toFixed rounds half-away-from-zero.
 *
 * The subtlety that makes this worth spelling out: "exact tie" means the
 * double's real value sits precisely on the midpoint, which is far rarer than
 * a decimal literal ending in 5 suggests. Python gives round(67.45, 1) = 67.5
 * because 67.45 is really 67.450000000000002842…, above the midpoint — while
 * round(69.25, 1) = 69.2 because 69.25 is dyadic and therefore a true tie.
 * Testing `scaled - floor === 0.5` cannot tell those apart, since multiplying
 * by 10 can round a near-tie onto the midpoint. So the check is done on the
 * exact decimal expansion instead.
 */
function isExactTie(value: number, digits: number): boolean {
  // 20 decimals is far more than enough to separate a true tie from a near one:
  // for values in this range, neighbouring doubles differ by ~1e-14.
  const frac = Math.abs(value).toFixed(20).split(".")[1] ?? "";
  const rest = frac.slice(digits);
  return rest.startsWith("5") && /^0*$/.test(rest.slice(1));
}

export function pyRound(value: number, digits = 0): number {
  if (!Number.isFinite(value)) return value;

  if (!isExactTie(value, digits)) {
    return Number(value.toFixed(digits));
  }

  // True tie: round half to even, working from the decimal string so no
  // intermediate multiplication can perturb the value.
  const sign = value < 0 ? -1 : 1;
  const [intPart, frac = ""] = Math.abs(value).toFixed(20).split(".");
  const truncated = intPart + frac.slice(0, digits);
  const lower = BigInt(truncated);
  const rounded = lower % 2n === 0n ? lower : lower + 1n;
  return (sign * Number(rounded)) / 10 ** digits;
}

function frequencyComponent(m4Count: number, coverageYears: number): number {
  if (coverageYears <= 0) return 0;
  const perYear = m4Count / coverageYears;
  return Math.min(1, perYear / FREQUENCY_SATURATION_PER_YEAR) * FREQUENCY_WEIGHT;
}

function magnitudeComponent(largestMagnitude: number | null): number {
  if (!largestMagnitude) return 0;
  const frac = Math.max(0, Math.min(1, (largestMagnitude - 4.0) / 5.0));
  return frac * MAGNITUDE_WEIGHT;
}

function shallowComponent(shallowRatio: number | null): number {
  if (shallowRatio === null || shallowRatio === undefined) return 0;
  return Math.max(0, Math.min(1, shallowRatio)) * SHALLOW_WEIGHT;
}

function proximityComponent(distanceKm: number | null): number {
  if (distanceKm === null || distanceKm === undefined) return 0;
  const frac = Math.max(
    0,
    (FAULT_PROXIMITY_RANGE_KM - distanceKm) / FAULT_PROXIMITY_RANGE_KM,
  );
  return frac * PROXIMITY_WEIGHT;
}

/** Return a 0–100 composite seismic-activity score. */
export function computeCompositeScore(inputs: ScoreInputs): number {
  const score =
    frequencyComponent(inputs.m4Count, inputs.coverageYears) +
    magnitudeComponent(inputs.largestMagnitude) +
    shallowComponent(inputs.shallowRatio) +
    proximityComponent(inputs.nearestFaultDistanceKm);
  return pyRound(score, 1);
}

export function scoreToTier(score: number | null): string | null {
  if (score === null || score === undefined) return null;
  if (score >= HIGH_THRESHOLD) return "HIGH";
  if (score >= MODERATE_THRESHOLD) return "MODERATE";
  return "LOW";
}

/** Percent of regions scoring at or below this score (0–100). */
export function percentileRank(score: number, allScores: number[]): number {
  if (allScores.length === 0) return 0;
  const atOrBelow = allScores.filter((s) => s <= score).length;
  return pyRound((atOrBelow / allScores.length) * 100);
}
