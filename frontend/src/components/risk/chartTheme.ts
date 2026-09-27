/**
 * Shared Recharts theming.
 *
 * Each chart used to inline its own axis stroke, grid colour, and tooltip
 * style, all hard-coded to hexes — so retuning the tokens left the charts
 * behind. Everything here is a CSS variable now, which Recharts writes into SVG
 * attributes and inline styles, so the charts follow the Kertas/Malam theme.
 */

export const AXIS = {
  stroke: "var(--ink-3)",
  fontSize: 11,
  tickLine: false,
} as const;

export const GRID = {
  stroke: "var(--rule)",
  strokeDasharray: "2 4",
  // Vertical rules add nothing when the x-axis is categorical or time — the
  // reader compares heights, and every extra line competes with the marks.
  vertical: false,
} as const;

export const TOOLTIP = {
  contentStyle: {
    background: "var(--surface)",
    border: "1px solid var(--rule)",
    borderRadius: 10,
    color: "var(--ink)",
    fontSize: 12.5,
    boxShadow: "var(--shadow-md)",
    padding: "8px 12px",
  },
  labelStyle: { color: "var(--ink-3)", marginBottom: 2 },
  itemStyle: { color: "var(--ink)" },
  cursor: { fill: "var(--raised)" },
} as const;

/**
 * Sequential ramp for magnitude tiers — ink, stepping from light to full, so
 * the encoding reads as "more" rather than as four categories. Magnitude is
 * not depth: colour on this site belongs to depth and risk tier only
 * (tokens.css), so these bars are ink. The bars also carry direct value
 * labels, which is what separates adjacent steps without relying on shade.
 */
export const MAGNITUDE_RAMP = [
  "color-mix(in srgb, var(--ink) 35%, transparent)",
  "color-mix(in srgb, var(--ink) 55%, transparent)",
  "color-mix(in srgb, var(--ink) 75%, transparent)",
  "var(--ink)",
] as const;
