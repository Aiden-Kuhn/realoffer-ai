import { defineConfig } from "vitest/config";
import path from "node:path";

/**
 * Separate config for the optional RentCast integration test — never run by
 * `npm run test`. Invoke explicitly with `npm run test:integration`, and
 * only when RENTCAST_API_KEY is set in your environment.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/tests/integration/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "server-only": path.resolve(__dirname, "./src/tests/stubs/serverOnlyStub.ts"),
    },
  },
});
