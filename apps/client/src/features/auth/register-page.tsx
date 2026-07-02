import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@forth-urban/validation";
import { Button, Input, Label } from "@forth-urban/ui";
import { useAuth } from "../../lib/auth-context";
import { getErrorMessage } from "../../lib/api-error";
import { AuthLayout } from "./auth-layout";

export function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await registerUser(values);
      navigate("/dashboard");
    } catch (err) {
      setServerError(getErrorMessage(err, "Could not create your account"));
    }
  });

  return (
    <AuthLayout
      title="Create your account"
      description="Free profile — takes less than a minute."
      footer={
        <>
          Already have an account? <Link to="/login" className="font-medium text-[#5C4033] underline">Log in</Link>
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
        {serverError ? <p className="text-sm text-red-600">{serverError}</p> : null}
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Creating account…" : "Create account"}
        </Button>
        <a
          href={`${import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api"}/auth/google`}
          className="w-full"
        >
          <Button type="button" variant="secondary" className="w-full">
            Continue with Google
          </Button>
        </a>
      </form>
    </AuthLayout>
  );
}
