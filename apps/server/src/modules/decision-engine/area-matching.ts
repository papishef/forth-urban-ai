import type { AreaPreference } from "@forth-urban/validation";

/**
 * Best Abuja Area Quiz mapping — docs/PRODUCT_SPEC.md#12-best-abuja-area-ai-quiz-standalone
 *
 * Area names are illustrative examples from the spec, not a hardcoded area
 * enum (AGENTS.md rule #9 — multi-tenant-ready naming). An admin-driven areas
 * table can replace this lookup in Phase 7 without changing the function
 * signature.
 */
export const AREA_PREFERENCE_MATCH: Record<AreaPreference, string> = {
  premiumLiving: "Guzape II",
  affordableOwnership: "Kuje",
  cityAccessAffordability: "Lugbe",
  familyOriented: "A quieter area with growth and access potential",
  investmentFocused: "An area with strong future infrastructure and resale potential",
  diasporaBuyer: "An area with strong documentation clarity and virtual inspection support",
};

/**
 * Maps a Best Abuja Area Quiz answer to a recommended area. `overrides` is an
 * optional admin-managed lookup (Phase 7 `modules/areas`) that takes
 * precedence over the illustrative defaults above, without changing this
 * function's signature for existing callers/tests.
 */
export function matchAreaForPreference(
  areaPreference: AreaPreference,
  overrides?: Partial<Record<AreaPreference, string>>,
): string {
  return overrides?.[areaPreference] ?? AREA_PREFERENCE_MATCH[areaPreference];
}
