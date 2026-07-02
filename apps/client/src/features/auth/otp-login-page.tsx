import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { otpRequestSchema, otpVerifySchema, type OtpRequestInput, type OtpVerifyInput } from "@forth-urban/validation";
import { Button, Input, Label } from "@forth-urban/ui";
import { useAuth } from "../../lib/auth-context";
import { getErrorMessage } from "../../lib/api-error";
import { AuthLayout } from "./auth-layout";

export function OtpLoginPage() {
  const { requestOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = React.useState<"request" | "verify">("request");
  const [email, setEmail] = React.useState("");
  const [serverError, setServerError] = React.useState<string | null>(null);

  const requestForm = useForm<OtpRequestInput>({ resolver: zodResolver(otpRequestSchema) });
  const verifyForm = useForm<OtpVerifyInput>({ resolver: zodResolver(otpVerifySchema) });

  const onRequest = requestForm.handleSubmit(async (values) => {
    setServerError(null);
    try {
      await requestOtp(values.email);
      setEmail(values.email);
      verifyForm.setValue("email", values.email);
      setStep("verify");
    } catch (err) {
      setServerError(getErrorMessage(err, "Could not send the code"));
    }
  });

  const onVerify = verifyForm.handleSubmit(async (values) => {
    setServerError(null);
    try {
      await verifyOtp(values);
      navigate("/dashboard");
    } catch (err) {
      setServerError(getErrorMessage(err, "Incorrect or expired code"));
    }
  });

  if (step === "request") {
    return (
      <AuthLayout title="Log in with a code" description="We'll email you a 6-digit one-time code.">
        <form className="flex flex-col gap-4" onSubmit={onRequest} noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...requestForm.register("email")} />
            {requestForm.formState.errors.email ? (
              <p className="text-sm text-red-600">{requestForm.formState.errors.email.message}</p>
            ) : null}
          </div>
          {serverError ? <p className="text-sm text-red-600">{serverError}</p> : null}
          <Button type="submit" disabled={requestForm.formState.isSubmitting} className="w-full">
            {requestForm.formState.isSubmitting ? "Sending…" : "Send code"}
          </Button>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Enter your code" description={`We sent a 6-digit code to ${email}.`}>
      <form className="flex flex-col gap-4" onSubmit={onVerify} noValidate>
        <input type="hidden" {...verifyForm.register("email")} />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="code">Verification code</Label>
          <Input id="code" inputMode="numeric" maxLength={6} {...verifyForm.register("code")} />
          {verifyForm.formState.errors.code ? (
            <p className="text-sm text-red-600">{verifyForm.formState.errors.code.message}</p>
          ) : null}
        </div>
        {serverError ? <p className="text-sm text-red-600">{serverError}</p> : null}
        <Button type="submit" disabled={verifyForm.formState.isSubmitting} className="w-full">
          {verifyForm.formState.isSubmitting ? "Verifying…" : "Verify & continue"}
        </Button>
      </form>
    </AuthLayout>
  );
}
