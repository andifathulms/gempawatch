/**
 * Port of backend/apps/regions/report.py — the single-point risk report that
 * powers the "Am I In a Risk Zone?" tool when the site runs without a backend.
 *
 * Python is the source of truth; see __tests__/report.test.ts, which replays
 * golden fixtures generated from the Django implementation.
 *
 * IMPORTANT: this is a historical-pattern indicator, never a prediction, and
 * never a tsunami warning. The prose below is kept identical to the Python
 * version so both deployment modes say exactly the same thing to users.
 */
import type { EngineData } from "./dataset";
import { haversineKm, pointToGeometryKm } from "./geo";
import {
  computeCompositeScore,
  percentileRank,
  pyRound,
  scoreBreakdown,
  scoreToTier,
} from "./scoring";

/**
 * Jakarta stays first because `comparison` (singular) anchors on it: it is the
 * city most readers have a feel for, and a low-activity anchor. Padang and Palu
 * were declared here and never read — every comparison sentence on the site
 * said "dibanding Jakarta" while the code implied a richer set. They are now
 * used, in `comparison_set`, because one anchor cannot tell you whether you are
 * near the quiet end or the active end of Indonesia's range.
 */
export const REFERENCE_CITIES = [
  { name: "Jakarta", m4Count: 25 },
  { name: "Padang", m4Count: 220 },
  { name: "Palu", m4Count: 180 },
];

const RELATION_ID: Record<string, string> = {
  higher: "lebih tinggi",
  lower: "lebih rendah",
  similar: "serupa",
};

const METHODOLOGY_NOTE =
  "Indikator pola historis, bukan prediksi. Skor menimbang frekuensi, " +
  "magnitudo terbesar, proporsi gempa dangkal, dan jarak ke sesar dalam " +
  "radius 100km; jumlah M4+ dihitung dalam radius 50km. Persentil " +
  "membandingkan lokasi ini dengan wilayah lain di basis data. Jumlah " +
  "kejadian tidak dinormalisasi terhadap luas/populasi. Bukan sistem " +
  "peringatan dini tsunami — selalu rujuk peringatan resmi BMKG.";

const SOURCE_ATTRIBUTION = [
  "Data: Badan Meteorologi, Klimatologi, dan Geofisika (BMKG)",
  "Data: United States Geological Survey (USGS)",
];

/**
 * Density band from the RAW M4+ count within 50km.
 *
 * Deliberately not the same question as scoreToTier(), which runs the weighted
 * composite over 100km. Different input, different radius, different thresholds
 * — so the two can and do disagree, and anything rendering both must say which
 * is which rather than showing two bare risk words.
 */
function riskBand(m4Count: number): string {
  if (m4Count >= 150) return "HIGH";
  if (m4Count >= 40) return "MODERATE";
  return "LOW";
}

function relationTo(m4Count: number, referenceCount: number): string {
  if (m4Count > referenceCount * 1.25) return "higher";
  if (m4Count < referenceCount * 0.75) return "lower";
  return "similar";
}

/** The same comparison against every reference anchor, not just Jakarta. */
function comparisonSet(m4Count: number) {
  return REFERENCE_CITIES.map((ref) => ({
    reference_city: ref.name,
    reference_m4_count: ref.m4Count,
    relation: relationTo(m4Count, ref.m4Count),
  }));
}

function compareToReference(m4Count: number) {
  const reference = REFERENCE_CITIES[0];
  const relation = relationTo(m4Count, reference.m4Count);
  return {
    reference_city: reference.name,
    relation,
    text:
      `Risiko historis lokasi ini ${RELATION_ID[relation]} ` +
      `dibanding ${reference.name}.`,
  };
}

interface RadiusStats {
  total: number;
  m4Count: number;
  shallowCount: number;
  largest: number | null;
  earliestYear: number | null;
  latestYear: number | null;
  tsunamiQualifying: number;
}

/**
 * Single pass over the event set collecting every aggregate the report needs.
 *
 * Django issues six separate spatial queries here; doing that as six scans of a
 * 70k-element array would be wasteful, so the radii are evaluated together. A
 * cheap bounding-box reject skips the haversine for the ~99% of events nowhere
 * near the query point.
 */
