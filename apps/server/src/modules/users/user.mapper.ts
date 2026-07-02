import type { UserDTO } from "@forth-urban/shared-types";
import type { UserDocument } from "./user.model.js";

/** Maps a Mongoose User document to the client-safe DTO (never leaks passwordHash). */
export function toUserDTO(user: UserDocument): UserDTO {
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
    createdAt: (user.get("createdAt") as Date).toISOString(),
    updatedAt: (user.get("updatedAt") as Date).toISOString(),
  };
}
