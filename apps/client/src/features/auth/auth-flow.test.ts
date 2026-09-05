import { describe, expect, it } from "vitest";
import { getAuthPagePath, getSafeAuthDestination } from "./auth-flow";

describe("auth flow destinations", () => {
  it("keeps valid internal destinations through the auth pages", () => {
    const search = "?next=%2Fquiz%2Fhome-readiness%2Fresult";

    expect(getSafeAuthDestination(search)).toBe("/quiz/home-readiness/result");
    expect(getAuthPagePath("/register", search)).toBe("/register?next=%2Fquiz%2Fhome-readiness%2Fresult");
    expect(getAuthPagePath("/login/otp", search)).toBe("/login/otp?next=%2Fquiz%2Fhome-readiness%2Fresult");
  });

  it("falls back to the dashboard for external or protocol-relative destinations", () => {
    expect(getSafeAuthDestination("?next=https%3A%2F%2Fevil.example")).toBe("/dashboard");
    expect(getSafeAuthDestination("?next=%2F%2Fevil.example")).toBe("/dashboard");
    expect(getSafeAuthDestination("?next=%2F%5Cevil.example")).toBe("/dashboard");
  });
});