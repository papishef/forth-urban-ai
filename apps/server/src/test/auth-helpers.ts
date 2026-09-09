import request from "supertest";
import { createApp } from "../app.js";
import { signAccessToken } from "../modules/auth/jwt.util.js";
import { User } from "../modules/users/user.model.js";

interface RegistrationOverrides {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
}

export async function registerVerifiedUser(
  app: ReturnType<typeof createApp>,
  overrides: RegistrationOverrides = {},
): Promise<{ token: string; userId: string; email: string }> {
  const email = overrides.email ?? `user-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  const password = overrides.password ?? "supersecret123";
  const registration = await request(app)
    .post("/api/auth/register")
    .send({
      firstName: overrides.firstName ?? "Ada",
      lastName: overrides.lastName ?? "Lovelace",
      email,
      password,
    });

  if (registration.status !== 201) {
    throw new Error(`Test registration failed with status ${registration.status}`);
  }

  const user = await User.findOneAndUpdate({ email }, { emailVerified: true }, { new: true });
  if (!user) throw new Error("Test registration did not create a user");

  return {
    token: signAccessToken({ sub: user._id.toString(), role: user.role as "user" | "admin", email: user.email }),
    userId: user._id.toString(),
    email: user.email,
  };
}
