import { describe, expect, it } from "vitest";
import {
  signAccessToken,
  verifyAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  getTokenExpiry,
} from "./jwt.util.js";

describe("jwt.util", () => {
  it("round-trips an access token", () => {
    const token = signAccessToken({ sub: "user-1", role: "user", email: "a@b.com" });
    const payload = verifyAccessToken(token);
    expect(payload).toMatchObject({ sub: "user-1", role: "user", email: "a@b.com" });
  });

  it("round-trips a refresh token", () => {
    const token = signRefreshToken({ sub: "user-1", sessionId: "session-1" });
    const payload = verifyRefreshToken(token);
    expect(payload).toMatchObject({ sub: "user-1", sessionId: "session-1", type: "refresh" });
  });

  it("rejects a refresh token when verified as an access token", () => {
    const token = signRefreshToken({ sub: "user-1", sessionId: "session-1" });
    expect(() => verifyAccessToken(token)).toThrow();
  });

  it("computes a future expiry timestamp from a signed token", () => {
    const token = signAccessToken({ sub: "user-1", role: "user", email: "a@b.com" });
    const expiry = new Date(getTokenExpiry(token));
    expect(expiry.getTime()).toBeGreaterThan(Date.now());
  });
});
