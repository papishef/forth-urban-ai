import * as React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerFormSchema, type RegisterFormInput } from "@forth-urban/validation";
import { Button, Input, Label } from "@forth-urban/ui";
import { useAuth } from "../../lib/auth-context";
import { getErrorMessage } from "../../lib/api-error";
import { ensureRegistrationQuizSession } from "../quiz/quiz-api";
import { getPendingHomeReadinessQuiz } from "../quiz/pending-home-readiness";
import {
  getAuthPagePath,
  markPendingHomeReadinessAuthHandoff,
  useAuthFlowCompletion,
} from "./auth-flow";
import { AuthLayout } from "./auth-layout";
import { GoogleSignInButton } from "./google-sign-in-button";

const QUIZ_PATH = "/quiz/home-readiness";

/**
 * Accounts can only be created with a completed Home-Readiness Quiz — the
 * server rejects registrations without the answers and the quiz session
 * token, so visitors without a pending quiz are sent to take it first.
 */
export function RegisterPage() {
  const { register: registerUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { isReadinessHandoff } = useAuthFlowCompletion();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [pendingQuiz] = React.useState(() => getPendingHomeReadinessQuiz());
  const quizRequiredError = new URLSearchParams(location.search).get("error") === "quiz_required";
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormInput>({ resolver: zodResolver(registerFormSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const homeReadiness = getPendingHomeReadinessQuiz();
    if (!homeReadiness) {
      navigate(QUIZ_PATH, { replace: true });
      return;
    }

    try {
      const quizSessionToken = await ensureRegistrationQuizSession();
      if (!quizSessionToken) {
        setServerError("We could not verify your quiz session. Please check your connection and try again.");
        return;
      }
      if (isReadinessHandoff) markPendingHomeReadinessAuthHandoff();
      const pending = await registerUser({ ...values, homeReadiness, quizSessionToken });
      const params = new URLSearchParams({ email: pending.email });
      const next = new URLSearchParams(location.search).get("next");
      if (next) params.set("next", next);
      navigate(`/verify-email?${params.toString()}`, { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err, "Could not create your account"));
    }
  });

  const footer = (
    <>
      Already have an account? <Link to={getAuthPagePath("/login", location.search)} className="font-medium text-[#5C4033] underline">Log in</Link>
    </>
  );

  if (!pendingQuiz) {
    return (
      <AuthLayout
        title="Start with the readiness quiz"
        description="Your free profile is created from your Home-Readiness Quiz result — it takes about two minutes."
        footer={footer}
      >
        <div className="flex flex-col gap-4 text-center">
          {quizRequiredError ? (
            <p className="text-sm text-red-600" role="alert">
              Please complete the Home-Readiness Quiz before creating an account.
            </p>
          ) : null}
          <Button type="button" className="w-full" onClick={() => navigate(QUIZ_PATH)}>
            Take the Home-Readiness Quiz
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={isReadinessHandoff ? "Save your readiness result" : "Create your account"}
      description={
        isReadinessHandoff
          ? "Enter your details and we’ll send your personalized readiness result."
          : "Free profile — takes less than a minute."
      }
      footer={footer}
    >
      <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
        {/* Honeypot: invisible to people and screen readers, filled in by bots. */}
        <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
          <label htmlFor="website">Website</label>
          <input id="website" type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="firstName">First name</Label>
            <Input id="firstName" autoComplete="given-name" {...register("firstName")} />
            {errors.firstName ? <p className="text-sm text-red-600">{errors.firstName.message}</p> : null}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lastName">Last name</Label>
            <Input id="lastName" autoComplete="family-name" {...register("lastName")} />
            {errors.lastName ? <p className="text-sm text-red-600">{errors.lastName.message}</p> : null}
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...register("email")} />
          {errors.email ? <p className="text-sm text-red-600">{errors.email.message}</p> : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
          {errors.password ? <p className="text-sm text-red-600">{errors.password.message}</p> : null}
        </div>
        {serverError ? <p className="text-sm text-red-600" role="alert">{serverError}</p> : null}
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Creating account…" : "Create account"}
        </Button>
        <GoogleSignInButton
          onBeforeRedirect={() => {
            if (isReadinessHandoff) markPendingHomeReadinessAuthHandoff();
          }}
        />
      </form>
    </AuthLayout>
  );
}
