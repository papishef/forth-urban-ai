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
  },
});
