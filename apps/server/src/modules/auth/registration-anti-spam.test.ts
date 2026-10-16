import { describe, expect, it, vi } from "vitest";
import request from "supertest";
import type { Profile } from "passport-google-oauth20";
import { User } from "../users/user.model.js";
import { QuizResponse } from "../quiz/quiz-response.model.js";
import { Session } from "./session.model.js";
import { registrationBody, testHomeReadinessAnswers, completedQuizSessionToken, registerVerifiedUser } from "../../test/auth-helpers.js";

vi.mock("../../lib/email.service.js", () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
  otpEmailHtml: () => "<p>otp</p>",
  emailVerificationEmailHtml: () => "<p>verify</p>",
  passwordResetEmailHtml: () => "<p>reset</p>",
}));

const { createApp } = await import("../../app.js");
const { findOrCreateGoogleUser } = await import("./passport.js");
const { purgeStaleUnverifiedAccounts, findAccountsWithoutQuiz, softDeleteSpamAccounts } = await import(
  "./spam-account-cleanup.service.js"
);

function googleProfile(email: string, id = `g-${email}`): Profile {
  return {
    id,
    displayName: "Grace Hopper",
    name: { givenName: "Grace", familyName: "Hopper" },
    emails: [{ value: email, verified: true }],
    provider: "google",
  } as unknown as Profile;
}

async function createIntent(app: ReturnType<typeof createApp>): Promise<string> {
  const res = await request(app)
    .post("/api/auth/registration/google-intent")
    .send({ homeReadiness: testHomeReadinessAnswers, quizSessionToken: completedQuizSessionToken() });
  expect(res.status).toBe(201);
  return res.body.data.intentToken as string;
}

describe("Google sign-up quiz gate", () => {
  it("refuses to create a new Google account without a registration intent", async () => {
    const user = await findOrCreateGoogleUser(googleProfile("noquiz@gmail.com"), null, "1.2.3.4");
    expect(user).toBeNull();
    expect(await User.countDocuments({})).toBe(0);
  });

  it("creates the account and saves the quiz result with a valid intent, exactly once", async () => {
    const app = createApp();
    const intentToken = await createIntent(app);

    const user = await findOrCreateGoogleUser(googleProfile("quizzed@gmail.com"), intentToken, "1.2.3.4");
    expect(user?.email).toBe("quizzed@gmail.com");
    expect(await QuizResponse.countDocuments({ userId: user!._id })).toBe(1);

    const reuse = await findOrCreateGoogleUser(googleProfile("other@gmail.com"), intentToken, "1.2.3.4");
    expect(reuse).toBeNull();
  });

  it("lets existing accounts sign in with Google without an intent", async () => {
    const app = createApp();
    const { email } = await registerVerifiedUser(app);
    const user = await findOrCreateGoogleUser(googleProfile(email), null, "1.2.3.4");
    expect(user?.email).toBe(email);
  });
});

describe("spam account cleanup", () => {
  it("soft-deletes stale unverified accounts, frees the email and revokes sessions", async () => {
    const app = createApp();
    const body = registrationBody({ email: "stale@example.com" });
    await request(app).post("/api/auth/register").send(body);
    const stale = await User.findOne({ email: "stale@example.com" });
    await User.collection.updateOne(
      { _id: stale!._id },
      { $set: { createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) } },
    );
    await Session.create({
      userId: stale!._id,
      refreshTokenHash: "x",
      expiresAt: new Date(Date.now() + 60_000),
    });
    const verified = await registerVerifiedUser(app);

    const deleted = await purgeStaleUnverifiedAccounts(7);
    expect(deleted).toBe(1);

    expect(await User.findOne({ email: "stale@example.com" })).toBeNull();
    const tombstoned = await User.findOne({ _id: stale!._id }).setOptions({ withDeleted: true }).select("+deletedEmail");
    expect(tombstoned?.get("deletedEmail")).toBe("stale@example.com");
    expect(await Session.countDocuments({ userId: stale!._id, revokedAt: null })).toBe(0);
    expect(await User.findById(verified.userId)).not.toBeNull();

    const reRegister = await request(app).post("/api/auth/register").send(registrationBody({ email: "stale@example.com" }));
    expect(reRegister.status).toBe(201);
  });

  it("finds accounts that never completed the quiz but leaves engaged and admin users alone", async () => {
    const app = createApp();
    const spam = await User.create({ firstName: "Spam", lastName: "Bot", email: "spam@example.com", emailVerified: true });
    await User.create({ firstName: "Owner", lastName: "Admin", email: "admin@example.com", emailVerified: true, role: "admin" });
    const engaged = await registerVerifiedUser(app);
    await QuizResponse.create({
      userId: engaged.userId,
      quizType: "homeReadiness",
      answers: [],
      readinessScore: 50,
      resultType: "almostReady",
      completedAt: new Date(),
    });

    const candidates = await findAccountsWithoutQuiz(new Date(Date.now() + 1000));
    expect(candidates.map((c) => c.email)).toEqual(["spam@example.com"]);

    expect(await softDeleteSpamAccounts(candidates)).toBe(1);
    expect(await User.findById(spam._id)).toBeNull();
  });
});
