import { describe, expect, it, vi, beforeEach } from "vitest";
import request from "supertest";
import { User } from "../users/user.model.js";
import { signAccessToken } from "./jwt.util.js";
import { QuizResponse } from "../quiz/quiz-response.model.js";
import { Profile } from "../users/profile.model.js";
import { RegistrationIntent } from "./registration-intent.model.js";
import { signRegistrationQuizSessionToken } from "./registration-guard.js";
import { completedQuizSessionToken, registrationBody, testHomeReadinessAnswers } from "../../test/auth-helpers.js";

const emailCalls: Array<{ code?: string; resetUrl?: string; verificationUrl?: string }> = [];

vi.mock("../../lib/email.service.js", () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
  otpEmailHtml: (code: string) => {
    emailCalls.push({ code });
    return `<p>${code}</p>`;
  },
  emailVerificationEmailHtml: (verificationUrl: string) => {
    emailCalls.push({ verificationUrl });
    return `<p>${verificationUrl}</p>`;
  },
  passwordResetEmailHtml: (resetUrl: string) => {
    emailCalls.push({ resetUrl });
    return `<p>${resetUrl}</p>`;
  },
}));

const { createApp } = await import("../../app.js");

function extractCookie(res: request.Response, name: string): string | undefined {
  const setCookie = res.headers["set-cookie"] as unknown as string[] | undefined;
  const raw = setCookie?.find((c) => c.startsWith(`${name}=`));
  return raw?.split(";")[0]?.split("=")[1];
}

async function verifyLatestEmail(app: ReturnType<typeof createApp>, email: string) {
  const verificationUrl = [...emailCalls].reverse().find((call) => call.verificationUrl)?.verificationUrl;
  expect(verificationUrl).toBeDefined();
  const token = new URL(verificationUrl!).searchParams.get("token");
  return request(app).post("/api/auth/email-verification/verify").send({ email, token });
}

async function registerAndVerify(app: ReturnType<typeof createApp>, email: string, password = "supersecret123") {
  await request(app).post("/api/auth/register").send(registrationBody({
    firstName: "Ada",
    lastName: "Lovelace",
    email,
    password,
  }));
  const verifyRes = await verifyLatestEmail(app, email);
  expect(verifyRes.status).toBe(200);
  return verifyRes;
}