function scanRadii(
  data: EngineData,
  lat: number,
  lon: number,
  innerKm: number,
  outerKm: number,
  tsunamiKm: number,
  tsunamiMaxDepth: number,
  tsunamiMinMag: number,
): { inner: RadiusStats; outer: RadiusStats } {
  const e = data.events;
  const maxKm = Math.max(innerKm, outerKm, tsunamiKm);

  // Degree-space bounding box around the widest radius, padded for safety.
  const dLat = maxKm / 110.574 + 0.05;
  const cosLat = Math.max(0.01, Math.cos((lat * Math.PI) / 180));
  const dLon = maxKm / (111.32 * cosLat) + 0.05;
  const latMin = lat - dLat;
  const latMax = lat + dLat;
  const lonMin = lon - dLon;
  const lonMax = lon + dLon;

  const inner: RadiusStats = {
    total: 0,
    m4Count: 0,
    shallowCount: 0,
    largest: null,
    earliestYear: null,
    latestYear: null,
    tsunamiQualifying: 0,
  };
  const outer: RadiusStats = { ...inner };

  for (let i = 0; i < e.count; i++) {
    const elat = e.lat[i];
    if (elat < latMin || elat > latMax) continue;
    const elon = e.lon[i];
    if (elon < lonMin || elon > lonMax) continue;

    const d = haversineKm(lon, lat, elon, elat);
    if (d > maxKm) continue;

    const mag = e.mag[i];
    const depth = e.depth[i];
    const year = e.year[i];

    if (d <= innerKm) {
      inner.total++;
      if (mag >= 4.0) inner.m4Count++;
      if (inner.largest === null || mag > inner.largest) inner.largest = mag;
    }

    if (d <= outerKm) {
      outer.total++;
      if (mag >= 4.0) outer.m4Count++;
      if (outer.largest === null || mag > outer.largest) outer.largest = mag;
      if (!Number.isNaN(depth) && depth < 70) outer.shallowCount++;
      if (outer.earliestYear === null || year < outer.earliestYear) {
        outer.earliestYear = year;
      }
      if (outer.latestYear === null || year > outer.latestYear) {
        outer.latestYear = year;
      }
    }

    if (
      d <= tsunamiKm &&
      !Number.isNaN(depth) &&
      depth < tsunamiMaxDepth &&
      mag >= tsunamiMinMag
    ) {
      outer.tsunamiQualifying++;
    }
  }

  return { inner, outer };
}

/**
 * Recompute the score with the single largest nearby event removed.
 *
 * The magnitude term is driven by an extremum, not an average, so exactly one
 * row in a 69k-event catalog can move up to 30 of the 100 points — and it never
 * decays, so a single afternoon in 1976 can still be most of what a place's
 * score says today. Whether a score rests on a sustained pattern or on one bad
 * day is a genuinely different risk story, and the composite flattens both into
 * the same number.
 *
 * Removal is honest rather than convenient: dropping the event changes the M4
 * count, the shallow ratio and possibly the observed year span too, so all four
 * inputs are recomputed instead of holding three fixed and moving magnitude
 * alone. That distinction matters most exactly where the counterfactual is most
 * interesting — a sparse area where the big one is also a large share of the
 * whole record.
 *
 * Ties are broken by first encounter, so the result is deterministic.
 *
 * Returns null when there is nothing to remove, or when removing it would leave
 * no events at all — there is no meaningful "without it" for a record of one.
 */
function largestEventCounterfactual(
  data: EngineData,
  lat: number,
  lon: number,
  radiusKm: number,
  largestMagnitude: number | null,
  faultDistanceKm: number | null,
  baseScore: number,
) {
  if (largestMagnitude === null) return null;

  const e = data.events;
  const dLat = radiusKm / 110.574 + 0.05;
  const cosLat = Math.max(0.01, Math.cos((lat * Math.PI) / 180));
  const dLon = radiusKm / (111.32 * cosLat) + 0.05;

  let total = 0;
  let m4Count = 0;
  let shallowCount = 0;
  let secondLargest: number | null = null;
  let earliestYear: number | null = null;
  let latestYear: number | null = null;
  let removedYear: number | null = null;
  let removedDepth = Number.NaN;
  let skipped = false;

  for (let i = 0; i < e.count; i++) {
    const elat = e.lat[i];
    if (elat < lat - dLat || elat > lat + dLat) continue;
    const elon = e.lon[i];
    if (elon < lon - dLon || elon > lon + dLon) continue;
    if (haversineKm(lon, lat, elon, elat) > radiusKm) continue;

    const mag = e.mag[i];
    // Drop exactly one event: the first encountered at the maximum magnitude.
    if (!skipped && mag === largestMagnitude) {
      skipped = true;
      removedYear = e.year[i];
      removedDepth = e.depth[i];
      continue;
    }

    total++;
    if (mag >= 4.0) m4Count++;
    if (!Number.isNaN(e.depth[i]) && e.depth[i] < 70) shallowCount++;
    if (secondLargest === null || mag > secondLargest) secondLargest = mag;
    const year = e.year[i];
    if (earliestYear === null || year < earliestYear) earliestYear = year;
    if (latestYear === null || year > latestYear) latestYear = year;
  }

  if (!skipped || total === 0) return null;

  const coverageYears =
    earliestYear && latestYear ? latestYear - earliestYear + 1 : 0;
  const withoutScore = computeCompositeScore({
    m4Count,
    coverageYears,
    largestMagnitude: secondLargest,
    shallowRatio: total ? shallowCount / total : null,
    nearestFaultDistanceKm: faultDistanceKm,
  });

  return {
    removed: {
      magnitude: largestMagnitude,
      year: removedYear,
      depth_km: Number.isNaN(removedDepth) ? null : removedDepth,
    },
    next_largest_magnitude: secondLargest,
    score_without: withoutScore,
    score_delta: pyRound(baseScore - withoutScore, 1),
    tier_without: scoreToTier(withoutScore),
  };
}

