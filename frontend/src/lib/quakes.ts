/**
 * The quake field: every M4.5+ event since 1970, for canvases that draw the
 * record itself as the picture (homepage hero, region locators, the /map
 * year scrubber).
 *
 * Reads /data/quakes.bin, packed by scripts/pack-quakes.mjs — see that file
 * for the 6-byte layout; change both together. Events arrive sorted by
 * magnitude ascending, so drawing in array order paints large events on top.
 *
 * Static builds ship the file; a live build without it simply gets no field
 * (`loadQuakes` resolves to null) and callers render their paper ground only.
 */
import { depthBand, type DepthBand } from "./seismic";

export interface QuakeField {
  count: number;
  lon: Float32Array;
  lat: Float32Array;
  mag: Float32Array;
  /** 0 shallow, 1 intermediate, 2 deep — the same thresholds as depthBand(). */
  band: Uint8Array;
  year: Uint16Array;
}

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const BANDS: DepthBand[] = ["shallow", "mid", "deep"];

let cache: Promise<QuakeField | null> | null = null;

export function loadQuakes(): Promise<QuakeField | null> {
  if (!cache) {
    cache = fetch(`${BASE_PATH}/data/quakes.bin`)
      .then((r) => (r.ok ? r.arrayBuffer() : null))
      .then((buf) => (buf ? decode(new Uint8Array(buf)) : null))
      .catch(() => null);
  }
  return cache;
}

export function decode(bytes: Uint8Array): QuakeField {
  const count = Math.floor(bytes.length / 6);
  const f: QuakeField = {
    count,
    lon: new Float32Array(count),
    lat: new Float32Array(count),
    mag: new Float32Array(count),
    band: new Uint8Array(count),
    year: new Uint16Array(count),
  };
  for (let i = 0; i < count; i++) {
    const o = i * 6;
    f.lon[i] = (bytes[o] | (bytes[o + 1] << 8)) / 20 + 94;
    f.lat[i] = bytes[o + 2] / 10 - 12;
    f.mag[i] = bytes[o + 3] / 10;
    f.band[i] = BANDS.indexOf(depthBand(bytes[o + 4] * 3));
    f.year[i] = bytes[o + 5] + 1960;
  }
  return f;
}

/** [west, south, east, north] */
export type Bbox = [number, number, number, number];
export const INDONESIA_BBOX: Bbox = [94.5, -11.5, 141.5, 6.5];

export interface DrawOptions {
  bbox?: Bbox;
  /** Region of the canvas (CSS px) to fit the bbox into: [x, y, w, h]. */
  fit?: [number, number, number, number];
  /** Only events up to and including this year. */
  yearTo?: number;
  /** Outline this year's M5+ events. */
  highlightYear?: number;
  /**
   * Keep depth colour inside a radius around a point and fade everything
   * else to faint ink — shows exactly which events a 100 km profile counted.
   */
  focus?: { lon: number; lat: number; radiusKm: number };
  /** Dot size multiplier; defaults to one scaled from the map's zoom. */
  scale?: number;
  /** Fault polylines to draw as dashed ink, lon/lat pairs. */
  faults?: number[][][];
}

interface Palette {
  fills: [string, string, string];
  ink: string;
  paper: string;
  dark: boolean;
}

function readPalette(): Palette {
  const s = getComputedStyle(document.documentElement);
  const v = (n: string) => s.getPropertyValue(n).trim();
  return {
    fills: [v("--depth-shallow-fill"), v("--depth-mid-fill"), v("--depth-deep-fill")],
    ink: v("--ink"),
    paper: v("--paper"),
    dark: window.matchMedia("(prefers-color-scheme: dark)").matches,
  };
}

/**
 * Paint the field onto a canvas sized to its CSS box. Canvas cannot resolve
 * CSS variables, so the palette is read from the computed tokens at draw time
 * — callers redraw when the colour scheme changes.
 */
