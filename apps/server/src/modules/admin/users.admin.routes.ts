import { Router } from "express";
import { adminUpdateUserSchema } from "@forth-urban/validation";
import type { AdminUserDTO, PaginatedResultDTO } from "@forth-urban/shared-types";
import { ApiError, type ApiEnvelope } from "../../middleware/error-handler.js";
import { validateBody } from "../../middleware/validate.js";
import { recordAuditLog } from "../../lib/audit-log.service.js";
import { requireOwnerAdmin } from "../auth/permissions.js";
import { Session } from "../auth/session.model.js";
import { User, Profile, toUserDTO, toProfileDTO } from "../users/index.js";

/**
 * `GET/PATCH /api/admin/users` — Phase 7 admin users list/detail
 * (docs/IMPLEMENTATION_PLAN.md#phase-7--admin-dashboard). Mounted under
 * `adminRouter`, which applies the Users read grant; status changes remain
 * owner-only.
 */
export const usersAdminRouter: Router = Router();

function parsePagination(query: Record<string, unknown>): { page: number; limit: number } {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  return { page, limit };
}

usersAdminRouter.get("/", async (req, res, next) => {
  try {
    const { page, limit } = parsePagination(req.query as Record<string, unknown>);
    const filter: Record<string, unknown> = {};
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    if (search) {
      const pattern = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ firstName: pattern }, { lastName: pattern }, { email: pattern }];
    }
    if (typeof req.query.role === "string" && req.query.role) filter.role = req.query.role;
    if (typeof req.query.status === "string" && req.query.status) filter.status = req.query.status;

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    const profiles = await Profile.find({ userId: { $in: users.map((u) => u._id) } });
    const profileByUserId = new Map(profiles.map((p) => [p.userId!.toString(), p]));

    const items: AdminUserDTO[] = users.map((user) => ({
      ...toUserDTO(user, { includeAdminAccess: false }),
      profile: (() => {
        const profile = profileByUserId.get(user._id.toString());
        return profile ? toProfileDTO(profile) : null;
      })(),
    }));

    const data: PaginatedResultDTO<AdminUserDTO> = { items, total, page, limit };
    const body: ApiEnvelope = { success: true, message: "OK", data, errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

usersAdminRouter.get("/:id", async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw new ApiError(404, "User not found");
    const profile = await Profile.findOne({ userId: user._id });

    const data: AdminUserDTO = {
      ...toUserDTO(user, { includeAdminAccess: false }),
      profile: profile ? toProfileDTO(profile) : null,
    };
    const body: ApiEnvelope = { success: true, message: "OK", data, errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

usersAdminRouter.patch("/:id", requireOwnerAdmin(), validateBody(adminUpdateUserSchema), async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw new ApiError(404, "User not found");

    if (req.params.id === req.auth!.sub && req.body.status === "suspended") {
      throw new ApiError(400, "The owner admin cannot suspend their own account");
    }
    if (req.body.status) user.status = req.body.status;
    await user.save();
    if (req.body.status === "suspended") {
      await Session.updateMany({ userId: user._id, revokedAt: null }, { revokedAt: new Date() });
    }

    await recordAuditLog({
      actorId: req.auth!.sub,
      actorType: "admin",
      action: "admin.user.updated",
      targetType: "User",
      targetId: user._id.toString(),
      metadata: { status: req.body.status },
    });

    const profile = await Profile.findOne({ userId: user._id });
    const data: AdminUserDTO = {
      ...toUserDTO(user, { includeAdminAccess: false }),
      profile: profile ? toProfileDTO(profile) : null,
    };
    const body: ApiEnvelope = { success: true, message: "User updated", data, errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});
