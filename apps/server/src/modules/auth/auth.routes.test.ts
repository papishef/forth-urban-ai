import { describe, expect, it, vi, beforeEach } from "vitest";
import request from "supertest";

const emailCalls: Array<{ code?: string; resetUrl?: string }> = [];

vi.mock("../../lib/email.service.js", () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
  otpEmailHtml: (code: string) => {
    emailCalls.push({ code });
    return `<p>${code}</p>`;
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

describe("auth routes", () => {
  beforeEach(() => {
    emailCalls.length = 0;
  });

  it("registers a new user and issues tokens + cookies", async () => {
    const app = createApp();
    const res = await request(app).post("/api/auth/register").send({
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      password: "supersecret123",
    });

    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe("ada@example.com");
    expect(res.body.data.tokens.accessToken).toBeTypeOf("string");
    expect(extractCookie(res, "refreshToken")).toBeDefined();
    expect(extractCookie(res, "csrfToken")).toBeDefined();
  });

  it("rejects duplicate registration", async () => {
    const app = createApp();
    await request(app).post("/api/auth/register").send({
      firstName: "Ada",
      lastName: "Lovelace",
      email: "dup@example.com",
      password: "supersecret123",
    });
    const res = await request(app).post("/api/auth/register").send({
      firstName: "Ada",
      lastName: "Lovelace",
      email: "dup@example.com",
      password: "supersecret123",
    });
    expect(res.status).toBe(409);
  });

  it("logs in with correct credentials and rejects wrong password", async () => {
    const app = createApp();
    await request(app).post("/api/auth/register").send({
      firstName: "Grace",
      lastName: "Hopper",
      email: "grace@example.com",
      password: "supersecret123",
    });

    const badLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "grace@example.com", password: "wrongpassword" });
    expect(badLogin.status).toBe(401);

    const goodLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "grace@example.com", password: "supersecret123" });
    expect(goodLogin.status).toBe(200);
    expect(goodLogin.body.data.user.email).toBe("grace@example.com");
  });

  it("verifies the caller's own password, rejecting a wrong one and requiring auth", async () => {
    const app = createApp();
    await request(app).post("/api/auth/register").send({
      firstName: "Alan",
      lastName: "Turing",
      email: "alan@example.com",
      password: "supersecret123",
    });
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "alan@example.com", password: "supersecret123" });
    const token = login.body.data.tokens.accessToken as string;

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
  });

  it("supports OTP request + verify as a login/verification path", async () => {
    const app = createApp();
    await request(app).post("/api/auth/otp/request").send({ email: "otp@example.com" });
    expect(emailCalls[0]?.code).toMatch(/^\d{6}$/);

    const verifyRes = await request(app)
      .post("/api/auth/otp/verify")
      .send({ email: "otp@example.com", code: emailCalls[0]!.code });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.user.email).toBe("otp@example.com");
    expect(verifyRes.body.data.user.emailVerified).toBe(true);
  });

  it("rejects an incorrect OTP code", async () => {
    const app = createApp();
    await request(app).post("/api/auth/otp/request").send({ email: "otpwrong@example.com" });

    const res = await request(app)
      .post("/api/auth/otp/verify")
      .send({ email: "otpwrong@example.com", code: "000000" });

    expect(res.status).toBe(400);
  });

  it("refreshes and logs out using the CSRF-protected cookie flow", async () => {
    const app = createApp();
    const agent = request.agent(app);

    const registerRes = await agent.post("/api/auth/register").send({
      firstName: "Alan",
      lastName: "Turing",
      email: "alan@example.com",
      password: "supersecret123",
    });
    const csrfToken = extractCookie(registerRes, "csrfToken")!;

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
    await agent.post("/api/auth/register").send({
      firstName: "Margaret",
      lastName: "Hamilton",
      email: "margaret@example.com",
      password: "supersecret123",
    });

    const res = await agent.post("/api/auth/refresh").set("x-csrf-token", "not-the-real-token");
    expect(res.status).toBe(403);
  });

  it("completes the forgot/reset password flow and invalidates old sessions", async () => {
    const app = createApp();
    await request(app).post("/api/auth/register").send({
      firstName: "Katherine",
      lastName: "Johnson",
      email: "katherine@example.com",
      password: "originalpass1",
    });

    await request(app).post("/api/auth/password/forgot").send({ email: "katherine@example.com" });
    const resetUrl = emailCalls[0]?.resetUrl;
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
});