describe("auth routes", () => {
  beforeEach(() => {
    emailCalls.length = 0;
  });

  it("registers a pending user and sends an email confirmation link without issuing a session", async () => {
    const app = createApp();
    const res = await request(app).post("/api/auth/register").send(registrationBody({
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      password: "supersecret123",
    }));

    expect(res.status).toBe(201);
    expect(res.body.data).toEqual({ email: "ada@example.com", requiresEmailVerification: true });
    expect(extractCookie(res, "refreshToken")).toBeUndefined();
    expect(extractCookie(res, "csrfToken")).toBeUndefined();
    expect(emailCalls[0]?.verificationUrl).toContain("/verify-email?");

    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "ada@example.com", password: "supersecret123" });
    expect(login.status).toBe(403);

    const verifyRes = await verifyLatestEmail(app, "ada@example.com");
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.user.emailVerified).toBe(true);
    expect(verifyRes.body.data.tokens.accessToken).toBeTypeOf("string");
  });

  it("rejects duplicate registration", async () => {
    const app = createApp();
    await request(app).post("/api/auth/register").send(registrationBody({
      firstName: "Ada",
      lastName: "Lovelace",
      email: "dup@example.com",
      password: "supersecret123",
    }));
    const res = await request(app).post("/api/auth/register").send(registrationBody({
      firstName: "Ada",
      lastName: "Lovelace",
      email: "dup@example.com",
      password: "supersecret123",
    }));
    expect(res.status).toBe(409);
  });

  it("consumes an email confirmation link after the first successful use", async () => {
    const app = createApp();
    await request(app).post("/api/auth/register").send(registrationBody({
      firstName: "Ada",
      lastName: "Lovelace",
      email: "single-use@example.com",
      password: "supersecret123",
    }));

    const firstVerification = await verifyLatestEmail(app, "single-use@example.com");
    expect(firstVerification.status).toBe(200);

    const verificationUrl = [...emailCalls].reverse().find((call) => call.verificationUrl)?.verificationUrl;
    const token = new URL(verificationUrl!).searchParams.get("token");
    const secondVerification = await request(app)
      .post("/api/auth/email-verification/verify")
      .send({ email: "single-use@example.com", token });
    expect(secondVerification.status).toBe(400);
  });

  it("rejects a bearer token for an unverified account", async () => {
    const app = createApp();
    await request(app).post("/api/auth/register").send(registrationBody({
      firstName: "Ada",
      lastName: "Lovelace",
      email: "unverified-token@example.com",
      password: "supersecret123",
    }));
    const user = await User.findOne({ email: "unverified-token@example.com" });
    expect(user).not.toBeNull();
    const accessToken = signAccessToken({
      sub: user!._id.toString(),
      role: "user",
      email: user!.email,
    });

    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/confirm your email/i);
  });

  it("resends confirmation without revealing whether an account exists", async () => {
    const app = createApp();
    const missing = await request(app)
      .post("/api/auth/email-verification/resend")
      .send({ email: "missing@example.com" });
    expect(missing.status).toBe(200);
    expect(missing.body.message).toMatch(/if an unverified account exists/i);
    expect(emailCalls).toHaveLength(0);

    await request(app).post("/api/auth/register").send(registrationBody({
      firstName: "Ada",
      lastName: "Lovelace",
      email: "resend@example.com",
      password: "supersecret123",
    }));
    const resend = await request(app)
      .post("/api/auth/email-verification/resend")
      .send({ email: "resend@example.com" });
    expect(resend.status).toBe(200);
    expect(resend.body.message).toMatch(/if an unverified account exists/i);
  });

  it("logs in with correct credentials and rejects wrong password", async () => {
    const app = createApp();
    await request(app).post("/api/auth/register").send(registrationBody({
      firstName: "Grace",
      lastName: "Hopper",
      email: "grace@example.com",
      password: "supersecret123",
    }));

    const badLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "grace@example.com", password: "wrongpassword" });
    expect(badLogin.status).toBe(401);

    const goodLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "grace@example.com", password: "supersecret123" });
    expect(goodLogin.status).toBe(403);

    await verifyLatestEmail(app, "grace@example.com");
    const verifiedLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "grace@example.com", password: "supersecret123" });
    expect(verifiedLogin.status).toBe(200);
    expect(verifiedLogin.body.data.user.email).toBe("grace@example.com");
  });

  it("verifies the caller's own password, rejecting a wrong one and requiring auth", async () => {
    const app = createApp();
    const verifyRes = await registerAndVerify(app, "alan@example.com");
    const token = verifyRes.body.data.tokens.accessToken as string;

    const noAuth = await request(app).post("/api/auth/password/verify").send({ password: "supersecret123" });
    expect(noAuth.status).toBe(401);

    const wrongPassword = await request(app)
      .post("/api/auth/password/verify")
      .set("Authorization", `Bearer ${token}`)
      .send({ password: "wrongpassword" });
    expect(wrongPassword.status).toBe(401);

    const correctPassword = await request(app)
      .post("/api/auth/password/verify")
      .set("Authorization", `Bearer ${token}`)
      .send({ password: "supersecret123" });
    expect(correctPassword.status).toBe(200);
    expect(correctPassword.body.data.reauthToken).toBeTypeOf("string");
  });

  it("changes a local password, rotates the session, and invalidates the old credential", async () => {
    const app = createApp();
    const verifyRes = await registerAndVerify(app, "dorothy@example.com", "originalpass1");
    const oldToken = verifyRes.body.data.tokens.accessToken as string;

    const change = await request(app)
      .post("/api/auth/password/change")
      .set("Authorization", `Bearer ${oldToken}`)
      .send({ currentPassword: "originalpass1", newPassword: "brandnewpass1", confirmPassword: "brandnewpass1" });

    expect(change.status).toBe(200);
    expect(change.body.data.tokens.accessToken).toBeTypeOf("string");
    expect(change.body.data.tokens.accessToken).not.toBe(oldToken);

    const oldLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "dorothy@example.com", password: "originalpass1" });
    expect(oldLogin.status).toBe(401);

    const newLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "dorothy@example.com", password: "brandnewpass1" });
    expect(newLogin.status).toBe(200);
  });

  it("supports OTP request + verify for an existing account and activates its registration quiz", async () => {
    const app = createApp();
    await request(app).post("/api/auth/register").send(registrationBody({ email: "otp@example.com" }));
    emailCalls.length = 0;

    await request(app).post("/api/auth/otp/request").send({ email: "otp@example.com" });
    expect(emailCalls[0]?.code).toMatch(/^\d{6}$/);

    const verifyRes = await request(app)
      .post("/api/auth/otp/verify")
      .send({ email: "otp@example.com", code: emailCalls[0]!.code });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.user.email).toBe("otp@example.com");
    expect(verifyRes.body.data.user.emailVerified).toBe(true);
    expect(verifyRes.body.data.homeReadinessResult.score).toBeTypeOf("number");
  });

  it("never sends OTP codes to, or creates accounts for, unknown emails", async () => {
    const app = createApp();
    const requestRes = await request(app).post("/api/auth/otp/request").send({ email: "stranger@example.com" });
    expect(requestRes.status).toBe(200);
    expect(emailCalls).toHaveLength(0);

    const verifyRes = await request(app)
      .post("/api/auth/otp/verify")
      .send({ email: "stranger@example.com", code: "123456" });
    expect(verifyRes.status).toBe(400);
    expect(await User.countDocuments({ email: "stranger@example.com" })).toBe(0);
  });

  it("rejects an incorrect OTP code", async () => {
    const app = createApp();
    await request(app).post("/api/auth/register").send(registrationBody({ email: "otpwrong@example.com" }));
    await request(app).post("/api/auth/otp/request").send({ email: "otpwrong@example.com" });

    const res = await request(app)
      .post("/api/auth/otp/verify")
      .send({ email: "otpwrong@example.com", code: "000000" });

    expect(res.status).toBe(400);
  });

  it("refreshes and logs out using the CSRF-protected cookie flow", async () => {
    const app = createApp();
    const agent = request.agent(app);

    await agent.post("/api/auth/register").send(registrationBody({
      firstName: "Alan",
      lastName: "Turing",
      email: "alan@example.com",
      password: "supersecret123",
    }));
    const verificationUrl = [...emailCalls].reverse().find((call) => call.verificationUrl)?.verificationUrl;
    const token = new URL(verificationUrl!).searchParams.get("token");
    const verifyRes = await agent.post("/api/auth/email-verification/verify").send({
      email: "alan@example.com",
      token,
    });
    expect(verifyRes.status).toBe(200);
    const csrfToken = extractCookie(verifyRes, "csrfToken")!;

    const refreshRes = await agent.post("/api/auth/refresh").set("x-csrf-token", csrfToken);
    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.data.tokens.accessToken).toBeTypeOf("string");

    const newCsrfToken = extractCookie(refreshRes, "csrfToken") ?? csrfToken;
    const logoutRes = await agent.post("/api/auth/logout").set("x-csrf-token", newCsrfToken);
    expect(logoutRes.status).toBe(200);
  });

  it("rejects refresh/logout without a valid CSRF token", async () => {
    const app = createApp();
    const agent = request.agent(app);
    await agent.post("/api/auth/register").send(registrationBody({
      firstName: "Margaret",
      lastName: "Hamilton",
      email: "margaret@example.com",
      password: "supersecret123",
    }));
    const verificationUrl = [...emailCalls].reverse().find((call) => call.verificationUrl)?.verificationUrl;
    const token = new URL(verificationUrl!).searchParams.get("token");
    const verifyRes = await agent.post("/api/auth/email-verification/verify").send({
      email: "margaret@example.com",
      token,
    });
    expect(verifyRes.status).toBe(200);

    const res = await agent.post("/api/auth/refresh").set("x-csrf-token", "not-the-real-token");
    expect(res.status).toBe(403);
  });

  it("completes the forgot/reset password flow and invalidates old sessions", async () => {
    const app = createApp();
    await registerAndVerify(app, "katherine@example.com", "originalpass1");

    await request(app).post("/api/auth/password/forgot").send({ email: "katherine@example.com" });
    const resetUrl = [...emailCalls].reverse().find((call) => call.resetUrl)?.resetUrl;
    expect(resetUrl).toBeDefined();
    const token = new URL(resetUrl!).searchParams.get("token");

    const resetRes = await request(app).post("/api/auth/password/reset").send({
      email: "katherine@example.com",
      token,
      password: "brandnewpass1",
    });
    expect(resetRes.status).toBe(200);

    const oldLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "katherine@example.com", password: "originalpass1" });
    expect(oldLogin.status).toBe(401);

    const newLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "katherine@example.com", password: "brandnewpass1" });
    expect(newLogin.status).toBe(200);
  });

  it("validates request bodies before hitting the service layer", async () => {
    const app = createApp();
    const res = await request(app).post("/api/auth/register").send({ email: "not-an-email" });
    expect(res.status).toBe(400);
  });

  it("issues a 30-day persistent CSRF cookie alongside the refresh cookie", async () => {
    const app = createApp();
    const verifyRes = await registerAndVerify(app, "persistent@example.com");
    const cookies = verifyRes.headers["set-cookie"] as unknown as string[];
    const csrfCookie = cookies.find((c) => c.startsWith("csrfToken="));
    const refreshCookie = cookies.find((c) => c.startsWith("refreshToken="));
    const thirtyDays = String(30 * 24 * 60 * 60);
    expect(csrfCookie).toContain(`Max-Age=${thirtyDays}`);
    expect(refreshCookie).toContain(`Max-Age=${thirtyDays}`);
  });

  describe("quiz-gated registration (anti-spam)", () => {
    it("issues an anonymous quiz session token", async () => {
      const app = createApp();
      const res = await request(app).post("/api/auth/registration/quiz-session");
      expect(res.status).toBe(201);
      expect(res.body.data.quizSessionToken).toBeTypeOf("string");
      expect(res.body.data.minCompletionSeconds).toBeGreaterThan(0);
    });

    it("rejects registration without completed quiz answers or a quiz session token", async () => {
      const app = createApp();
      const { homeReadiness: _omitQuiz, ...withoutQuiz } = registrationBody({ email: "noquiz@example.com" });
      const { quizSessionToken: _omitToken, ...withoutToken } = registrationBody({ email: "notoken@example.com" });

      expect((await request(app).post("/api/auth/register").send(withoutQuiz)).status).toBe(400);
      expect((await request(app).post("/api/auth/register").send(withoutToken)).status).toBe(400);
      expect(
        (
          await request(app)
            .post("/api/auth/register")
            .send({ ...registrationBody({ email: "forged@example.com" }), quizSessionToken: "forged.token.value" })
        ).status,
      ).toBe(400);
      expect(await User.countDocuments({})).toBe(0);
      expect(emailCalls).toHaveLength(0);
    });

    it("rejects a quiz session that was completed implausibly fast", async () => {
      const app = createApp();
      const freshToken = signRegistrationQuizSessionToken(new Date()).token;
      const res = await request(app)
        .post("/api/auth/register")
        .send({ ...registrationBody({ email: "speedy@example.com" }), quizSessionToken: freshToken });
      expect(res.status).toBe(400);
      expect(await User.countDocuments({})).toBe(0);
    });

    it("allows each quiz session to create only one account", async () => {
      const app = createApp();
      const quizSessionToken = completedQuizSessionToken();
      const first = await request(app)
        .post("/api/auth/register")
        .send({ ...registrationBody({ email: "first@example.com" }), quizSessionToken });
      const replay = await request(app)
        .post("/api/auth/register")
        .send({ ...registrationBody({ email: "second@example.com" }), quizSessionToken });
      expect(first.status).toBe(201);
      expect(replay.status).toBe(400);
      expect(await User.countDocuments({})).toBe(1);
    });

    it("silently drops honeypot submissions", async () => {
      const app = createApp();
      const res = await request(app)
        .post("/api/auth/register")
        .send({ ...registrationBody({ email: "bot@example.com" }), website: "http://spam.example" });
      expect(res.status).toBe(201);
      expect(await User.countDocuments({})).toBe(0);
      expect(emailCalls).toHaveLength(0);
    });

    it("rejects disposable email domains and spammy names", async () => {
      const app = createApp();
      const disposable = await request(app)
        .post("/api/auth/register")
        .send(registrationBody({ email: "bot@mailinator.com" }));
      expect(disposable.status).toBe(400);

      const linkName = await request(app)
        .post("/api/auth/register")
        .send(registrationBody({ email: "links@example.com", firstName: "Visit https://spam.example" }));
      expect(linkName.status).toBe(400);
      expect(await User.countDocuments({})).toBe(0);
    });

    it("saves the registration quiz as the user's result when the email is verified", async () => {
      const app = createApp();
      await request(app).post("/api/auth/register").send(registrationBody({ email: "quizzed@example.com" }));
      const user = await User.findOne({ email: "quizzed@example.com" });
      expect(await QuizResponse.countDocuments({ userId: user!._id })).toBe(0);

      const verifyRes = await verifyLatestEmail(app, "quizzed@example.com");
      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.data.homeReadinessResult.score).toBeTypeOf("number");
      expect(await QuizResponse.countDocuments({ userId: user!._id, quizType: "homeReadiness" })).toBe(1);
      const profile = await Profile.findOne({ userId: user!._id });
      expect(profile?.preferredArea).toBe(testHomeReadinessAnswers.preferredArea);

      const withQuiz = await User.findById(user!._id).select("+registrationQuiz");
      expect(withQuiz?.get("registrationQuiz")).toBeNull();
    });

    it("creates a Google registration intent only for a completed quiz", async () => {
      const app = createApp();
      const missing = await request(app)
        .post("/api/auth/registration/google-intent")
        .send({ quizSessionToken: completedQuizSessionToken() });
      expect(missing.status).toBe(400);

      const res = await request(app)
        .post("/api/auth/registration/google-intent")
        .send({ homeReadiness: testHomeReadinessAnswers, quizSessionToken: completedQuizSessionToken() });
      expect(res.status).toBe(201);
      expect(res.body.data.intentToken).toBeTypeOf("string");
      const intent = await RegistrationIntent.findOne({});
      expect(intent?.tokenHash).not.toBe(res.body.data.intentToken);
    });
  });
});
