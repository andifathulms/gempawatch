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
        },
        seismic: { orange: "#E8743B" },
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
    },
  },
  plugins: [],
};

export default config;
