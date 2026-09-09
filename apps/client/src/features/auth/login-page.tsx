import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@forth-urban/validation";
import { Button, Input, Label } from "@forth-urban/ui";
import { useAuth } from "../../lib/auth-context";
import { getErrorMessage } from "../../lib/api-error";
import {
  getAuthPagePath,
  markPendingHomeReadinessAuthHandoff,
  useAuthFlowCompletion,
} from "./auth-flow";
import { AuthLayout } from "./auth-layout";

export function LoginPage() {
  const { login } = useAuth();
  const location = useLocation();
  const {
    complete,
    retryPendingQuiz,
    authenticatedUser,
    isSavingQuiz,
    quizSaveError,
    isReadinessHandoff,
  } = useAuthFlowCompletion();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [verificationPath, setVerificationPath] = React.useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    setVerificationPath(null);

    if (authenticatedUser) {
      await retryPendingQuiz();
      return;
    }

    try {
      const user = await login(values);
      await complete(user);
    } catch (err) {
      const message = getErrorMessage(err, "Invalid email or password");
      setServerError(message);
      if (message.toLowerCase().includes("confirm your email")) {
        const params = new URLSearchParams({ email: values.email });
        const next = new URLSearchParams(location.search).get("next");
        if (next) params.set("next", next);
        setVerificationPath(`/verify-email?${params.toString()}`);
      }
    }
  });

  return (
    <AuthLayout
      title="Welcome back"
      description={
        isReadinessHandoff
          ? "Log in to receive your saved readiness result."
          : "Log in to continue your property journey."
      }
      footer={
        <>
          New here? <Link to={getAuthPagePath("/register", location.search)} className="font-medium text-[#5C4033] underline">Create an account</Link>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...register("email")} />
          {errors.email ? <p className="text-sm text-red-600">{errors.email.message}</p> : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="current-password" {...register("password")} />
          {errors.password ? <p className="text-sm text-red-600">{errors.password.message}</p> : null}
        </div>
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm text-[#5C4033] underline">
            Forgot password?
          </Link>
        </div>
        {serverError ? <p className="text-sm text-red-600" role="alert">{serverError}</p> : null}
        {verificationPath ? (
          <Link to={verificationPath} className="text-center text-sm font-medium text-[#5C4033] underline">
            Resend confirmation email
          </Link>
        ) : null}
        {quizSaveError ? <p className="text-sm text-red-600" role="alert">{quizSaveError}</p> : null}
        {authenticatedUser && quizSaveError ? (
          <Button type="button" disabled={isSavingQuiz} onClick={() => void retryPendingQuiz()} className="w-full">
            {isSavingQuiz ? "Saving your result…" : "Retry saving my result"}
          </Button>
        ) : (
          <Button type="submit" disabled={isSubmitting || isSavingQuiz} className="w-full">
            {isSavingQuiz ? "Saving your result…" : isSubmitting ? "Logging in…" : "Log in"}
          </Button>
        )}
        <a
          href={`${import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api"}/auth/google`}
          className="w-full"
          onClick={() => {
            if (isReadinessHandoff) markPendingHomeReadinessAuthHandoff();
          }}
        >
          <Button type="button" variant="secondary" className="w-full">
            Continue with Google
          </Button>
        </a>
        <Link to={getAuthPagePath("/login/otp", location.search)} className="text-center text-sm text-[#5C4033] underline">
          Log in with a one-time code instead
        </Link>
      </form>
    </AuthLayout>
  );
}
