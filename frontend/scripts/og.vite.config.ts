import path from "node:path";
import { defineConfig } from "vite";

/**
 * Config for generate-og.tsx only.
 *
 * The OG script imports src/lib/og.tsx, which uses the "@/" alias that Next
 * resolves from tsconfig paths. vite-node does not read tsconfig paths, and the
 * test config has no alias because the suites import relatively. A dedicated
 * config keeps that resolution here rather than reshaping either of those.
 */
export default defineConfig({
  // og.tsx is JSX without a React import, which Next compiles with the
  // automatic runtime. esbuild defaults to the classic runtime and would look
  // for a global React, so it is told the same thing Next assumes.
  esbuild: { jsx: "automatic" },
  resolve: {
    alias: { "@": path.resolve(__dirname, "..", "src") },
  },
});
