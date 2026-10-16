// This module intentionally colocates the AuthProvider component with its
// useAuth()/useCurrentUserProfile() hooks (a common, idiomatic React context
// pattern), which trips react-refresh's "only export components" rule.
/* eslint-disable react-refresh/only-export-components */
import * as React from "react";
import { isAxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AuthResponse,
  EmailVerificationResponse,
  HomeReadinessResultDTO,
  RegistrationPendingDTO,
  UserDTO,
} from "@forth-urban/shared-types";
import type { EmailVerificationInput, LoginInput, RegisterInput, OtpVerifyInput } from "@forth-urban/validation";
import {
  apiClient,
  refreshSession,
  setAccessToken,
  setAdminAccessDeniedHandler,
  setCsrfToken,
  setSessionExpiredHandler,
} from "./api-client";
import { identifyAnalyticsUser, resetAnalytics } from "./analytics";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T | null;
}

/** Result of a sign-in that may also have activated the quiz submitted at registration. */
export interface AuthCompletion {
  user: UserDTO;
  homeReadinessResult: HomeReadinessResultDTO | null;
}

interface AuthContextValue {
  user: UserDTO | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<UserDTO>;
  register: (input: RegisterInput) => Promise<RegistrationPendingDTO>;
  verifyEmail: (input: EmailVerificationInput) => Promise<AuthCompletion>;
  resendEmailVerification: (email: string) => Promise<void>;
  verifyOtp: (input: OtpVerifyInput) => Promise<AuthCompletion>;
  requestOtp: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: UserDTO) => void;
  applyAuthResponse: (data: AuthResponse) => UserDTO;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

let initialRefreshPromise: Promise<AuthResponse | null> | null = null;

function restoreSession(): Promise<AuthResponse | null> {
  initialRefreshPromise ??= refreshSession<AuthResponse>()
    .catch(() => null)
    .finally(() => {
      initialRefreshPromise = null;
    });

  return initialRefreshPromise;
}

function applyAuthResponse(data: AuthResponse) {
  setAccessToken(data.tokens.accessToken);
  setCsrfToken(data.tokens.csrfToken);
  identifyAnalyticsUser(data.user.id, { email: data.user.email, role: data.user.role });
  return data.user;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = React.useState<UserDTO | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // Any request that definitively fails auth (expired/invalid session, even
  // after a refresh attempt) reports here so we can clear local state —
  // ProtectedRoute reacts to isAuthenticated flipping false and redirects to
  // /login. Without this, `user` stayed populated until an explicit logout()
  // call, so an expired session just left protected pages rendered with
  // failed/empty queries instead of redirecting anywhere.
  React.useEffect(() => {
    setSessionExpiredHandler(() => {
      setAccessToken(null);
      setCsrfToken(null);
      setUser(null);
      resetAnalytics();
      queryClient.clear();
    });
    return () => setSessionExpiredHandler(null);
  }, [queryClient]);

  // Refetches /users/me to pick up out-of-band changes (e.g. an owner
  // revoking/editing admin access while the sub-admin's tab stays open).
  // Only a definitive 401/403 clears the session — transient network
  // errors must not log the user out.
  const syncCurrentUser = React.useCallback(() => {
    void apiClient
      .get<ApiEnvelope<UserDTO>>("/users/me")
      .then((res) => {
        if (res.data.data) {
          setUser(res.data.data);
          queryClient.setQueryData(["users", "me"], res.data.data);
        }
      })
      .catch((error: unknown) => {
        if (!isAxiosError(error) || ![401, 403].includes(error.response?.status ?? 0)) return;
        setAccessToken(null);
        setCsrfToken(null);
        setUser(null);
        resetAnalytics();
        queryClient.clear();
      });
  }, [queryClient]);

  React.useEffect(() => {
    if (!user) return undefined;
    window.addEventListener("focus", syncCurrentUser);
    return () => window.removeEventListener("focus", syncCurrentUser);
  }, [syncCurrentUser, user?.id]);

  React.useEffect(() => {
    setAdminAccessDeniedHandler(syncCurrentUser);
    return () => setAdminAccessDeniedHandler(null);
  }, [syncCurrentUser]);

  // On first load, attempt a silent refresh using the httpOnly cookie so a
  // page reload doesn't force the user to log in again.
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await restoreSession();
        if (!cancelled && data) {
          setUser(applyAuthResponse(data));
        }
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
      const res = await apiClient.post<ApiEnvelope<RegistrationPendingDTO>>("/auth/register", input);
      return res.data.data!;
    },
  });

  const verifyEmailMutation = useMutation({
    mutationFn: async (input: EmailVerificationInput) => {
      const res = await apiClient.post<ApiEnvelope<EmailVerificationResponse>>("/auth/email-verification/verify", input);
      const data = res.data.data!;
      return { user: applyAuthResponse(data), homeReadinessResult: data.homeReadinessResult ?? null };
    },
    onSuccess: ({ user }) => setUser(user),
  });

  const resendEmailVerificationMutation = useMutation({
    mutationFn: async (email: string) => {
      await apiClient.post("/auth/email-verification/resend", { email });
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async (input: OtpVerifyInput) => {
      const res = await apiClient.post<ApiEnvelope<EmailVerificationResponse>>("/auth/otp/verify", input);
      const data = res.data.data!;
      return { user: applyAuthResponse(data), homeReadinessResult: data.homeReadinessResult ?? null };
    },
    onSuccess: ({ user }) => setUser(user),
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
      setCsrfToken(null);
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
    verifyEmail: (input) => verifyEmailMutation.mutateAsync(input),
    resendEmailVerification: (email) => resendEmailVerificationMutation.mutateAsync(email).then(() => undefined),
    verifyOtp: (input) => verifyOtpMutation.mutateAsync(input),
    requestOtp: (email) => requestOtpMutation.mutateAsync(email).then(() => undefined),
    logout: () => logoutMutation.mutateAsync(),
    updateUser: (nextUser) => setUser(nextUser),
    applyAuthResponse: (data) => {
      const nextUser = applyAuthResponse(data);
      setUser(nextUser);
      return nextUser;
    },
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
