import { createApp } from "../../app.js";
import { User } from "../users/user.model.js";
import { signAccessToken } from "../auth/jwt.util.js";
import type { AdminMenuPermissionsDTO } from "@forth-urban/shared-types";
import { registerVerifiedUser } from "../../test/auth-helpers.js";

/** Shared helpers reused by every admin route test file. */

export async function registerUser(
  app: ReturnType<typeof createApp>,
  overrides: Partial<{ firstName: string; lastName: string; email: string; password: string }> = {},
) {
  const registered = await registerVerifiedUser(app, overrides);
  return {
    token: registered.token,
    userId: registered.userId,
  };
}
/** Registers a regular user, then promotes them to `role: "admin"` and mints a matching access token. */
export async function registerAdmin(app: ReturnType<typeof createApp>) {
  const { userId } = await registerUser(app, {
    email: `admin-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
  });
  const user = await User.findByIdAndUpdate(userId, { role: "admin" }, { new: true });
  const token = signAccessToken({ sub: userId, role: "admin", email: user!.email });
  return { token, userId };
}

export async function registerSubAdmin(
  app: ReturnType<typeof createApp>,
  permissions: AdminMenuPermissionsDTO = { inspections: { read: true, write: true } },
) {
  const owner = await registerAdmin(app);
  const user = await registerUser(app, {
    email: `sub-admin-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
  });
  await User.findByIdAndUpdate(user.userId, {
    adminAccess: {
      title: "Operations Coordinator",
      ownerId: owner.userId,
      permissions,
      grantedAt: new Date(),
      updatedAt: new Date(),
    },
  });
  return { token: user.token, userId: user.userId, ownerId: owner.userId };
}
