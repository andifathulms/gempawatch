// Shared visual encoding for earthquake data — magnitude → size, depth → color.
// Kept in one place so the map, badges, and charts stay consistent.

export function magnitudeSize(mag: number): number {
  return Math.max(24, Math.min(64, mag * 8));
}

export function depthColor(depthKm: number): string {
  if (depthKm < 30) return "#C0392B"; // shallow = most dangerous = risk-red
  if (depthKm < 100) return "#E8743B"; // seismic-orange
  return "#4A7C9E"; // deep = depth-blue
}

export function riskTierColor(tier: string | null): string {
  switch (tier) {
    case "HIGH":
      return "#C0392B";
    case "MODERATE":
      return "#D4A12B";
    case "LOW":
      return "#5B8C5A";
    default:
      return "#6B6660";
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
