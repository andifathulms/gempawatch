import type { Config } from "tailwindcss";

/**
 * "Kertas & Tinta" design system — ink on paper, colour only for data.
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
    // The whole type scale, and the only sizes the app may use. This sits
    // OUTSIDE `extend` on purpose: it replaces Tailwind's built-in
    // text-xs/sm/base/lg scale rather than joining it.
    //
    // The default scale used to stay available alongside the fluid steps, and
    // it won by sheer convenience — 133 uses of the default scale against 7 of
    // the fluid one, plus 23 hardcoded text-[11px]-style escapes. That is three
    // scales, so nothing lined up between components. Overriding the key means
    // a leftover `text-sm` now resolves to nothing and shows up as an unstyled
    // element in review, instead of quietly reintroducing a fourth scale.
    fontSize: {
      "fluid-000": ["var(--step-000)", { lineHeight: "1.45" }],
      "fluid-00": ["var(--step-00)", { lineHeight: "1.5" }],
      "fluid-0": ["var(--step-0)", { lineHeight: "1.6" }],
      "fluid-1": ["var(--step-1)", { lineHeight: "1.4" }],
      "fluid-2": ["var(--step-2)", { lineHeight: "1.3" }],
      "fluid-3": ["var(--step-3)", { lineHeight: "1.2" }],
      "fluid-4": ["var(--step-4)", { lineHeight: "1.1" }],
      "fluid-5": ["var(--step-5)", { lineHeight: "1.02" }],
      // The score numeral, and nothing else.
      "fluid-6": ["var(--step-6)", { lineHeight: "0.85" }],
    },
    extend: {
      // Chrome is paper and ink; colour is data (tokens.css header).
      colors: {
        paper: channel("paper"),
        surface: channel("surface"),
        raised: channel("raised"),
        sunken: channel("sunken"),
        grid: channel("grid"),
        rule: {
          DEFAULT: channel("rule"),
          strong: channel("rule-strong"),
        },
        ink: {
          DEFAULT: channel("ink"),
          2: channel("ink-2"),
          3: channel("ink-3"),
        },
        "on-ink": channel("on-ink"),
        depth: {
          shallow: channel("depth-shallow"),
          mid: channel("depth-mid"),
          deep: channel("depth-deep"),
          "shallow-fill": channel("depth-shallow-fill"),
          "mid-fill": channel("depth-mid-fill"),
          "deep-fill": channel("depth-deep-fill"),
        },
        tier: {
          high: channel("tier-high"),
          mod: channel("tier-mod"),
          low: channel("tier-low"),
          "high-fill": channel("tier-high-fill"),
          "mod-fill": channel("tier-mod-fill"),
          "low-fill": channel("tier-low-fill"),
          "high-bg": channel("tier-high-bg"),
          "mod-bg": channel("tier-mod-bg"),
          "low-bg": channel("tier-low-bg"),
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      // Exposed as min-h-tap / min-w-tap so a target floor is applied by naming
      // the rule, not by hand-tuning padding until a control looks big enough.
      minHeight: {
        tap: "var(--tap-min)",
        "tap-comfortable": "var(--tap-comfortable)",
      },
      minWidth: {
        tap: "var(--tap-min)",
        "tap-comfortable": "var(--tap-comfortable)",
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
        // `raised` kept as an alias so older call sites resolve to the new,
        // quieter elevation instead of to nothing.
        raised: "var(--shadow-md)",
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
