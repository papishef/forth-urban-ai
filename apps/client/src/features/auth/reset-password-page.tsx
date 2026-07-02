import * as React from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, type ResetPasswordInput } from "@forth-urban/validation";
import { Button, Input, Label } from "@forth-urban/ui";
import { apiClient } from "../../lib/api-client";
import { getErrorMessage } from "../../lib/api-error";
import { AuthLayout } from "./auth-layout";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: searchParams.get("email") ?? "",
      token: searchParams.get("token") ?? "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await apiClient.post("/auth/password/reset", values);
      navigate("/login");
    } catch (err) {
      setServerError(getErrorMessage(err, "This reset link is invalid or has expired"));
    }
  });

  return (
    <AuthLayout
      title="Set a new password"
      description="Choose a strong password for your account."
      footer={
        <Link to="/login" className="font-medium text-[#5C4033] underline">
          Back to login
        </Link>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
        <input type="hidden" {...register("email")} />
        <input type="hidden" {...register("token")} />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">New password</Label>
          <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
          {errors.password ? <p className="text-sm text-red-600">{errors.password.message}</p> : null}
        </div>
        {serverError ? <p className="text-sm text-red-600">{serverError}</p> : null}
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Updating…" : "Update password"}
        </Button>
      </form>
    </AuthLayout>
  );
}
