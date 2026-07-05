import { useMutation } from "@tanstack/react-query";
import type { BudgetCalculatorInput, HiddenCostCalculatorInput, RoiCalculatorInput } from "@forth-urban/validation";
import type {
  BudgetCalculatorResultDTO,
  HiddenCostCalculatorResultDTO,
  RoiCalculatorResultDTO,
} from "@forth-urban/shared-types";
import { apiClient } from "../../lib/api-client";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T | null;
}

/** Budget & Installment Calculator (PRODUCT_SPEC §8) — deterministic, no LLM. */
export function useBudgetCalculator() {
  return useMutation({
    mutationFn: async (input: BudgetCalculatorInput) => {
      const res = await apiClient.post<ApiEnvelope<BudgetCalculatorResultDTO>>("/calculators/budget", input);
      return res.data.data!;
    },
  });
}

/** Hidden Cost Guide (PRODUCT_SPEC §9) — deterministic, no LLM. */
export function useHiddenCostCalculator() {
  return useMutation({
    mutationFn: async (input: HiddenCostCalculatorInput) => {
      const res = await apiClient.post<ApiEnvelope<HiddenCostCalculatorResultDTO>>("/calculators/hidden-cost", input);
      return res.data.data!;
    },
  });
}

/** ROI Calculator (PRODUCT_SPEC §10) — deterministic, no LLM. */
export function useRoiCalculator() {
  return useMutation({
    mutationFn: async (input: RoiCalculatorInput) => {
      const res = await apiClient.post<ApiEnvelope<RoiCalculatorResultDTO>>("/calculators/roi", input);
      return res.data.data!;
    },
  });
}
