import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/tests/**/*.test.ts"],
    // The RentCast integration test makes a real network call and only runs
    // when explicitly invoked via `npm run test:integration` — never as
    // part of the standard suite.
    exclude: ["node_modules/**", "src/tests/integration/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // See src/tests/stubs/serverOnlyStub.ts for why this is aliased.
      "server-only": path.resolve(__dirname, "./src/tests/stubs/serverOnlyStub.ts"),
    },
  },
});
