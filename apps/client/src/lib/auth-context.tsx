// This module intentionally colocates the AuthProvider component with its
// useAuth()/useCurrentUserProfile() hooks (a common, idiomatic React context
// pattern), which trips react-refresh's "only export components" rule.
/* eslint-disable react-refresh/only-export-components */
import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AuthResponse, UserDTO } from "@forth-urban/shared-types";
import type { LoginInput, RegisterInput, OtpVerifyInput } from "@forth-urban/validation";
import { apiClient, setAccessToken } from "./api-client";
import { identifyAnalyticsUser, resetAnalytics } from "./analytics";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T | null;
}

interface AuthContextValue {
  user: UserDTO | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<UserDTO>;
  register: (input: RegisterInput) => Promise<UserDTO>;
  verifyOtp: (input: OtpVerifyInput) => Promise<UserDTO>;
  requestOtp: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

function applyAuthResponse(data: AuthResponse) {
  setAccessToken(data.tokens.accessToken);
  identifyAnalyticsUser(data.user.id, { email: data.user.email, role: data.user.role });
  return data.user;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = React.useState<UserDTO | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // On first load, attempt a silent refresh using the httpOnly cookie so a
  // page reload doesn't force the user to log in again.
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.post<ApiEnvelope<AuthResponse>>("/auth/refresh");
        if (!cancelled && res.data.data) {
          setUser(applyAuthResponse(res.data.data));
        }
      } catch {
        // No valid session — that's a normal logged-out state.
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loginMutation = useMutation({
    mutationFn: async (input: LoginInput) => {
      const res = await apiClient.post<ApiEnvelope<AuthResponse>>("/auth/login", input);
      return applyAuthResponse(res.data.data!);
    },
    onSuccess: (user) => setUser(user),
  });

  const registerMutation = useMutation({
    mutationFn: async (input: RegisterInput) => {
      const res = await apiClient.post<ApiEnvelope<AuthResponse>>("/auth/register", input);
      return applyAuthResponse(res.data.data!);
    },
    onSuccess: (user) => setUser(user),
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async (input: OtpVerifyInput) => {
      const res = await apiClient.post<ApiEnvelope<AuthResponse>>("/auth/otp/verify", input);
      return applyAuthResponse(res.data.data!);
    },
    onSuccess: (user) => setUser(user),
  });

  const requestOtpMutation = useMutation({
    mutationFn: async (email: string) => {
      await apiClient.post("/auth/otp/request", { email });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post("/auth/logout");
    },
    onSuccess: () => {
      setAccessToken(null);
      setUser(null);
      resetAnalytics();
      queryClient.clear();
    },
  });

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: user !== null,
    login: (input) => loginMutation.mutateAsync(input),
    register: (input) => registerMutation.mutateAsync(input),
    verifyOtp: (input) => verifyOtpMutation.mutateAsync(input),
    requestOtp: (email) => requestOtpMutation.mutateAsync(email).then(() => undefined),
    logout: () => logoutMutation.mutateAsync(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

/** Fetches the current user's full profile (kept fresh via TanStack Query, separate from the auth session state). */
export function useCurrentUserProfile() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["users", "me"],
    queryFn: async () => {
      const res = await apiClient.get<ApiEnvelope<UserDTO>>("/users/me");
      return res.data.data;
    },
    enabled: isAuthenticated,
  });
}
