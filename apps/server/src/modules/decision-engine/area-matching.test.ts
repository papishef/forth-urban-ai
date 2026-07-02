import { describe, expect, it } from "vitest";
import type { AreaPreference } from "@forth-urban/validation";
import { matchAreaForPreference } from "./area-matching.js";

describe("matchAreaForPreference", () => {
  it.each([
    ["premiumLiving", "Guzape II"],
    ["affordableOwnership", "Kuje"],
    ["cityAccessAffordability", "Lugbe"],
  ] as Array<[AreaPreference, string]>)("maps %s to %s per PRODUCT_SPEC §12", (preference, expected) => {
    expect(matchAreaForPreference(preference)).toBe(expected);
  });

  it("returns a non-empty recommendation for every area preference", () => {
    const preferences: AreaPreference[] = [
      "premiumLiving",
      "affordableOwnership",
      "cityAccessAffordability",
      "familyOriented",
      "investmentFocused",
      "diasporaBuyer",
    ];
    for (const preference of preferences) {
      expect(matchAreaForPreference(preference)).toBeTruthy();
    }
  });
});
