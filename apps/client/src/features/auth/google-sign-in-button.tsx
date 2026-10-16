import * as React from "react";
import type { GoogleRegistrationIntentDTO } from "@forth-urban/shared-types";
import { Button } from "@forth-urban/ui";
import { API_BASE_URL, apiClient } from "../../lib/api-client";
import { getErrorMessage } from "../../lib/api-error";
import { ensureRegistrationQuizSession } from "../quiz/quiz-api";
import { getPendingHomeReadinessQuiz } from "../quiz/pending-home-readiness";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T | null;
}

/**
 * New Google accounts are only created when the OAuth redirect carries a
 * registration intent (the completed quiz, stored server-side first).
 * Existing accounts can always sign in with Google, so failures to create
 * the intent fall back to a plain sign-in redirect.
 */
async function buildGoogleSignInUrl(): Promise<string> {
  const base = `${API_BASE_URL}/auth/google`;
  const answers = getPendingHomeReadinessQuiz();
  if (!answers) return base;

  const quizSessionToken = await ensureRegistrationQuizSession();
  if (!quizSessionToken) return base;

  const res = await apiClient.post<ApiEnvelope<GoogleRegistrationIntentDTO>>("/auth/registration/google-intent", {
    homeReadiness: answers,
    quizSessionToken,
  });
  const intentToken = res.data.data?.intentToken;
  return intentToken ? `${base}?intent=${encodeURIComponent(intentToken)}` : base;
}

export function GoogleSignInButton({ onBeforeRedirect }: { onBeforeRedirect?: () => void }) {
  const [isStarting, setIsStarting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleClick() {
    setError(null);
    setIsStarting(true);
    try {
      const url = await buildGoogleSignInUrl();
      onBeforeRedirect?.();
      window.location.assign(url);
    } catch (err) {
      setError(getErrorMessage(err, "Could not start Google sign-in. Please try again."));
      setIsStarting(false);
    }
  }

  return (
    <>
      <Button type="button" variant="secondary" className="w-full" disabled={isStarting} onClick={() => void handleClick()}>
        {isStarting ? "Connecting to Google…" : "Continue with Google"}
      </Button>
      {error ? <p className="text-sm text-red-600" role="alert">{error}</p> : null}
    </>
  );
}
