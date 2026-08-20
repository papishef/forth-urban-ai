import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AuthResponse, UserDTO } from "@forth-urban/shared-types";
import type { ChangePasswordInput, UserProfileUpdateInput } from "@forth-urban/validation";
import { apiClient } from "../../lib/api-client";
import { useAuth } from "../../lib/auth-context";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T | null;
}

export function useUpdateCurrentUser() {
  const queryClient = useQueryClient();
  const { updateUser } = useAuth();
  return useMutation({
    mutationFn: async (input: UserProfileUpdateInput) => {
      const res = await apiClient.patch<ApiEnvelope<UserDTO>>("/users/me", input);
      return res.data.data!;
    },
    onSuccess: (user) => {
      updateUser(user);
      queryClient.setQueryData(["users", "me"], user);
    },
  });
}

export function useChangePassword() {
  const { applyAuthResponse } = useAuth();
  return useMutation({
    mutationFn: async (input: ChangePasswordInput) => {
      const res = await apiClient.post<ApiEnvelope<AuthResponse>>("/auth/password/change", input);
      return res.data.data!;
    },
    onSuccess: (data) => {
      applyAuthResponse(data);
    },
  });
}