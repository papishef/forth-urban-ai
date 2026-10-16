import type { AdminMenuKey, AdminMenuPermissionDTO, AdminMenuPermissionsDTO } from "@forth-urban/shared-types";
import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../../middleware/error-handler.js";

const READ_ONLY_MENU_KEYS = new Set<AdminMenuKey>(["users", "newsletter", "email-campaigns", "analytics", "logs"]);

export function normalizeAdminPermissions(input: AdminMenuPermissionsDTO): AdminMenuPermissionsDTO {
  const normalized: AdminMenuPermissionsDTO = {};

  for (const [menu, value] of Object.entries(input)) {
    if (!value) continue;
    const key = menu as AdminMenuKey;
    const write = !READ_ONLY_MENU_KEYS.has(key) && value.write === true;
    normalized[key] = { read: value.read === true || write, write };
  }

  return normalized;
}

function getPermission(user: NonNullable<Request["authUser"]>, menu: AdminMenuKey): AdminMenuPermissionDTO | null {
  const access = user.get("adminAccess") as
    | { permissions?: Map<string, AdminMenuPermissionDTO> | Record<string, AdminMenuPermissionDTO> }
    | null
    | undefined;
  if (!access?.permissions) return null;
  return access.permissions instanceof Map ? access.permissions.get(menu) ?? null : access.permissions[menu] ?? null;
}

export function canAccessAdminMenu(
  user: NonNullable<Request["authUser"]>,
  menu: AdminMenuKey,
  level: "read" | "write" = "read",
): boolean {
  if (user.role === "admin") return true;
  const permission = getPermission(user, menu);
  return Boolean(permission?.read && (level === "read" || permission.write));
}

export function requireOwnerAdmin() {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.authUser || req.authUser.role !== "admin") {
      next(new ApiError(403, "Owner admin access required"));
      return;
    }
    next();
  };
}

export function requireAdminPermission(menu: AdminMenuKey, level: "read" | "write" = "read") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.authUser) {
      next(new ApiError(401, "Authentication required"));
      return;
    }
    if (!canAccessAdminMenu(req.authUser, menu, level)) {
      next(new ApiError(403, `Requires ${level} access to ${menu}`));
      return;
    }
    next();
  };
}