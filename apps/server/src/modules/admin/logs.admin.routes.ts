import { Router } from "express";
import type { HydratedDocument } from "mongoose";
import type { AdminAuditLogDTO, PaginatedResultDTO } from "@forth-urban/shared-types";
import type { ApiEnvelope } from "../../middleware/error-handler.js";
import { AuditLog, type AuditLogDocument } from "../../db/audit-log.model.js";

/**
 * `GET /api/admin/logs` — Phase 7 system/audit logs viewer.
 */
export const logsAdminRouter: Router = Router();

function parsePagination(query: Record<string, unknown>): { page: number; limit: number } {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(200, Math.max(1, Number(query.limit) || 50));
  return { page, limit };
}

function toAdminAuditLogDTO(doc: HydratedDocument<AuditLogDocument>): AdminAuditLogDTO {
  return {
    id: doc._id.toString(),
    actorId: doc.actorId ? doc.actorId.toString() : null,
    actorType: doc.actorType as AdminAuditLogDTO["actorType"],
    action: doc.action,
    targetType: doc.targetType ?? null,
    targetId: doc.targetId ? doc.targetId.toString() : null,
    metadata: (doc.metadata ?? {}) as Record<string, unknown>,
    ipAddress: doc.ipAddress ?? null,
    createdAt: (doc.get("createdAt") as Date).toISOString(),
  };
}

logsAdminRouter.get("/", async (req, res, next) => {
  try {
    const { page, limit } = parsePagination(req.query as Record<string, unknown>);
    const filter: Record<string, unknown> = {};
    if (typeof req.query.action === "string" && req.query.action) filter.action = req.query.action;
    if (typeof req.query.actorType === "string" && req.query.actorType) filter.actorType = req.query.actorType;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      AuditLog.countDocuments(filter),
    ]);

    const data: PaginatedResultDTO<AdminAuditLogDTO> = {
      items: logs.map(toAdminAuditLogDTO),
      total,
      page,
      limit,
    };
    const body: ApiEnvelope = { success: true, message: "OK", data, errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});
