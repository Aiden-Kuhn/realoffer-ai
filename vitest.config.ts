import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    // Default stays "node" — fast, and correct for the vast majority of
    // tests here (pure lib/repository logic). Component tests that need a
    // DOM opt into jsdom per-file via a `// @vitest-environment jsdom`
    // docblock at the top of the file instead of paying the jsdom cost
    // project-wide.
    environment: "node",
    include: ["src/tests/**/*.test.ts", "src/tests/**/*.test.tsx"],
    setupFiles: ["./src/tests/setup/jestDomMatchers.ts"],
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
