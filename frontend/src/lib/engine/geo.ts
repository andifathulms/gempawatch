/**
 * Spherical geometry helpers for the client-side risk engine.
 *
 * These stand in for the PostGIS calls the Django engine makes. PostGIS
 * measures geodetic distance on a sphere of this radius (ST_DistanceSphere),
 * so we use the same constant rather than a WGS84 semi-major axis — matching
 * the reference implementation matters more than absolute geodetic accuracy.
 */
export const EARTH_RADIUS_KM = 6371.0087714;

const toRad = (deg: number) => (deg * Math.PI) / 180;

export interface LonLat {
  lon: number;
  lat: number;
}

/** Great-circle distance between two lon/lat points, in kilometres. */
export function haversineKm(
  lon1: number,
  lat1: number,
  lon2: number,
  lat2: number,
): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

/**
 * Cheap squared-distance proxy used to reject far-away events before paying for
 * a haversine. Equirectangular approximation, always an *under*estimate of the
 * true distance at these latitudes, so it can be used as a safe pre-filter.
 */
function approxKmSq(
  lon1: number,
  lat1: number,
  lon2: number,
  lat2: number,
  cosLat: number,
): number {
  const x = (lon2 - lon1) * cosLat * 111.32;
  const y = (lat2 - lat1) * 110.574;
  return x * x + y * y;
}

/** Convert lon/lat degrees to a unit vector on the sphere. */
function toVec(lon: number, lat: number): [number, number, number] {
  const la = toRad(lat);
  const lo = toRad(lon);
  const c = Math.cos(la);
  return [c * Math.cos(lo), c * Math.sin(lo), Math.sin(la)];
}

const dot = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

const cross = (a: number[], b: number[]): [number, number, number] => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

function norm(v: number[]): [number, number, number] {
  const m = Math.sqrt(dot(v, v));
  return m === 0 ? [0, 0, 0] : [v[0] / m, v[1] / m, v[2] / m];
}

/**
 * Distance in km from a point to the great-circle arc A→B, clamped to the
 * segment. Done in 3D rather than by projecting to a plane so that long fault
 * segments (the Sunda Megathrust spans thousands of km) stay accurate.
 */
export function pointToSegmentKm(
  plon: number,
  plat: number,
  alon: number,
  alat: number,
  blon: number,
  blat: number,
): number {
  const p = toVec(plon, plat);
  const a = toVec(alon, alat);
  const b = toVec(blon, blat);

  const axb = cross(a, b);
  if (Math.sqrt(dot(axb, axb)) < 1e-12) {
    // Degenerate segment (A and B coincide) — fall back to endpoint distance.
    return haversineKm(plon, plat, alon, alat);
  }

  const n = norm(axb);
  // Foot of the perpendicular from p onto the great circle through a and b.
  const foot = norm([
    p[0] - dot(p, n) * n[0],
    p[1] - dot(p, n) * n[1],
    p[2] - dot(p, n) * n[2],
  ]);

  // Inside the arc only if the foot lies between a and b on that circle.
  const withinA = dot(cross(a, foot), n) >= 0;
  const withinB = dot(cross(foot, b), n) >= 0;
  if (withinA && withinB) {
    return EARTH_RADIUS_KM * Math.acos(Math.min(1, Math.max(-1, dot(p, foot))));
  }

  return Math.min(
    haversineKm(plon, plat, alon, alat),
    haversineKm(plon, plat, blon, blat),
  );
}

/** Minimum distance in km from a point to a LineString (array of [lon, lat]). */
export function pointToLineStringKm(
  lon: number,
  lat: number,
  coords: [number, number][],
): number {
  if (coords.length === 0) return Number.POSITIVE_INFINITY;
  if (coords.length === 1) {
    return haversineKm(lon, lat, coords[0][0], coords[0][1]);
  }
  let best = Number.POSITIVE_INFINITY;
  for (let i = 0; i < coords.length - 1; i++) {
    const d = pointToSegmentKm(
      lon,
      lat,
      coords[i][0],
      coords[i][1],
      coords[i + 1][0],
      coords[i + 1][1],
    );
    if (d < best) best = d;
  }
  return best;
}

/**
 * Minimum distance in km from a point to a LineString or MultiLineString
 * geometry, matching how PostGIS treats either as one shape.
 */
export function pointToGeometryKm(
  lon: number,
  lat: number,
  geometry: { type: string; coordinates: unknown },
): number {
  if (geometry.type === "LineString") {
    return pointToLineStringKm(lon, lat, geometry.coordinates as [number, number][]);
  }
  if (geometry.type === "MultiLineString") {
    const parts = geometry.coordinates as [number, number][][];
    return Math.min(...parts.map((c) => pointToLineStringKm(lon, lat, c)));
  }
  if (geometry.type === "Point") {
    const [x, y] = geometry.coordinates as [number, number];
    return haversineKm(lon, lat, x, y);
  }
  return Number.POSITIVE_INFINITY;
}

export { approxKmSq };
