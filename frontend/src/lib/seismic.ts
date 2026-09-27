// Shared visual encoding for earthquake data — magnitude → size, depth → colour.
// Kept in one place so the map, badges, charts, and share cards stay consistent.
//
// Colours are returned as CSS variables (tokens.css), not hexes, so every
// marker, badge and chart follows the Kertas/Malam theme on its own. var()
// works in inline styles and in SVG presentation attributes — which is what
// Leaflet's SVG renderer and Recharts write — in every engine we ship to.
// The one renderer that cannot resolve a variable is next/og (Satori); it
// uses the *_HEX mirrors at the bottom of this file.
//
// Two colour roles per semantic value, and they are not interchangeable:
//   fill   — solid shapes (badge backgrounds, map markers, spikes, arcs)
//   base   — text and thin strokes, luminance-tuned to clear WCAG AA
// Text printed ON a fill uses its `--on-*` partner (see onFillTextColor).

export function magnitudeSize(mag: number): number {
  return Math.max(24, Math.min(64, mag * 8));
}

export type DepthBand = "shallow" | "mid" | "deep";

/** CLAUDE.md thresholds: <30 km shallow, <100 km intermediate, else deep. */
export function depthBand(depthKm: number): DepthBand {
  if (depthKm < 30) return "shallow"; // most destructive
  if (depthKm < 100) return "mid";
  return "deep"; // felt less at the surface
}

/** Shallow quakes do the damage, so shallow is the alarming end of the ramp. */
export function depthColor(depthKm: number): string {
  return `var(--depth-${depthBand(depthKm)}-fill)`;
}

/** Depth tone for text and hairlines. */
export function depthTextColor(depthKm: number): string {
  return `var(--depth-${depthBand(depthKm)})`;
}

/** Legend rows for anything that encodes depth by colour. */
export const DEPTH_BANDS = [
  { color: "var(--depth-shallow-fill)", label: "Dangkal", detail: "< 30 km" },
  { color: "var(--depth-mid-fill)", label: "Menengah", detail: "30–100 km" },
  { color: "var(--depth-deep-fill)", label: "Dalam", detail: "> 100 km" },
] as const;

const ON_FILL: Record<string, string> = {
  "var(--depth-shallow-fill)": "var(--on-shallow)",
  "var(--depth-mid-fill)": "var(--on-mid)",
  "var(--depth-deep-fill)": "var(--on-deep)",
  "var(--tier-high-fill)": "var(--on-high)",
  "var(--tier-mod-fill)": "var(--on-mod)",
  "var(--tier-low-fill)": "var(--on-low)",
};

/**
 * Readable foreground for text sitting *on* one of the fills above.
 *
 * The pairs are chosen by measured contrast per theme in tokens.css (all
 * ≥ 4.5:1) — white on the Kertas red/blue/green fills, dark ink on the orange
 * and amber ones and on every Malam fill — so this is a lookup, not a
 * calculation.
 */
export function onFillTextColor(fill: string): string {
  return ON_FILL[fill] ?? "var(--ink)";
}

type TierKey = "high" | "mod" | "low";
function tierKey(tier: string | null): TierKey | null {
  switch (tier) {
    case "HIGH":
      return "high";
    case "MODERATE":
      return "mod";
    case "LOW":
      return "low";
    default:
      return null;
  }
}

/** Solid tier colour — badge fills, markers, dots. */
export function riskTierColor(tier: string | null): string {
  const k = tierKey(tier);
  return k ? `var(--tier-${k}-fill)` : "var(--rule-strong)";
}

/** Tier tone for text and hairlines. */
export function riskTierTextColor(tier: string | null): string {
  const k = tierKey(tier);
  return k ? `var(--tier-${k})` : "var(--ink-3)";
}

/** Tinted background behind tier text (pills, verdict bands). */
export function riskTierBgColor(tier: string | null): string {
  const k = tierKey(tier);
  return k ? `var(--tier-${k}-bg)` : "var(--raised)";
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

/**
 * Hex mirrors of the Kertas tokens, for renderers that cannot resolve CSS
 * variables: next/og (Satori) builds share images server-side. Keep in step
 * with tokens.css.
 */
export const DEPTH_HEX: Record<DepthBand, string> = {
  shallow: "#C23A2E",
  mid: "#E58A2E",
  deep: "#2F78B4",
};

export function riskTierHex(tier: string | null): string {
  switch (tier) {
    case "HIGH":
      return "#B42318";
    case "MODERATE":
      return "#8F5B0A";
    case "LOW":
      return "#23704A";
    default:
      return "#626B73";
  }
}