export function nearestRegion(data: EngineData, lat: number, lon: number) {
  let best: EngineData["regions"][number] | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const region of data.regions) {
    const d = haversineKm(lon, lat, region.longitude, region.latitude);
    if (d < bestDistance) {
      bestDistance = d;
      best = region;
    }
  }
  return best;
}

export function nearestFault(data: EngineData, lat: number, lon: number) {
  let best: EngineData["faults"][number] | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const fault of data.faults) {
    const d = pointToGeometryKm(lon, lat, fault.geometry);
    if (d < bestDistance) {
      bestDistance = d;
      best = fault;
    }
  }
  if (!best) return { fault: null, distanceKm: null };
  return { fault: best, distanceKm: pyRound(bestDistance, 2) };
}

/** Compute the full risk report for arbitrary coordinates. */
export function buildPointRiskReport(
  data: EngineData,
  latitude: number,
  longitude: number,
) {
  const c = data.constants;

  const { inner, outer } = scanRadii(
    data,
    latitude,
    longitude,
    c.risk_check_radius_km,
    c.score_radius_km,
    c.tsunami_search_radius_km,
    c.tsunami_max_depth_km,
    c.tsunami_min_magnitude,
  );

  const region = nearestRegion(data, latitude, longitude);
  const { fault, distanceKm } = nearestFault(data, latitude, longitude);

  const isCoastal = Boolean(region && region.is_coastal);
  let tsunamiTier: string | null = null;
  if (isCoastal) {
    if (outer.tsunamiQualifying >= c.tsunami_high_threshold) {
      tsunamiTier = "HIGH";
    } else if (outer.tsunamiQualifying >= c.tsunami_moderate_threshold) {
      tsunamiTier = "MODERATE";
    } else {
      tsunamiTier = "LOW";
    }
  }

  const shallowRatio = outer.total ? outer.shallowCount / outer.total : null;
  const coverageYears =
    outer.earliestYear && outer.latestYear
      ? outer.latestYear - outer.earliestYear + 1
      : 0;

  const scoreInputs = {
    m4Count: outer.m4Count,
    coverageYears,
    largestMagnitude: outer.largest,
    shallowRatio,
    nearestFaultDistanceKm: distanceKm,
  };
  const compositeScore = computeCompositeScore(scoreInputs);

  const activityPercentile = data.storedScores.length
    ? percentileRank(compositeScore, data.storedScores)
    : null;
  // The percentile ranks against the regions this deployment has scored — NOT
  // against Indonesia, and not against a random sample of it. Reported as a
  // bare "82nd percentile" it reads as national, which is a claim the number
  // cannot support, so the size of the comparison set travels with it.
  const activityPercentileBasis = { region_count: data.storedScores.length };

  return {
    composite_score: compositeScore,
    score_breakdown: scoreBreakdown(scoreInputs),
    activity_tier: scoreToTier(compositeScore),
    activity_percentile: activityPercentile,
    activity_percentile_basis: activityPercentileBasis,
    query: { latitude, longitude },
    nearest_region: region
      ? { id: region.id, name: region.name, slug: region.slug, type: region.type }
      : null,
    event_count_m4_within_50km: inner.m4Count,
    largest_magnitude_within_50km: inner.largest,
    overall_risk_band: riskBand(inner.m4Count),
    nearest_fault: fault
      ? { id: fault.id, name: fault.name, distance_km: distanceKm }
      : null,
    tsunami_risk_tier: tsunamiTier,
    comparison: compareToReference(inner.m4Count),
    comparison_set: comparisonSet(inner.m4Count),
    largest_event_sensitivity: largestEventCounterfactual(
      data,
      latitude,
      longitude,
      c.score_radius_km,
      outer.largest,
      distanceKm,
      compositeScore,
    ),
    data_coverage: {
      earliest_year: outer.earliestYear,
      latest_year: outer.latestYear,
      years: coverageYears,
    },
    methodology_note: METHODOLOGY_NOTE,
    source_attribution: SOURCE_ATTRIBUTION,
  };
}

export type PointRiskReport = ReturnType<typeof buildPointRiskReport>;
