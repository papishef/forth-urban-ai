import * as React from "react";
import { useNavigate } from "react-router-dom";
import type { AuthResponse } from "@forth-urban/shared-types";
import { apiClient } from "../../lib/api-client";
import { useAuth } from "../../lib/auth-context";
import {
  HOME_READINESS_RESULT_PATH,
  useAuthFlowCompletion,
} from "./auth-flow";
import { hasPendingHomeReadinessAuthHandoff } from "../quiz/pending-home-readiness";
import { Button } from "@forth-urban/ui";

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
  const {
    complete,
    retryPendingQuiz,
    authenticatedUser,
    isSavingQuiz,
    quizSaveError,
  } = useAuthFlowCompletion();
  const shouldResumeQuiz = hasPendingHomeReadinessAuthHandoff();

  React.useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.post<ApiEnvelope<AuthResponse>>("/auth/refresh");
        if (!res.data.data) throw new Error("Session could not be restored");
        const user = applyAuthResponse(res.data.data);
        await complete(user, shouldResumeQuiz ? HOME_READINESS_RESULT_PATH : undefined);
      } catch {
        navigate("/login?error=google", { replace: true });
      }
    })();
    // Intentionally run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FFECE4]">
      {quizSaveError && authenticatedUser ? (
        <div className="flex max-w-sm flex-col gap-4 px-6 text-center">
          <p className="text-sm text-red-600" role="alert">{quizSaveError}</p>
          <Button type="button" disabled={isSavingQuiz} onClick={() => void retryPendingQuiz()}>
            {isSavingQuiz ? "Saving your result…" : "Retry saving my result"}
          </Button>
        </div>
      ) : (
        <p className="text-[#181818]">{isSavingQuiz ? "Saving your readiness result…" : isLoading ? "Signing you in…" : "Redirecting…"}</p>
      )}
    </div>
  );
}
