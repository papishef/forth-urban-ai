import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { InspectionBookingInput } from "@forth-urban/validation";
import type { InspectionBookingDTO } from "@forth-urban/shared-types";
import { apiClient } from "../../lib/api-client";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T | null;
}

/** Inspection Scheduler (PRODUCT_SPEC §11) — books an inspection, persists it, and fires notifications/CRM side effects server-side. */
export function useBookInspection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: InspectionBookingInput) => {
      const res = await apiClient.post<ApiEnvelope<InspectionBookingDTO>>("/inspections", input);
      return res.data.data!;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["inspections", "me"] });
    },
  });
}

export function useMyInspections(enabled = true) {
  return useQuery({
    queryKey: ["inspections", "me"],
    queryFn: async () => {
      const res = await apiClient.get<ApiEnvelope<InspectionBookingDTO[]>>("/inspections/me");
      return res.data.data ?? [];
    },
    enabled,
  });
}
