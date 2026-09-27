/**
 * Build public/boundaries/regions.geojson — the outline of every scored
 * region, for the "Skor per wilayah" shading on /map.
 *
 * The admin-region seed data has centroids only, so boundaries come from
 * geoBoundaries (gbOpen IDN ADM2, 2020 kabupaten/kota lines from BPS via
 * WFP/OCHA ROAP), licensed CC BY 3.0 IGO — the map credits it whenever the
 * layer is on, and /about lists it under sources. The URL is pinned to a
 * release commit so a rerun reproduces the committed file.
 *
 * Matching: a region of type "kota" is geoBoundaries' "Kota <name>", a
 * kabupaten is its plain name. Every match is then checked against the
 * region's own centroid (inside the polygon, or within 0.3° of its bounds for
 * coastal centroids that sit just offshore); a miss fails the build loudly
 * rather than shading the wrong place.
 *
 * Shapes are simplified (Ramer-Douglas-Peucker, 0.004° ≈ 450 m) and rounded
 * to 4 decimals: invisible at the zoom levels the map allows, and ~50× smaller.
 *
 * Usage: node scripts/build-boundaries.mjs   (needs public/api from export_static)
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE =
  "https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/IDN/ADM2/geoBoundaries-IDN-ADM2_simplified.geojson";
const OUT = path.join(ROOT, "public/boundaries/regions.geojson");
const TOLERANCE = 0.004;

const regions = JSON.parse(await readFile(path.join(ROOT, "public/api/regions/index.json"), "utf8")).results;
const source = await (await fetch(SOURCE)).json();
const byName = new Map(source.features.map((f) => [f.properties.shapeName.toLowerCase(), f]));

function shapeNameFor(region) {
  if (region.type !== "kota") return region.name;
  return region.name.startsWith("Kota ") ? region.name : `Kota ${region.name}`;
}

// --- geometry helpers -------------------------------------------------------
function perpDist([x, y], [x1, y1], [x2, y2]) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (!dx && !dy) return Math.hypot(x - x1, y - y1);
  const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy));
}
function rdp(points, eps) {
  if (points.length < 3) return points;
  let max = 0;
  let idx = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpDist(points[i], points[0], points[points.length - 1]);
    if (d > max) {
      max = d;
      idx = i;
    }
  }
  if (max <= eps) return [points[0], points[points.length - 1]];
  return [...rdp(points.slice(0, idx + 1), eps).slice(0, -1), ...rdp(points.slice(idx), eps)];
}
const round = (v) => Math.round(v * 1e4) / 1e4;
function simplifyRing(ring) {
  const s = rdp(ring, TOLERANCE).map(([x, y]) => [round(x), round(y)]);
  return s.length >= 4 ? s : null; // a ring needs 3 distinct points + closure
}
function polygons(geom) {
  return geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
}
function pointInRing([x, y], ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// --- build ------------------------------------------------------------------
const features = [];
const failures = [];
for (const region of regions) {
  const f = byName.get(shapeNameFor(region).toLowerCase());
  if (!f) {
    failures.push(`${region.name}: no geoBoundaries shape named "${shapeNameFor(region)}"`);
    continue;
  }
  const pt = [region.longitude, region.latitude];
  const polys = polygons(f.geometry);
  const inside = polys.some((p) => pointInRing(pt, p[0]));
  const xs = polys.flatMap((p) => p[0].map((c) => c[0]));
  const ys = polys.flatMap((p) => p[0].map((c) => c[1]));
  const near =
    pt[0] > Math.min(...xs) - 0.3 && pt[0] < Math.max(...xs) + 0.3 && pt[1] > Math.min(...ys) - 0.3 && pt[1] < Math.max(...ys) + 0.3;
  if (!inside && !near) {
    failures.push(`${region.name}: centroid ${pt} is nowhere near "${f.properties.shapeName}"`);
    continue;
  }
  const simplified = polys
    .map((p) => p.map(simplifyRing).filter(Boolean))
    .filter((p) => p.length && p[0]);
  // Keep at least the largest original polygon if simplification erased all.
  const coords = simplified.length ? simplified : [polys[0].map((r) => r.map(([x, y]) => [round(x), round(y)]))];
  features.push({
    type: "Feature",
    properties: { slug: region.slug },
    geometry: { type: "MultiPolygon", coordinates: coords },
  });
}

if (failures.length) {
  console.error(`✗ ${failures.length} region(s) could not be matched:\n  ${failures.join("\n  ")}`);
  process.exit(1);
}

const out = {
  type: "FeatureCollection",
  attribution:
    "Batas wilayah: geoBoundaries (gbOpen IDN ADM2, BPS / WFP / OCHA ROAP), CC BY 3.0 IGO",
  features,
};
await mkdir(path.dirname(OUT), { recursive: true });
const json = JSON.stringify(out);
await writeFile(OUT, json);
console.log(`▸ ${features.length} region outlines → public/boundaries/regions.geojson (${(json.length / 1024).toFixed(0)} KB)`);
