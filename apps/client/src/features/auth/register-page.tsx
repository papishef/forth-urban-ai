import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@forth-urban/validation";
import { Button, Input, Label } from "@forth-urban/ui";
import { useAuth } from "../../lib/auth-context";
import { getErrorMessage } from "../../lib/api-error";
import {
  getAuthPagePath,
  markPendingHomeReadinessAuthHandoff,
  useAuthFlowCompletion,
} from "./auth-flow";
import { AuthLayout } from "./auth-layout";

export function RegisterPage() {
  const { register: registerUser } = useAuth();
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
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);

    if (authenticatedUser) {
      await retryPendingQuiz();
      return;
    }

    try {
      const user = await registerUser(values);
      await complete(user);
    } catch (err) {
      setServerError(getErrorMessage(err, "Could not create your account"));
    }
  });

  return (
    <AuthLayout
      title={isReadinessHandoff ? "Save your readiness result" : "Create your account"}
      description={
        isReadinessHandoff
          ? "Enter your details and we’ll send your personalized readiness result."
          : "Free profile — takes less than a minute."
      }
      footer={
        <>
          Already have an account? <Link to={getAuthPagePath("/login", location.search)} className="font-medium text-[#5C4033] underline">Log in</Link>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
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
        {quizSaveError ? <p className="text-sm text-red-600" role="alert">{quizSaveError}</p> : null}
        {authenticatedUser && quizSaveError ? (
          <Button type="button" disabled={isSavingQuiz} onClick={() => void retryPendingQuiz()} className="w-full">
            {isSavingQuiz ? "Saving your result…" : "Retry saving my result"}
          </Button>
        ) : (
          <Button type="submit" disabled={isSubmitting || isSavingQuiz} className="w-full">
            {isSavingQuiz ? "Saving your result…" : isSubmitting ? "Creating account…" : "Create account"}
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
      </form>
    </AuthLayout>
  );
}
