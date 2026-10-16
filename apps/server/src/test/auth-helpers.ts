import request from "supertest";
import type { HomeReadinessAnswers } from "@forth-urban/validation";
import { createApp } from "../app.js";
import { env } from "../config/env.js";
import { signAccessToken } from "../modules/auth/jwt.util.js";
import { signRegistrationQuizSessionToken } from "../modules/auth/registration-guard.js";
import { User } from "../modules/users/user.model.js";

interface RegistrationOverrides {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
}

export const testHomeReadinessAnswers: HomeReadinessAnswers = {
  buyerGoal: "residential",
  budgetRange: { min: 10_000_000, max: 20_000_000 },
  monthlyIncome: 5_000_000,
  paymentStyle: "installment",
  timeline: "now",
  preferredArea: "Guzape II",
  lifestylePreference: "premiumQuiet",
  biggestFear: "locationConfusion",
  inspectionPreference: "physical",
};

/** A quiz session token that already satisfies the minimum quiz-completion time. */
export function completedQuizSessionToken(): string {
  const issuedAt = new Date(Date.now() - (env.REGISTRATION_MIN_QUIZ_SECONDS + 5) * 1000);
  return signRegistrationQuizSessionToken(issuedAt).token;
}

/** Valid POST /api/auth/register body (completed quiz + quiz session token). */
export function registrationBody(overrides: RegistrationOverrides = {}) {
  return {
    firstName: overrides.firstName ?? "Ada",
    lastName: overrides.lastName ?? "Lovelace",
    email: overrides.email ?? `user-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
    password: overrides.password ?? "supersecret123",
    homeReadiness: testHomeReadinessAnswers,
    quizSessionToken: completedQuizSessionToken(),
  };
}

export async function registerVerifiedUser(
  app: ReturnType<typeof createApp>,
  overrides: RegistrationOverrides = {},
): Promise<{ token: string; userId: string; email: string }> {
  const body = registrationBody(overrides);
  const registration = await request(app).post("/api/auth/register").send(body);

  if (registration.status !== 201) {
    throw new Error(`Test registration failed with status ${registration.status}`);
  }

  const user = await User.findOneAndUpdate({ email: body.email }, { emailVerified: true }, { new: true });
  if (!user) throw new Error("Test registration did not create a user");

  return {
    token: signAccessToken({ sub: user._id.toString(), role: user.role as "user" | "admin", email: user.email }),
    userId: user._id.toString(),
    email: user.email,
  };
}
