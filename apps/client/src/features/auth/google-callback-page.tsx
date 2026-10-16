import * as React from "react";
import { useNavigate } from "react-router-dom";
import type { AuthResponse } from "@forth-urban/shared-types";
import { refreshSession, setCsrfToken } from "../../lib/api-client";
import { useAuth } from "../../lib/auth-context";
import {
  HOME_READINESS_RESULT_PATH,
  useAuthFlowCompletion,
} from "./auth-flow";
import { hasPendingHomeReadinessAuthHandoff } from "../quiz/pending-home-readiness";
import { Button } from "@forth-urban/ui";

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
        // The API hands over the CSRF token in the URL fragment (client and
        // API are cross-site, so its cookie isn't readable here). Strip it
        // from the address bar immediately.
        const csrfFromFragment = new URLSearchParams(window.location.hash.slice(1)).get("csrf");
        if (csrfFromFragment) {
          setCsrfToken(csrfFromFragment);
          window.history.replaceState(null, "", window.location.pathname + window.location.search);
        }
        const data = await refreshSession<AuthResponse>();
        if (!data) throw new Error("Session could not be restored");
        const user = applyAuthResponse(data);
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
