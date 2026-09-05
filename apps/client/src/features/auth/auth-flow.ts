import * as React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { HomeReadinessResultDTO, UserDTO } from "@forth-urban/shared-types";
import { useSubmitHomeReadinessQuiz } from "../quiz/quiz-api";
import {
  clearPendingHomeReadinessQuiz,
  getPendingHomeReadinessQuiz,
  hasPendingHomeReadinessAuthHandoff,
} from "../quiz/pending-home-readiness";
import { getErrorMessage } from "../../lib/api-error";
import { getAdminLandingPath, hasAdminSurface } from "../../lib/admin-access";

export { markPendingHomeReadinessAuthHandoff } from "../quiz/pending-home-readiness";

export const HOME_READINESS_RESULT_PATH = "/quiz/home-readiness/result";

function isSafeInternalPath(value: string): boolean {
  return value.startsWith("/") && !value.startsWith("//") && !value.includes("\\") && !value.includes("\0");
}

export function getSafeAuthDestination(search: string): string {
  const requested = new URLSearchParams(search).get("next");
  return requested && isSafeInternalPath(requested) ? requested : "/dashboard";
}

export function getAuthPagePath(path: "/login" | "/register" | "/login/otp", search: string): string {
  const query = new URLSearchParams(search);
  if (!query.has("next")) return path;

  const destination = getSafeAuthDestination(search);
  return `${path}?next=${encodeURIComponent(destination)}`;
}

interface AuthFlowCompletion {
  complete: (user: UserDTO, destinationOverride?: string) => Promise<boolean>;
  retryPendingQuiz: () => Promise<boolean>;
  authenticatedUser: UserDTO | null;
  isSavingQuiz: boolean;
  quizSaveError: string | null;
  isReadinessHandoff: boolean;
}

export function useAuthFlowCompletion(): AuthFlowCompletion {
  const location = useLocation();
  const navigate = useNavigate();
  const submitQuiz = useSubmitHomeReadinessQuiz();
  const requestedDestination =
    hasPendingHomeReadinessAuthHandoff() ? HOME_READINESS_RESULT_PATH : getSafeAuthDestination(location.search);
  const [authenticatedUser, setAuthenticatedUser] = React.useState<UserDTO | null>(null);
  const [isSavingQuiz, setIsSavingQuiz] = React.useState(false);
  const [quizSaveError, setQuizSaveError] = React.useState<string | null>(null);

  const complete = React.useCallback(
    async (user: UserDTO, destinationOverride?: string): Promise<boolean> => {
      setAuthenticatedUser(user);
      setQuizSaveError(null);
      const destination = destinationOverride ?? requestedDestination;

      if (hasAdminSurface(user)) {
        clearPendingHomeReadinessQuiz();
        navigate(getAdminLandingPath(user), { replace: true });
        return true;
      }

      if (destination !== HOME_READINESS_RESULT_PATH) {
        navigate(destination, { replace: true });
        return true;
      }

      const pendingAnswers = getPendingHomeReadinessQuiz();
      if (!pendingAnswers) {
        navigate("/dashboard", { replace: true });
        return true;
      }

      setIsSavingQuiz(true);
      try {
        const result: HomeReadinessResultDTO = await submitQuiz.mutateAsync(pendingAnswers);
        clearPendingHomeReadinessQuiz();
        navigate(HOME_READINESS_RESULT_PATH, { replace: true, state: result });
        return true;
      } catch (error) {
        setQuizSaveError(
          getErrorMessage(error, "Your account is ready, but we could not save your readiness result. Try again."),
        );
        return false;
      } finally {
        setIsSavingQuiz(false);
      }
    },
    [navigate, requestedDestination, submitQuiz],
  );

  const retryPendingQuiz = React.useCallback(
    () => (authenticatedUser ? complete(authenticatedUser, HOME_READINESS_RESULT_PATH) : Promise.resolve(false)),
    [authenticatedUser, complete],
  );

  return {
    complete,
    retryPendingQuiz,
    authenticatedUser,
    isSavingQuiz,
    quizSaveError,
    isReadinessHandoff:
      requestedDestination === HOME_READINESS_RESULT_PATH && Boolean(getPendingHomeReadinessQuiz()),
  };
}