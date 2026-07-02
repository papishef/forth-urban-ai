import * as React from "react";
import { useNavigate } from "react-router-dom";
import { apiClient, setAccessToken } from "../../lib/api-client";
import { useAuth } from "../../lib/auth-context";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T | null;
}

interface AuthRefreshData {
  user: unknown;
  tokens: { accessToken: string };
}

/**
 * Landing page after the Passport Google OAuth redirect. The server has
 * already set the refresh-token + CSRF cookies; this page just performs a
 * silent refresh to obtain an access token and populate auth state.
 */
export function GoogleCallbackPage() {
  const navigate = useNavigate();
  const { isLoading } = useAuth();

  React.useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.post<ApiEnvelope<AuthRefreshData>>("/auth/refresh");
        if (res.data.data) setAccessToken(res.data.data.tokens.accessToken);
        navigate("/dashboard", { replace: true });
      } catch {
        navigate("/login?error=google", { replace: true });
      }
    })();
    // Intentionally run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FFECE4]">
      <p className="text-[#181818]">{isLoading ? "Signing you in…" : "Redirecting…"}</p>
    </div>
  );
}
