import type { BuyerGoal } from "@forth-urban/validation";
import type { BudgetCalculatorInput, HiddenCostCalculatorInput, RoiCalculatorInput } from "@forth-urban/validation";
import type {
  BudgetCalculatorResultDTO,
  HiddenCostCalculatorResultDTO,
  RoiCalculatorResultDTO,
} from "@forth-urban/shared-types";
import { ApiError } from "../../middleware/error-handler.js";
import { recordAuditLog } from "../../lib/audit-log.service.js";
import {
  AFFORDABILITY_BAND_LABELS,
  aggregateHiddenCosts,
  calculateBudget,
  calculateRoi,
  getAffordabilityAdvice,
  selectHiddenCostNextAction,
  selectNextBestAction,
  type HiddenCostRuleInput,
} from "../decision-engine/index.js";
import { Profile } from "../users/profile.model.js";
import { Property, type PropertyDocument } from "../properties/property.model.js";
import { CalculatorResult } from "./calculator-result.model.js";

/** Disclaimer shown verbatim on every Hidden Cost Guide result (PRODUCT_SPEC §9). */
const HIDDEN_COST_DISCLAIMER =
  "This is an educational estimate. Actual costs may vary depending on the property, title, transaction structure, and official requirements. Forth Urban will provide a clear breakdown before payment.";

/** Wording shown verbatim on every ROI projection result (PRODUCT_SPEC §10). */
const ROI_DISCLAIMER =
  "This projection is for educational purposes only. Real estate value can be affected by infrastructure, demand, documentation, government policy, access roads, and market conditions.";

async function loadProperty(propertyId: string): Promise<PropertyDocument> {
  const property = await Property.findById(propertyId);
  if (!property) throw new ApiError(404, "Property not found");
  return property;
}

function hiddenCostRuleInputs(property: PropertyDocument): HiddenCostRuleInput[] {
  return property.hiddenCostRules.map((rule) => ({
    key: rule.key,
    label: rule.label,
    amount: rule.amount,
    applicable: rule.applicable,
  }));
}

/** Runs the Budget & Installment Calculator (PRODUCT_SPEC §8) and persists the result. */
export async function runBudgetCalculator(
  userId: string,
  input: BudgetCalculatorInput,
): Promise<BudgetCalculatorResultDTO> {
  const property = await loadProperty(input.propertyId);

  if (input.downPayment > property.pricePerPlot) {
    throw new ApiError(400, "Down payment cannot exceed the property price");
  }

  const { total: hiddenCostTotal } = aggregateHiddenCosts(hiddenCostRuleInputs(property));

  const result = calculateBudget({
    propertyPrice: property.pricePerPlot,
    downPayment: input.downPayment,
    installmentDurationMonths: input.installmentDurationMonths,
    monthlyIncome: input.monthlyIncome,
    includeHiddenCosts: input.includeHiddenCosts,
    hiddenCostTotal,
  });

  const nextAction = selectNextBestAction("budgetCalculatorUsed");

  await CalculatorResult.create({
    userId,
    propertyId: property._id,
    type: "budget",
    inputs: input,
    outputs: result,
  });

  await recordAuditLog({
    actorId: userId,
    actorType: "user",
    action: "calculator.budget_calculated",
    targetType: "Property",
    targetId: property._id.toString(),
    metadata: { affordabilityBand: result.affordabilityBand },
  });

  return {
    propertyId: property._id.toString(),
    propertyPrice: property.pricePerPlot,
    downPayment: input.downPayment,
    balance: result.balance,
    installmentDurationMonths: input.installmentDurationMonths,
    monthlyInstallment: result.monthlyInstallment,
    monthlyIncome: input.monthlyIncome,
    affordabilityRatio: result.affordabilityRatio,
    affordabilityBand: result.affordabilityBand,
    affordabilityBandLabel: AFFORDABILITY_BAND_LABELS[result.affordabilityBand],
    advice: getAffordabilityAdvice(result.affordabilityBand),
    includeHiddenCosts: input.includeHiddenCosts,
    hiddenCostTotal,
    nextAction,
  };
}

/** Runs the Hidden Cost Guide (PRODUCT_SPEC §9) and persists the result. */
export async function runHiddenCostCalculator(
  userId: string,
  input: HiddenCostCalculatorInput,
): Promise<HiddenCostCalculatorResultDTO> {
  const property = await loadProperty(input.propertyId);
  const { items, total } = aggregateHiddenCosts(hiddenCostRuleInputs(property));

  const profile = await Profile.findOne({ userId });
  const nextAction = selectHiddenCostNextAction((profile?.buyerGoal as BuyerGoal | undefined) ?? null);

  await CalculatorResult.create({
    userId,
    propertyId: property._id,
    type: "hiddenCost",
    inputs: input,
    outputs: { items, total },
  });

  await recordAuditLog({
    actorId: userId,
    actorType: "user",
    action: "calculator.hidden_cost_viewed",
    targetType: "Property",
    targetId: property._id.toString(),
    metadata: { total },
  });

  return {
    propertyId: property._id.toString(),
    items,
    total,
    disclaimer: HIDDEN_COST_DISCLAIMER,
    nextAction,
  };
}

/** Runs the ROI Calculator (PRODUCT_SPEC §10) using the property's own admin-editable rate assumptions. */
export async function runRoiCalculator(userId: string, input: RoiCalculatorInput): Promise<RoiCalculatorResultDTO> {
  const property = await loadProperty(input.propertyId);
  const roiAssumptions = property.roiAssumptions!;

  const scenarios = calculateRoi(property.pricePerPlot, input.years, {
    conservative: roiAssumptions.conservative,
    moderate: roiAssumptions.moderate,
    optimistic: roiAssumptions.optimistic,
  });

  const nextAction = selectNextBestAction("roiCalculatorRun");

  await CalculatorResult.create({
    userId,
    propertyId: property._id,
    type: "roi",
    inputs: input,
    outputs: scenarios,
  });

  await recordAuditLog({
    actorId: userId,
    actorType: "user",
    action: "calculator.roi_calculated",
    targetType: "Property",
    targetId: property._id.toString(),
    metadata: { years: input.years },
  });

  return {
    propertyId: property._id.toString(),
    currentPrice: property.pricePerPlot,
    years: input.years,
    scenarios,
    disclaimer: ROI_DISCLAIMER,
    nextAction,
  };
}