export function drawQuakes(canvas: HTMLCanvasElement, q: QuakeField | null, o: DrawOptions = {}) {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (!w || !h) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const g = canvas.getContext("2d");
  if (!g) return;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, w, h);
  if (!q) return;

  const p = readPalette();
  const [west, south, east, north] = o.bbox ?? INDONESIA_BBOX;
  const [fx, fy, fw, fh] = o.fit ?? [8, 8, w - 16, h - 16];
  const s = Math.min(fw / (east - west), fh / (north - south));
  const ox = fx + (fw - (east - west) * s) / 2;
  const oy = fy + (fh - (north - south) * s) / 2;
  const X = (lon: number) => ox + (lon - west) * s;
  const Y = (lat: number) => oy + (north - lat) * s;
  const k = o.scale ?? Math.max(0.55, Math.min(1.6, s / 26));
  const radius = (m: number) => Math.max(0.7, (0.5 + Math.pow(m - 4.4, 1.55) * 1.05) * k);
  const yearTo = o.yearTo ?? 9999;

  // On paper, overlapping dots multiply into darker density. On graphite,
  // additive blending blew dense arcs out to white and lost the depth colour,
  // so Malam paints plainly at a lower alpha instead.
  g.globalCompositeOperation = p.dark ? "source-over" : "multiply";
  const focusR = o.focus ? o.focus.radiusKm / 111 : 0;
  const cosLat = o.focus ? Math.cos((o.focus.lat * Math.PI) / 180) : 1;

  for (let i = 0; i < q.count; i++) {
    if (q.year[i] > yearTo) continue;
    const lon = q.lon[i];
    const lat = q.lat[i];
    if (lon < west - 1 || lon > east + 1 || lat < south - 1 || lat > north + 1) continue;
    const m = q.mag[i];
    let outside = false;
    if (o.focus) {
      const dx = (lon - o.focus.lon) * cosLat;
      const dy = lat - o.focus.lat;
      outside = dx * dx + dy * dy > focusR * focusR;
    }
    g.globalAlpha = outside ? (p.dark ? 0.14 : 0.1) : m >= 6 ? 0.85 : m >= 5 ? (p.dark ? 0.6 : 0.6) : p.dark ? 0.32 : 0.38;
    g.fillStyle = outside ? p.ink : p.fills[q.band[i]];
    g.beginPath();
    g.arc(X(lon), Y(lat), radius(m), 0, Math.PI * 2);
    g.fill();
  }
  g.globalCompositeOperation = "source-over";

  if (o.highlightYear != null) {
    g.globalAlpha = 0.9;
    g.strokeStyle = p.ink;
    g.lineWidth = 1.2;
    for (let i = 0; i < q.count; i++) {
      if (q.year[i] !== o.highlightYear || q.mag[i] < 5) continue;
      g.beginPath();
      g.arc(X(q.lon[i]), Y(q.lat[i]), radius(q.mag[i]) + 2.5, 0, Math.PI * 2);
      g.stroke();
    }
  }

  if (o.faults?.length) {
    g.globalAlpha = 0.75;
    g.strokeStyle = p.ink;
    g.lineWidth = 1.3;
    g.setLineDash([5, 4]);
    for (const line of o.faults) {
      g.beginPath();
      line.forEach(([lon, lat], j) => (j ? g.lineTo(X(lon), Y(lat)) : g.moveTo(X(lon), Y(lat))));
      g.stroke();
    }
    g.setLineDash([]);
  }

  if (o.focus) {
    const cx = X(o.focus.lon);
    const cy = Y(o.focus.lat);
    g.globalAlpha = 1;
    g.strokeStyle = p.ink;
    g.lineWidth = 1.2;
    g.setLineDash([4, 4]);
    g.beginPath();
    // A degree of longitude shrinks by cos(lat); the radius in degrees of
    // longitude grows by the same factor, so the circle is an ellipse here.
    g.ellipse(cx, cy, (focusR / cosLat) * s, focusR * s, 0, 0, Math.PI * 2);
    g.stroke();
    g.setLineDash([]);
    g.fillStyle = p.paper;
    g.beginPath();
    g.arc(cx, cy, 7, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = p.ink;
    g.beginPath();
    g.arc(cx, cy, 4.5, 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;
}

/** Count of events up to a year — for "N gempa tercatat hingga YYYY" labels. */
export function countThrough(q: QuakeField, year: number): number {
  let n = 0;
  for (let i = 0; i < q.count; i++) if (q.year[i] <= year) n++;
  return n;
}
