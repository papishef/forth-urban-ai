import { Resend } from "resend";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

/**
 * Thin Resend wrapper. In development without an API key, emails are logged
 * instead of sent so the local flow (OTP/reset) is still testable.
 */
export async function sendEmail(input: SendEmailInput): Promise<void> {
  if (!resend) {
    logger.info({ to: input.to, subject: input.subject }, "RESEND_API_KEY not set — logging email instead of sending");
    return;
  }

  const { error } = await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: input.to,
    subject: input.subject,
    html: input.html,
  });

  if (error) {
    logger.error({ error, to: input.to }, "Failed to send email via Resend");
    throw new Error("Failed to send email");
  }
}

export function otpEmailHtml(code: string): string {
  return `<p>Your Forth Urban verification code is:</p><h2 style="letter-spacing:4px">${code}</h2><p>This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>`;
}

export function passwordResetEmailHtml(resetUrl: string): string {
  return `<p>You requested a password reset for your Forth Urban account.</p><p><a href="${resetUrl}">Reset your password</a></p><p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>`;
}
