import type { Config } from "tailwindcss";

/**
 * "Seismograph" design system — calm authority, not alarmism (see PRD).
 *
 * Colours read the channel triplets declared in src/styles/tokens.css, so
 * retuning the palette is a one-file change and the two can never drift.
 *
 * The `rgb(var(--x) / <alpha-value>)` form is load-bearing, not stylistic: it
 * is what lets `bg-earth-surface/60` and friends exist at all. Point these at a
 * variable holding a hex string instead and Tailwind quietly emits *no rule*
 * for every opacity modifier, so those elements silently lose their colour and
 * fall back to a browser default.
 */
const channel = (name: string) => `rgb(var(--${name}-c) / <alpha-value>)`;

const config: Config = {
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        earth: {
          dark: channel("earth-dark"),
          surface: channel("surface"),
          raised: channel("surface-raised"),
          sunken: channel("surface-sunken"),
          border: channel("border"),
          "border-strong": channel("border-strong"),
        },
        seismic: {
          orange: channel("seismic-orange"),
          bright: channel("seismic-bright"),
          soft: channel("seismic-soft"),
        },
        depth: { blue: channel("depth-blue") },
        risk: {
          red: channel("risk-red"),
          "red-fill": channel("risk-red-fill"),
          amber: channel("risk-amber"),
          "amber-fill": channel("risk-amber-fill"),
          green: channel("risk-green"),
          "green-fill": channel("risk-green-fill"),
        },
        text: {
          primary: channel("text-primary"),
          secondary: channel("text-secondary"),
          muted: channel("text-muted"),
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      // Fluid steps for editorial type; Tailwind's own scale stays available
      // for UI chrome (text-xs, text-sm) where a fixed size is what you want.
      fontSize: {
        "fluid-1": ["var(--step-1)", { lineHeight: "1.5" }],
        "fluid-2": ["var(--step-2)", { lineHeight: "1.3" }],
        "fluid-3": ["var(--step-3)", { lineHeight: "1.2" }],
        "fluid-4": ["var(--step-4)", { lineHeight: "1.1" }],
        "fluid-5": ["var(--step-5)", { lineHeight: "1.02" }],
      },
      borderRadius: {
        sm: "var(--r-sm)",
        md: "var(--r-md)",
        lg: "var(--r-lg)",
        xl: "var(--r-xl)",
        "2xl": "var(--r-2xl)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        glow: "var(--shadow-glow)",
        raised: "var(--highlight-top), var(--shadow-md)",
      },
      transitionTimingFunction: {
        "out-soft": "var(--ease-out)",
      },
      keyframes: {
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        pulseRing: {
          "0%": { transform: "scale(0.9)", opacity: "0.7" },
          "70%, 100%": { transform: "scale(2.2)", opacity: "0" },
        },
        // Sweeps a highlight across skeletons — reads as "loading", where a
        // plain opacity pulse reads as "disabled".
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        // Draws gauge/bar values on mount so a number lands rather than blinks.
        "draw-in": {
          from: { transform: "scaleX(0)" },
          to: { transform: "scaleX(1)" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.5s var(--ease-out) both",
        "fade-in": "fade-in 0.4s var(--ease-out) both",
        "pulse-ring": "pulseRing 2s ease-out infinite",
        shimmer: "shimmer 1.6s infinite",
        "draw-in": "draw-in 0.7s var(--ease-out) both",
      },
    },
  },
  plugins: [],
};

export default config;
