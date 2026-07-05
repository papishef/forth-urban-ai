import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NotificationDTO } from "@forth-urban/shared-types";
import { apiClient } from "../../lib/api-client";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T | null;
}

/** In-app notification feed (PRODUCT_SPEC §14) — polled so the bell badge stays current without a websocket. */
export function useNotifications(enabled = true) {
  return useQuery({
    queryKey: ["notifications", "me"],
    queryFn: async () => {
      const res = await apiClient.get<ApiEnvelope<NotificationDTO[]>>("/notifications/me");
      return res.data.data ?? [];
    },
    enabled,
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.patch<ApiEnvelope<NotificationDTO>>(`/notifications/${id}/read`);
      return res.data.data!;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications", "me"] });
    },
  });
}
