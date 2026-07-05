import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    include: ["src/**/*.test.ts"],
    setupFiles: ["src/test/setup.ts"],
    // Run test files one at a time so only a single MongoMemoryServer binary
    // download happens at once (the binary is cached after the first run,
    // but concurrent workers each racing to download it independently is
    // very slow on constrained networks).
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 15 * 60_000,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      // Decision Engine functions are pure and deterministic (PRODUCT_SPEC
      // requires the LLM never do this math), so they must be near-fully
      // unit-tested. Phase 9 exit criteria: >=90% coverage on this module.
      include: ["src/modules/decision-engine/**/*.ts"],
      exclude: ["src/modules/decision-engine/**/*.test.ts", "src/modules/decision-engine/index.ts"],
      thresholds: {
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90,
      },
    },
  },
});
