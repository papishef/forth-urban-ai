import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@forth-urban/validation";
import { Button, Input, Label } from "@forth-urban/ui";
import { useAuth } from "../../lib/auth-context";
import { getErrorMessage } from "../../lib/api-error";
import { AuthLayout } from "./auth-layout";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      const user = await login(values);
      if (user?.role === "admin" || user?.role === "sales") {
        navigate("/admin/inspections");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setServerError(getErrorMessage(err, "Invalid email or password"));
    }
  });

  return (
    <AuthLayout
      title="Welcome back"
      description="Log in to continue your property journey."
      footer={
        <>
          New here? <Link to="/register" className="font-medium text-[#5C4033] underline">Create an account</Link>
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
        {serverError ? <p className="text-sm text-red-600">{serverError}</p> : null}
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Logging in…" : "Log in"}
        </Button>
        <a
          href={`${import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api"}/auth/google`}
          className="w-full"
        >
          <Button type="button" variant="secondary" className="w-full">
            Continue with Google
          </Button>
        </a>
        <Link to="/login/otp" className="text-center text-sm text-[#5C4033] underline">
          Log in with a one-time code instead
        </Link>
      </form>
    </AuthLayout>
  );
}
