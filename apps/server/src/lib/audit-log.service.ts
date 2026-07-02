import { AuditLog } from "../db/audit-log.model.js";
import { logger } from "../config/logger.js";

export interface RecordAuditLogInput {
  actorId?: string | null;
  actorType: "user" | "admin" | "system";
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
}

/**
 * Fire-and-forget audit log writer. Never throws — a logging failure must
 * not break the request it's auditing (errors are logged instead).
 */
export async function recordAuditLog(input: RecordAuditLogInput): Promise<void> {
  try {
    await AuditLog.create({
      actorId: input.actorId ?? null,
      actorType: input.actorType,
      action: input.action,
      targetType: input.targetType ?? null,
      targetId: input.targetId ?? null,
      metadata: input.metadata ?? {},
      ipAddress: input.ipAddress ?? null,
    });
  } catch (err) {
    logger.error({ err, action: input.action }, "Failed to write audit log");
  }
}
