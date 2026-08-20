import type { AdminAccessDTO, UserDTO } from "@forth-urban/shared-types";
import type { UserDocument } from "./user.model.js";

/** Maps a Mongoose User document to the client-safe DTO (never leaks passwordHash). */
export function toUserDTO(user: UserDocument, options: { includeAdminAccess?: boolean } = {}): UserDTO {
  const adminAccess = user.get("adminAccess") as
    | {
        title: string;
        ownerId: { toString: () => string };
        permissions: Map<string, { read: boolean; write: boolean }> | Record<string, { read: boolean; write: boolean }>;
        grantedAt: Date;
        updatedAt: Date;
      }
    | null
    | undefined;

  const permissions = adminAccess?.permissions
    ? Object.fromEntries(
        adminAccess.permissions instanceof Map
          ? adminAccess.permissions.entries()
          : Object.entries(adminAccess.permissions),
      )
    : undefined;

  return {
    id: user._id.toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    authProvider: user.authProvider as UserDTO["authProvider"],
    emailVerified: user.emailVerified,
    whatsappNumber: user.whatsappNumber ?? null,
    currentCity: user.currentCity ?? null,
    currentCountry: user.currentCountry ?? null,
    isDiaspora: user.isDiaspora,
    role: user.role as UserDTO["role"],
    status: user.status as UserDTO["status"],
    adminAccess:
      options.includeAdminAccess === false || !adminAccess
        ? null
        : ({
            title: adminAccess.title,
            ownerId: adminAccess.ownerId.toString(),
            permissions: permissions as AdminAccessDTO["permissions"],
            grantedAt: adminAccess.grantedAt.toISOString(),
            updatedAt: adminAccess.updatedAt.toISOString(),
          } satisfies AdminAccessDTO),
    createdAt: (user.get("createdAt") as Date).toISOString(),
    updatedAt: (user.get("updatedAt") as Date).toISOString(),
  };
}
