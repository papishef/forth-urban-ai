import type { AdminMenuPermissionsDTO, AdminUserDTO } from "@forth-urban/shared-types";
import { ApiError } from "../../middleware/error-handler.js";
import { recordAuditLog } from "../../lib/audit-log.service.js";
import { Session } from "../auth/session.model.js";
import { Profile } from "../users/profile.model.js";
import { toProfileDTO } from "../users/profile.mapper.js";
import { User, type UserDocument } from "../users/user.model.js";
import { toUserDTO } from "../users/user.mapper.js";
import { normalizeAdminPermissions } from "../auth/permissions.js";

interface AdminAccessRecord {
  title: string;
  ownerId: { toString: () => string };
  permissions: Map<string, { read: boolean; write: boolean }> | Record<string, { read: boolean; write: boolean }>;
  grantedAt: Date;
  updatedAt: Date;
}

function getAdminAccess(user: UserDocument): AdminAccessRecord | null {
  return (user.get("adminAccess") as AdminAccessRecord | null | undefined) ?? null;
}

function permissionRecord(access: AdminAccessRecord | null): AdminMenuPermissionsDTO {
  if (!access) return {};
  return access.permissions instanceof Map
    ? Object.fromEntries(access.permissions.entries())
    : { ...access.permissions };
}

function hasReadablePermission(permissions: AdminMenuPermissionsDTO): boolean {
  return Object.values(permissions).some((permission) => permission?.read || permission?.write);
}

function permissionDelta(before: AdminMenuPermissionsDTO, after: AdminMenuPermissionsDTO) {
  const added: string[] = [];
  const removed: string[] = [];
  const menus = new Set([...Object.keys(before), ...Object.keys(after)]);

  for (const menu of menus) {
    for (const level of ["read", "write"] as const) {
      const beforeValue = Boolean(before[menu as keyof AdminMenuPermissionsDTO]?.[level]);
      const afterValue = Boolean(after[menu as keyof AdminMenuPermissionsDTO]?.[level]);
      if (!beforeValue && afterValue) added.push(`${menu}:${level}`);
      if (beforeValue && !afterValue) removed.push(`${menu}:${level}`);
    }
  }

  return { added, removed };
}

async function toAdminUserDTO(user: UserDocument): Promise<AdminUserDTO> {
  const profile = await Profile.findOne({ userId: user._id });
  return { ...toUserDTO(user), profile: profile ? toProfileDTO(profile) : null };
}

async function revokeSessions(userId: string): Promise<void> {
  await Session.updateMany({ userId, revokedAt: null }, { revokedAt: new Date() });
}

export async function listSubAdmins(ownerId: string): Promise<AdminUserDTO[]> {
  const users = await User.find({ role: "user", "adminAccess.ownerId": ownerId }).sort({ updatedAt: -1 });
  return Promise.all(users.map(toAdminUserDTO));
}

export async function listEligibleSubAdminUsers(): Promise<AdminUserDTO[]> {
  const users = await User.find({ role: "user", status: "active", adminAccess: null }).sort({ createdAt: -1 });
  return Promise.all(users.map(toAdminUserDTO));
}

export async function createSubAdmin(
  ownerId: string,
  input: { userId: string; title: string; permissions: AdminMenuPermissionsDTO },
): Promise<AdminUserDTO> {
  if (input.userId === ownerId) throw new ApiError(400, "The owner cannot be converted into a sub-admin");

  const permissions = normalizeAdminPermissions(input.permissions);
  if (!hasReadablePermission(permissions)) throw new ApiError(400, "Grant at least one readable menu");

  const now = new Date();
  const user = await User.findOneAndUpdate(
    { _id: input.userId, role: "user", status: "active", adminAccess: null },
    {
      $set: {
        adminAccess: {
          title: input.title,
          ownerId,
          permissions,
          grantedAt: now,
          updatedAt: now,
        },
      },
    },
    { new: true, runValidators: true },
  );
  if (!user) {
    const existing = await User.findById(input.userId);
    if (!existing) throw new ApiError(404, "Eligible user not found");
    if (existing.status === "suspended") throw new ApiError(400, "Reactivate the user before granting sub-admin access");
    if (getAdminAccess(existing)) throw new ApiError(409, "This user already has sub-admin access");
    throw new ApiError(400, "User is not eligible for sub-admin access");
  }

  await recordAuditLog({
    actorId: ownerId,
    actorType: "admin",
    action: "admin.sub_admin.created",
    targetType: "User",
    targetId: user._id.toString(),
    metadata: { title: input.title, permissions },
  });

  return toAdminUserDTO(user);
}

export async function updateSubAdmin(
  ownerId: string,
  userId: string,
  input: { title?: string; permissions?: AdminMenuPermissionsDTO; status?: "active" | "suspended" },
): Promise<AdminUserDTO> {
  const user = await User.findOne({ _id: userId, role: "user", "adminAccess.ownerId": ownerId });
  if (!user) throw new ApiError(404, "Sub-admin not found");

  const access = getAdminAccess(user);
  if (!access) throw new ApiError(404, "Sub-admin not found");

  const beforePermissions = permissionRecord(access);
  const afterPermissions = input.permissions ? normalizeAdminPermissions(input.permissions) : beforePermissions;
  const noMenus = !hasReadablePermission(afterPermissions);

  if (input.status === "active" && noMenus) {
    throw new ApiError(400, "Grant at least one readable menu before reactivating this sub-admin");
  }

  const nextStatus = noMenus ? "suspended" : input.status ?? user.status;
  const nextTitle = input.title ?? access.title;
  user.set("adminAccess", {
    title: nextTitle,
    ownerId,
    permissions: afterPermissions,
    grantedAt: access.grantedAt,
    updatedAt: new Date(),
  });
  user.set("status", nextStatus);
  await user.save();

  if (nextStatus === "suspended") await revokeSessions(userId);

  const delta = permissionDelta(beforePermissions, afterPermissions);
  await recordAuditLog({
    actorId: ownerId,
    actorType: "admin",
    action: "admin.sub_admin.updated",
    targetType: "User",
    targetId: user._id.toString(),
    metadata: {
      title: nextTitle,
      status: nextStatus,
      permissionsDelta: delta,
    },
  });

  return toAdminUserDTO(user);
}

export async function removeSubAdmin(ownerId: string, userId: string): Promise<void> {
  const user = await User.findOne({ _id: userId, role: "user", "adminAccess.ownerId": ownerId });
  if (!user) throw new ApiError(404, "Sub-admin not found");

  user.set("adminAccess", null);
  user.set("status", "active");
  await user.save();
  await revokeSessions(userId);

  await recordAuditLog({
    actorId: ownerId,
    actorType: "admin",
    action: "admin.sub_admin.removed",
    targetType: "User",
    targetId: user._id.toString(),
  });
}