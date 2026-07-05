import type { AffordabilityBand, RoiScenarioKey } from "@forth-urban/shared-types";

/**
 * Budget/Hidden Cost/ROI calculators — Phase 4, deterministic only.
 * docs/PRODUCT_SPEC.md#8-budget--installment-calculator-deterministic
 * docs/PRODUCT_SPEC.md#9-hidden-cost-guide
 * docs/PRODUCT_SPEC.md#10-roi-calculator-deterministic-admin-editable-assumptions
 *
 * Pure and unit-tested — no I/O, no LLM. Callers (apps/server/src/modules/
 * calculators) fetch the property, pass its plain fields in here, and
 * persist the result to `calculatorResults`.
 */

export interface BudgetCalculationInput {
  propertyPrice: number;
  downPayment: number;
  installmentDurationMonths: number;
  monthlyIncome: number;
  /** Whether the caller opted to fold `hiddenCostTotal` into the financed balance. */
  includeHiddenCosts: boolean;
  /** Sum of applicable hidden cost rules for the property (see aggregateHiddenCosts). */
  hiddenCostTotal: number;
}

export interface BudgetCalculationResult {
  balance: number;
  monthlyInstallment: number;
  /** null when monthlyIncome is 0 (ratio is undefined; treated as the riskiest band). */
  affordabilityRatio: number | null;
  affordabilityBand: AffordabilityBand;
}

/** Advice per affordability band, verbatim from the PRODUCT_SPEC §8 table. */
const AFFORDABILITY_BAND_ADVICE: Record<AffordabilityBand, string> = {
  comfortable: "Proceed to hidden cost breakdown",
  manageable: "Proceed, review monthly pressure",
  tight: "Consider a longer plan, bigger down payment, or a lower-cost property",
  risky: "Recommend a more affordable property or a savings plan",
};

export const AFFORDABILITY_BAND_LABELS: Record<AffordabilityBand, string> = {
  comfortable: "Comfortable",
  manageable: "Manageable",
  tight: "Tight",
  risky: "Risky",
};

/** Bands per the PRODUCT_SPEC §8 table: 0-25% / 26-40% / 41-60% / >60%. */
function getAffordabilityBand(ratio: number): AffordabilityBand {
  if (ratio <= 0.25) return "comfortable";
  if (ratio <= 0.4) return "manageable";
  if (ratio <= 0.6) return "tight";
  return "risky";
}

/**
 * `balance = propertyPrice - downPayment`; `monthlyInstallment = balance / installmentDurationMonths`
 * (PRODUCT_SPEC §8). When `includeHiddenCosts` is set, the hidden cost total
 * is folded into the financed balance before the installment is derived, so
 * the affordability ratio reflects the true monthly pressure.
 */
export function calculateBudget(input: BudgetCalculationInput): BudgetCalculationResult {
  const hiddenCosts = input.includeHiddenCosts ? input.hiddenCostTotal : 0;
  const balance = Math.max(0, input.propertyPrice - input.downPayment) + hiddenCosts;
  const monthlyInstallment = balance / input.installmentDurationMonths;
  const affordabilityRatio = input.monthlyIncome > 0 ? monthlyInstallment / input.monthlyIncome : null;
  // No stated income means affordability can't be confirmed — treat as the riskiest band.
  const affordabilityBand = getAffordabilityBand(affordabilityRatio ?? Number.POSITIVE_INFINITY);

  return { balance, monthlyInstallment, affordabilityRatio, affordabilityBand };
}

/** Looks up the deterministic advice string for an affordability band. */
export function getAffordabilityAdvice(band: AffordabilityBand): string {
  return AFFORDABILITY_BAND_ADVICE[band];
}

export interface HiddenCostRuleInput {
  key: string;
  label: string;
  amount: number;
  applicable: boolean;
}

export interface HiddenCostAggregationResult {
  items: HiddenCostRuleInput[];
  total: number;
}

/** Sums a property's applicable hidden-cost line items (PRODUCT_SPEC §9). */
export function aggregateHiddenCosts(rules: HiddenCostRuleInput[]): HiddenCostAggregationResult {
  const items = rules.filter((rule) => rule.applicable);
  const total = items.reduce((sum, rule) => sum + rule.amount, 0);
  return { items, total };
}

export interface RoiAssumptions {
  conservative: number;
  moderate: number;
  optimistic: number;
}

export interface RoiScenarioResult {
  rate: number;
  futureValue: number;
  estimatedGain: number;
  roiPercent: number;
}

export type RoiCalculationResult = Record<RoiScenarioKey, RoiScenarioResult>;

const ROI_SCENARIOS: RoiScenarioKey[] = ["conservative", "moderate", "optimistic"];

/**
 * `futureValue = currentPrice * (1 + rate) ^ years`;
 * `estimatedGain = futureValue - currentPrice`;
 * `roiPercent = (estimatedGain / currentPrice) * 100` (PRODUCT_SPEC §10),
 * computed for all three admin-editable scenarios (rates come from the
 * property's own `roiAssumptions`, not hardcoded here).
 */
export function calculateRoi(currentPrice: number, years: number, assumptions: RoiAssumptions): RoiCalculationResult {
  const result = {} as RoiCalculationResult;

  for (const scenario of ROI_SCENARIOS) {
    const rate = assumptions[scenario];
    const futureValue = currentPrice * Math.pow(1 + rate, years);
    const estimatedGain = futureValue - currentPrice;
    const roiPercent = currentPrice > 0 ? (estimatedGain / currentPrice) * 100 : 0;
    result[scenario] = { rate, futureValue, estimatedGain, roiPercent };
  }

  return result;
}
