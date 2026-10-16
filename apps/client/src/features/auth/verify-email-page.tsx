import * as React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@forth-urban/ui";
import { useAuth } from "../../lib/auth-context";
import { getErrorMessage } from "../../lib/api-error";
import { useAuthFlowCompletion } from "./auth-flow";
import { AuthLayout } from "./auth-layout";

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const token = searchParams.get("token") ?? "";
  const { verifyEmail, resendEmailVerification } = useAuth();
  const {
    complete,
    retryPendingQuiz,
    authenticatedUser,
    isSavingQuiz,
    quizSaveError,
  } = useAuthFlowCompletion();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [isResending, setIsResending] = React.useState(false);
  const [resendMessage, setResendMessage] = React.useState<string | null>(null);

  async function handleVerify() {
    if (!email || !token) {
      setServerError("This confirmation link is incomplete. Request a new email and try again.");
      return;
    }

    setServerError(null);
    setIsVerifying(true);
    try {
      const { user, homeReadinessResult } = await verifyEmail({ email, token });
      await complete(user, undefined, homeReadinessResult);
    } catch (error) {
      setServerError(getErrorMessage(error, "This confirmation link is invalid or has expired."));
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResend() {
    if (!email) {
      setServerError("Enter your email from the registration page to request another confirmation link.");
      return;
    }

    setServerError(null);
    setResendMessage(null);
    setIsResending(true);
    try {
      await resendEmailVerification(email);
      setResendMessage("If an unverified account exists for this email, a new confirmation link has been sent.");
    } catch (error) {
      setServerError(getErrorMessage(error, "We could not send another confirmation email."));
    } finally {
      setIsResending(false);
    }
  }

  return (
    <AuthLayout
      title="Confirm your email"
      description={email ? `We sent a confirmation link to ${email}.` : "Use the confirmation link from your email."}
      footer={
        <>
          Need to start again? <Link to="/register" className="font-medium text-[#5C4033] underline">Create an account</Link>
        </>
      }
    >
      <div className="flex flex-col gap-4 text-center">
        <p className="text-sm text-[#181818]/70">
          Your account stays inactive until you confirm this email address.
        </p>
        {serverError ? <p className="text-sm text-red-600" role="alert">{serverError}</p> : null}
        {quizSaveError ? <p className="text-sm text-red-600" role="alert">{quizSaveError}</p> : null}
        {authenticatedUser && quizSaveError ? (
          <Button type="button" disabled={isSavingQuiz} onClick={() => void retryPendingQuiz()} className="w-full">
            {isSavingQuiz ? "Saving your result..." : "Retry saving my result"}
          </Button>
        ) : (
          <Button type="button" disabled={isVerifying || isSavingQuiz || !email || !token} onClick={() => void handleVerify()} className="w-full">
            {isVerifying ? "Confirming..." : isSavingQuiz ? "Saving your result..." : "Confirm email"}
          </Button>
        )}
        <Button type="button" variant="secondary" disabled={isResending || !email} onClick={() => void handleResend()} className="w-full">
          {isResending ? "Sending..." : "Resend confirmation email"}
        </Button>
        {resendMessage ? <p className="text-sm text-green-700" role="status">{resendMessage}</p> : null}
      </div>
    </AuthLayout>
  );
}
