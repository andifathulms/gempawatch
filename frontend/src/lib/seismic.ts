// Shared visual encoding for earthquake data — magnitude → size, depth → colour.
// Kept in one place so the map, badges, charts, and share cards stay consistent.
//
// Two colour roles per semantic value, and they are not interchangeable:
//   *Fill  — solid shapes (badge backgrounds, map markers, gauge arcs), read
//            against dark text or nothing.
//   base   — text and thin strokes on a charcoal background, where the fill
//            tones are too dim to clear WCAG AA.

export function magnitudeSize(mag: number): number {
  return Math.max(24, Math.min(64, mag * 8));
}

/** Shallow quakes do the damage, so shallow is the alarming end of the ramp. */
export function depthColor(depthKm: number): string {
  if (depthKm < 30) return "#C0392B"; // shallow — most destructive
  if (depthKm < 100) return "#E8743B"; // intermediate
  return "#5B93B8"; // deep — felt less at the surface
}

/** Legend rows for anything that encodes depth by colour. */
export const DEPTH_BANDS = [
  { color: "#C0392B", label: "Dangkal", detail: "< 30 km" },
  { color: "#E8743B", label: "Menengah", detail: "30–100 km" },
  { color: "#5B93B8", label: "Dalam", detail: "> 100 km" },
] as const;

/**
 * Readable foreground for text sitting *on* one of the solid fills above.
 *
 * The fills span a wide luminance range — the HIGH red is dark enough that the
 * near-black ink used everywhere else only reaches 3.5:1 on it (a WCAG AA
 * failure for the 14px figures in magnitude badges and leaderboard chips),
 * while the amber is light enough that white would fail just as badly. Rather
 * than hand-pick per swatch and re-check every time the palette moves, this
 * computes the relative luminance and returns whichever of ink or paper wins.
 */
const INK = "#121110";
const PAPER = "#F5F1EA";

function relativeLuminance(hex: string): number {
  const n = parseInt(hex.replace("#", ""), 16);
  const channels = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(a: string, b: string): number {
  const [x, y] = [relativeLuminance(a), relativeLuminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

export function onFillTextColor(fill: string): string {
  return contrast(fill, INK) >= contrast(fill, PAPER) ? INK : PAPER;
}

/** Solid tier colour — badge fills, markers, gauge arcs. */
export function riskTierColor(tier: string | null): string {
  switch (tier) {
    case "HIGH":
      return "#C0392B";
    case "MODERATE":
      return "#D4A12B";
    case "LOW":
      return "#5B8C5A";
    default:
      return "#494339";
  }
}

/** Lightened tier colour for text and hairlines on the dark surface. */
export function riskTierTextColor(tier: string | null): string {
  switch (tier) {
    case "HIGH":
      return "#E8594A";
    case "MODERATE":
      return "#E6B23F";
    case "LOW":
      return "#74B071";
    default:
      return "#948C81";
  }
}

export function riskTierLabel(tier: string | null): string {
  switch (tier) {
    case "HIGH":
      return "Tinggi";
    case "MODERATE":
      return "Sedang";
    case "LOW":
      return "Rendah";
    default:
      return "—";
  }
}

/**
 * Plain-language gloss for a tier, so a badge never has to stand alone.
 * "Tinggi" on its own invites the reading "an earthquake is coming"; these
 * sentences keep every tier framed as a historical pattern.
 */
export function activityTierMeaning(tier: string | null): string {
  switch (tier) {
    case "HIGH":
      return "Aktivitas seismik historis di sekitar titik ini termasuk paling tinggi di Indonesia.";
    case "MODERATE":
      return "Aktivitas seismik historis di sekitar titik ini berada di kisaran menengah nasional.";
    case "LOW":
      return "Aktivitas seismik historis di sekitar titik ini relatif rendah dibanding wilayah lain.";
    default:
      return "Data historis belum cukup untuk menilai aktivitas di titik ini.";
  }
}


/**
 * Depth bins for the region histogram.
 *
 * These live here rather than in DepthHistogram because that module is
 * "use client": a server component importing a helper from a client module
 * gets a client-reference proxy instead of the function, which fails at
 * prerender rather than at type-check. Shared modules are where code that both
 * sides run belongs.
 */
export const DEPTH_BINS = [
  { label: "0–30", min: 0, max: 30 },
  { label: "30–70", min: 30, max: 70 },
  { label: "70–150", min: 70, max: 150 },
  { label: "150–300", min: 150, max: 300 },
  { label: "300+", min: 300, max: Infinity },
];

export interface DepthBin {
  label: string;
  count: number;
}

/**
 * Bin an event list by depth, at build time.
 *
 * The histogram used to receive the whole event array and filter it in the
 * browser to produce five integers that never change between builds — and
 * because a sibling chart needed that array too, React serialised the same
 * events into the page HTML twice.
 */
export function binByDepth(events: Array<{ depth_km: number }>): DepthBin[] {
  return DEPTH_BINS.map((b) => ({
    label: b.label,
    count: events.filter((e) => e.depth_km >= b.min && e.depth_km < b.max).length,
  }));
}
