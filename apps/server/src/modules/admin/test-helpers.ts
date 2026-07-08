import request from "supertest";
import { createApp } from "../../app.js";
import { User } from "../users/user.model.js";
import { signAccessToken } from "../auth/jwt.util.js";

/** Shared helpers reused by every admin route test file. */

export async function registerUser(
  app: ReturnType<typeof createApp>,
  overrides: Partial<{ firstName: string; lastName: string; email: string; password: string }> = {},
) {
  const res = await request(app)
    .post("/api/auth/register")
    .send({
      firstName: overrides.firstName ?? "Ada",
      lastName: overrides.lastName ?? "Lovelace",
      email: overrides.email ?? `user-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
      password: overrides.password ?? "supersecret123",
    });
  return {
    token: res.body.data.tokens.accessToken as string,
    userId: res.body.data.user.id as string,
  };
}

/** Registers a regular user, then promotes them to `role: "admin"` and mints a matching access token. */
export async function registerAdmin(app: ReturnType<typeof createApp>) {
  const { userId } = await registerUser(app, { email: `admin-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com` });
  const user = await User.findByIdAndUpdate(userId, { role: "admin" }, { new: true });
  const token = signAccessToken({ sub: userId, role: "admin", email: user!.email });
  return { token, userId };
}

/** Registers a regular user, then promotes them to `role: "sales"` and mints a matching access token. */
export async function registerSales(app: ReturnType<typeof createApp>) {
  const { userId } = await registerUser(app, { email: `sales-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com` });
  const user = await User.findByIdAndUpdate(userId, { role: "sales" }, { new: true });
  const token = signAccessToken({ sub: userId, role: "sales", email: user!.email });
  return { token, userId };
}
