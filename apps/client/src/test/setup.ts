import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// RTL's automatic afterEach(cleanup) only self-registers when it detects a
// global `afterEach` (i.e. `globals: true` in vitest config). We keep
// `globals: false` for explicit imports elsewhere, so unmount manually here.
afterEach(() => {
  cleanup();
});
