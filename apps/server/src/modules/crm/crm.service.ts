import type { LeadCategory, PipelineStage } from "@forth-urban/shared-types";
import { CrmEvent } from "./crm-event.model.js";
import { getSalesAngle } from "./sales-angle.js";

interface RecordLeadEventInput {
  userId: string;
  eventType: string;
  pipelineStage: PipelineStage;
  payload?: Record<string, unknown>;
  tags?: string[];
}

/**
 * Appends one CRM pipeline event for a lead (PRODUCT_SPEC §15). A user's
 * current stage is simply the `pipelineStage` on their latest event.
 */
export async function recordLeadEvent(input: RecordLeadEventInput): Promise<void> {
  await CrmEvent.create({
    userId: input.userId,
    eventType: input.eventType,
    pipelineStage: input.pipelineStage,
    payload: input.payload ?? {},
    tags: input.tags ?? [],
  });
}

/**
 * Convenience wrapper used when a lead's readiness/persona is known —
 * attaches the deterministic recommended sales angle (PRODUCT_SPEC §15
 * sample templates) to the event payload for a future sales rep to read.
 */
export async function recordLeadEventWithSalesAngle(
  input: RecordLeadEventInput & { leadCategory: LeadCategory; firstName: string },
): Promise<void> {
  await recordLeadEvent({
    ...input,
    payload: { ...(input.payload ?? {}), salesAngle: getSalesAngle(input.leadCategory, input.firstName) },
  });
}

/** Reads a user's current pipeline stage (from their latest CRM event), or null if none exists yet. */
export async function getCurrentPipelineStage(userId: string): Promise<PipelineStage | null> {
  const latest = await CrmEvent.findOne({ userId }).sort({ createdAt: -1 });
  return (latest?.pipelineStage as PipelineStage | undefined) ?? null;
}
