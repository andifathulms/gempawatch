/**
 * Pack the event catalogue into the binary the quake-field canvases draw.
 *
 * public/data/events.csv (written by `manage.py export_static`) is ~2 MB of
 * text and the risk engine's input. The homepage hero, region locators and
 * the /map scrubber only need where, how big, how deep and which year — so
 * this keeps M4.5+ events and packs each into 6 bytes:
 *
 *   uint16 LE  (lon − 94) × 20        0.05° ≈ 5.5 km — finer than a pixel
 *   uint8      (lat + 12) × 10        0.1°
 *   uint8      magnitude × 10
 *   uint8      min(255, depth_km / 3)
 *   uint8      year − 1960
 *
 * ~40k events → ~235 KB, served as /data/quakes.bin. Decoded by lib/quakes.ts;
 * change both together.
 *
 * Usage: node scripts/pack-quakes.mjs   (run by `npm run build:static`)
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "public/data/events.csv");
const OUT = path.join(ROOT, "public/data/quakes.bin");
const MIN_MAGNITUDE = 4.5;

const csv = await readFile(SRC, "utf8");
const [header, ...lines] = csv.trim().split(/\r?\n/);
const cols = header.split(",");
const idx = (name) => {
  const i = cols.indexOf(name);
  if (i < 0) throw new Error(`events.csv has no "${name}" column (got: ${header})`);
  return i;
};
const [iLon, iLat, iMag, iDepth, iYear] = ["lon", "lat", "mag", "depth", "year"].map(idx);

const rows = [];
for (const line of lines) {
  const f = line.split(",");
  const mag = Number(f[iMag]);
  if (!(mag >= MIN_MAGNITUDE)) continue;
  const lon = Math.round((Number(f[iLon]) - 94) * 20);
  const lat = Math.round((Number(f[iLat]) + 12) * 10);
  const year = Number(f[iYear]) - 1960;
  if (lon < 0 || lon > 65535 || lat < 0 || lat > 255 || year < 0 || year > 255) continue;
  const depth = Math.min(255, Math.max(0, Math.floor(Number(f[iDepth]) / 3)));
  rows.push([lon, lat, Math.round(mag * 10), depth, year]);
}

// Smallest first, so larger events paint on top without a client-side sort.
rows.sort((a, b) => a[2] - b[2]);

const buf = Buffer.alloc(rows.length * 6);
rows.forEach(([lon, lat, mag, depth, year], i) => {
  const o = i * 6;
  buf.writeUInt16LE(lon, o);
  buf.writeUInt8(lat, o + 2);
  buf.writeUInt8(mag, o + 3);
  buf.writeUInt8(depth, o + 4);
  buf.writeUInt8(year, o + 5);
});
await writeFile(OUT, buf);
console.log(`▸ packed ${rows.length} M${MIN_MAGNITUDE}+ events → public/data/quakes.bin (${(buf.length / 1024).toFixed(0)} KB)`);
