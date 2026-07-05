import { useQuery } from "@tanstack/react-query";
import type { PropertyDetailDTO, PropertyListItemDTO, RecommendedPropertyDTO } from "@forth-urban/shared-types";
import { apiClient } from "../../lib/api-client";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T | null;
}

export function useRecommendedProperties(enabled: boolean) {
  return useQuery({
    queryKey: ["recommendations", "properties"],
    queryFn: async () => {
      const res = await apiClient.get<ApiEnvelope<RecommendedPropertyDTO[]>>("/recommendations/properties");
      return res.data.data ?? [];
    },
    enabled,
    retry: false,
  });
}

export function useProperties(enabled = true) {
  return useQuery({
    queryKey: ["properties"],
    queryFn: async () => {
      const res = await apiClient.get<ApiEnvelope<PropertyListItemDTO[]>>("/properties");
      return res.data.data ?? [];
    },
    enabled,
  });
}

export function usePropertyDetail(propertyId: string | undefined) {
  return useQuery({
    queryKey: ["properties", propertyId],
    queryFn: async () => {
      const res = await apiClient.get<ApiEnvelope<PropertyDetailDTO>>(`/properties/${propertyId}`);
      return res.data.data;
    },
    enabled: Boolean(propertyId),
  });
}
