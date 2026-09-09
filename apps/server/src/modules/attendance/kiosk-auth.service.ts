import type { KioskLoginInput } from "@forth-urban/validation";
import type { KioskSessionDTO } from "@forth-urban/shared-types";
import { ApiError } from "../../middleware/error-handler.js";
import { compareSecret } from "../../lib/crypto.util.js";
import { recordAuditLog } from "../../lib/audit-log.service.js";
import { User } from "../users/user.model.js";
import { getSettingsDocument } from "../settings/index.js";
import { canAccessAdminMenu } from "../auth/permissions.js";
import { getTokenExpiry, signKioskToken } from "../auth/jwt.util.js";

interface KioskLoginMeta {
  ip: string | null;
  userAgent: string | null;
  deviceId: string | null;
}

export async function loginKiosk(input: KioskLoginInput, meta: KioskLoginMeta): Promise<KioskSessionDTO> {
  const [user, settings] = await Promise.all([
    User.findOne({ email: input.email }).select("+passwordHash"),
    getSettingsDocument(),
  ]);
  const kioskPasswordHash = settings.get("kioskPasswordHash") as string | null | undefined;

  if (!kioskPasswordHash) {
    throw new ApiError(503, "Kiosk access has not been configured by the owner admin");
  }

  const passwordMatches = await compareSecret(input.password, kioskPasswordHash);
  const canUseKiosk = Boolean(
    user &&
      user.status === "active" &&
      user.emailVerified &&
      (user.role === "admin" || canAccessAdminMenu(user, "kiosk")),
  );
  if (!passwordMatches || !canUseKiosk || !user) {
    throw new ApiError(401, "Invalid kiosk email or password");
  }

  const token = signKioskToken(
    { sub: user._id.toString(), role: user.role as "user" | "admin", email: user.email },
    input.durationHours,
  );

  await recordAuditLog({
    actorId: user._id.toString(),
    actorType: "admin",
    action: "attendance.kiosk.login",
    targetType: "User",
    targetId: user._id.toString(),
    ipAddress: meta.ip,
    metadata: { durationHours: input.durationHours, deviceId: meta.deviceId, userAgent: meta.userAgent },
  });

  return {
    token,
    expiresAt: getTokenExpiry(token),
    user: {
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    },
  };
}