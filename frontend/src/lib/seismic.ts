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
