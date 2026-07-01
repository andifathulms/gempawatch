import type { Config } from "tailwindcss";

// "Fault Line" design system — calm authority, not alarmism (see PRD).
const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        earth: {
          dark: "#1A1A1A",
          surface: "#232323",
          raised: "#2D2D2D",
          border: "#3A3A3A",
          "border-strong": "#4A4A4A",
        },
        seismic: { orange: "#E8743B", soft: "#F0946A" },
        depth: { blue: "#4A7C9E" },
        risk: {
          red: "#C0392B",
          amber: "#D4A12B",
          green: "#5B8C5A",
        },
        text: {
          primary: "#F2EDE4",
          secondary: "#A8A39A",
          muted: "#6B6660",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["DM Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        glow: "var(--shadow-glow)",
      },
      transitionTimingFunction: {
        "out-soft": "var(--ease-out)",
      },
      keyframes: {
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
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
      },
      animation: {
        "fade-in-up": "fade-in-up 0.5s var(--ease-out) both",
        "fade-in": "fade-in 0.4s var(--ease-out) both",
        "pulse-ring": "pulseRing 2s ease-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
