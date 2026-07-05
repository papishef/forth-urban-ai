import { Router } from "express";
import { adminUpdateCrmEventSchema } from "@forth-urban/validation";
import type { AdminCrmEventDTO, PipelineStage } from "@forth-urban/shared-types";
import type { ApiEnvelope } from "../../middleware/error-handler.js";
import { validateBody } from "../../middleware/validate.js";
import { recordAuditLog } from "../../lib/audit-log.service.js";
import { CrmEvent, type CrmEventDocument } from "../crm/index.js";
import { User } from "../users/index.js";

/**
 * `GET/PATCH /api/admin/crm` — Phase 7 lightweight CRM board
 * (docs/ARCHITECTURE.md#5-database-schema-mongodb-atlas: `crmEvents` is an
 * append-only event log, so "updating" a lead's pipeline stage/notes/tags
 * appends a new event rather than mutating history — a user's *current*
 * state is simply their latest event, exactly as `crm.service.ts` already
 * does for the non-admin write path).
 */
export const crmAdminRouter: Router = Router();

async function toAdminCrmEventDTO(doc: CrmEventDocument): Promise<AdminCrmEventDTO> {
  const user = await User.findById(doc.userId);
  return {
    id: doc._id.toString(),
    userId: doc.userId!.toString(),
    user: user ? { id: user._id.toString(), firstName: user.firstName, lastName: user.lastName, email: user.email } : null,
    eventType: doc.eventType,
    pipelineStage: doc.pipelineStage as PipelineStage,
    payload: (doc.payload ?? {}) as Record<string, unknown>,
    notes: doc.notes,
    tags: doc.tags,
    salesRepId: doc.salesRepId?.toString() ?? null,
    createdAt: (doc.get("createdAt") as Date).toISOString(),
  };
}

/** Board view: each lead's single latest CRM event (their current pipeline state). */
crmAdminRouter.get("/", async (req, res, next) => {
  try {
    const latestPerUser = await CrmEvent.aggregate([
      { $sort: { userId: 1, createdAt: -1 } },
      { $group: { _id: "$userId", latest: { $first: "$$ROOT" } } },
      { $replaceRoot: { newRoot: "$latest" } },
      { $sort: { createdAt: -1 } },
    ]);

    const stageFilter = typeof req.query.pipelineStage === "string" ? req.query.pipelineStage : null;
    const filtered = stageFilter
      ? latestPerUser.filter((event) => event.pipelineStage === stageFilter)
      : latestPerUser;

    const docs = filtered.map((event) => CrmEvent.hydrate(event));
    const items = await Promise.all(docs.map(toAdminCrmEventDTO));

    const body: ApiEnvelope = { success: true, message: "OK", data: items, errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

crmAdminRouter.patch("/:userId", validateBody(adminUpdateCrmEventSchema), async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const latest = await CrmEvent.findOne({ userId }).sort({ createdAt: -1 });

    const nextNotes = latest ? [...latest.notes] : [];
    if (req.body.addNote) nextNotes.push(req.body.addNote as string);

    const created = await CrmEvent.create({
      userId,
      eventType: "admin.updated",
      pipelineStage: req.body.pipelineStage ?? latest?.pipelineStage ?? "new",
      payload: latest?.payload ?? {},
      notes: nextNotes,
      tags: req.body.tags ?? latest?.tags ?? [],
      salesRepId: "salesRepId" in req.body ? req.body.salesRepId : (latest?.salesRepId ?? null),
    });

    await recordAuditLog({
      actorId: req.auth!.sub,
      actorType: "admin",
      action: "admin.crm.updated",
      targetType: "CrmEvent",
      targetId: created._id.toString(),
      metadata: { userId, pipelineStage: created.pipelineStage },
    });

    const data = await toAdminCrmEventDTO(created);
    const body: ApiEnvelope = { success: true, message: "Lead updated", data, errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});
