import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    // The engine suite parses ~70k events before the first assertion.
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
