import * as React from "react";
import { useNavigate } from "react-router-dom";
import type { AuthResponse } from "@forth-urban/shared-types";
import { apiClient } from "../../lib/api-client";
import { getAdminLandingPath } from "../../lib/admin-access";
import { useAuth } from "../../lib/auth-context";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T | null;
}

/**
 * Landing page after the Passport Google OAuth redirect. The server has
 * already set the refresh-token + CSRF cookies; this page just performs a
 * silent refresh to obtain an access token and populate auth state.
 */
export function GoogleCallbackPage() {
  const navigate = useNavigate();
  const { isLoading, applyAuthResponse } = useAuth();

  React.useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.post<ApiEnvelope<AuthResponse>>("/auth/refresh");
        if (!res.data.data) throw new Error("Session could not be restored");
        const user = applyAuthResponse(res.data.data);
        navigate(getAdminLandingPath(user), { replace: true });
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
