import { AuditLog } from "../db/audit-log.model.js";
import { logger } from "../config/logger.js";
import { analyticsEventsForAuditAction, trackEvent } from "./analytics.js";

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
 *
 * Also forwards funnel-relevant actions to PostHog (Phase 8 —
 * docs/ARCHITECTURE.md §7) via lib/analytics.ts, so every call site gets
 * analytics tracking for free without needing its own trackEvent() call.
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
    return;
  }

  if (input.actorType === "user" && input.actorId) {
    for (const event of analyticsEventsForAuditAction(input.action, input.metadata)) {
      trackEvent(input.actorId, event, { action: input.action, ...input.metadata });
    }
  }
}
