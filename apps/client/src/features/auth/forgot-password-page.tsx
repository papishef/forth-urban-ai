import * as React from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@forth-urban/validation";
import { Button, Input, Label } from "@forth-urban/ui";
import { apiClient } from "../../lib/api-client";
import { getErrorMessage } from "../../lib/api-error";
import { AuthLayout } from "./auth-layout";

export function ForgotPasswordPage() {
  const [sent, setSent] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await apiClient.post("/auth/password/forgot", values);
      setSent(true);
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  });

  if (sent) {
    return (
      <AuthLayout title="Check your email" description="If an account exists for that email, a reset link is on its way.">
        <Link to="/login" className="text-center text-sm text-[#5C4033] underline">
          Back to login
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset your password" description="Enter your email and we'll send you a reset link.">
      <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...register("email")} />
          {errors.email ? <p className="text-sm text-red-600">{errors.email.message}</p> : null}
        </div>
        {serverError ? <p className="text-sm text-red-600">{serverError}</p> : null}
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Sending…" : "Send reset link"}
        </Button>
      </form>
    </AuthLayout>
  );
}
