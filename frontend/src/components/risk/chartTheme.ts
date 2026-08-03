/**
 * Shared Recharts theming.
 *
 * Each chart used to inline its own axis stroke, grid colour, and tooltip
 * style, all hard-coded to hexes from the previous palette — so retuning the
 * design tokens left the charts behind, still drawing on the old surface
 * colours. Everything visual that more than one chart needs lives here.
 */

export const AXIS = {
  stroke: "#948C81",
  fontSize: 11,
  tickLine: false,
} as const;

export const GRID = {
  stroke: "#33302B",
  strokeDasharray: "2 4",
  // Vertical rules add nothing when the x-axis is categorical or time — the
  // reader compares heights, and every extra line competes with the marks.
  vertical: false,
} as const;

export const TOOLTIP = {
  contentStyle: {
    background: "#24211E",
    border: "1px solid #33302B",
    borderRadius: 12,
    color: "#F5F1EA",
    fontSize: 12,
    boxShadow: "0 16px 48px rgba(0,0,0,0.55)",
    padding: "8px 12px",
  },
  labelStyle: { color: "#948C81", marginBottom: 2 },
  itemStyle: { color: "#F5F1EA" },
  cursor: { fill: "rgba(255,255,255,0.04)" },
} as const;

/**
 * Sequential ramp for magnitude tiers — one hue, monotonically darkening, so
 * the encoding reads as "more" rather than as four unrelated categories. The
 * bars also carry direct value labels, which is what lets adjacent steps be
 * told apart without relying on the hue difference alone.
 */
export const MAGNITUDE_RAMP = ["#F6B79C", "#F0946A", "#E8743B", "#C0392B"] as const;
