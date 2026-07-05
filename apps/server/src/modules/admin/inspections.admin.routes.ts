import { Router } from "express";
import { adminUpdateInspectionSchema } from "@forth-urban/validation";
import type { AdminInspectionBookingDTO, InspectionBookingStatus, NextActionDTO, PaginatedResultDTO } from "@forth-urban/shared-types";
import { ApiError, type ApiEnvelope } from "../../middleware/error-handler.js";
import { validateBody } from "../../middleware/validate.js";
import { recordAuditLog } from "../../lib/audit-log.service.js";
import { selectNextBestAction } from "../decision-engine/index.js";
import { InspectionBooking, type InspectionBookingDocument } from "../inspections/inspection-booking.model.js";
import { User } from "../users/index.js";
import { Property } from "../properties/index.js";

/**
 * `GET/PATCH /api/admin/inspections` — Phase 7 admin inspection bookings
 * management (status changes, sales rep reassignment).
 */
export const inspectionsAdminRouter: Router = Router();

function parsePagination(query: Record<string, unknown>): { page: number; limit: number } {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  return { page, limit };
}

async function toAdminDTO(doc: InspectionBookingDocument): Promise<AdminInspectionBookingDTO> {
  const [user, property] = await Promise.all([
    User.findById(doc.userId),
    doc.propertyId ? Property.findById(doc.propertyId) : Promise.resolve(null),
  ]);
  const nextAction: NextActionDTO = selectNextBestAction("inspectionBooked");

  return {
    id: doc._id.toString(),
    propertyId: doc.propertyId?.toString() ?? null,
    recommendedArea: doc.recommendedArea ?? null,
    inspectionType: doc.inspectionType as "physical" | "virtual",
    preferredDate: doc.preferredDate.toISOString(),
    preferredTime: doc.preferredTime,
    mainConcern: doc.mainConcern,
    wantsDocsBeforeInspection: doc.wantsDocsBeforeInspection,
    status: doc.status as InspectionBookingStatus,
    checklist: doc.checklist,
    whatsappLink: doc.whatsappLink,
    nextAction,
    createdAt: (doc.get("createdAt") as Date).toISOString(),
    user: user
      ? { id: user._id.toString(), firstName: user.firstName, lastName: user.lastName, email: user.email }
      : { id: doc.userId!.toString(), firstName: "Unknown", lastName: "", email: "" },
    propertyName: property ? `${property.name} (${property.estateName})` : null,
  };
}

inspectionsAdminRouter.get("/", async (req, res, next) => {
  try {
    const { page, limit } = parsePagination(req.query as Record<string, unknown>);
    const filter: Record<string, unknown> = {};
    if (typeof req.query.status === "string" && req.query.status) filter.status = req.query.status;

    const [bookings, total] = await Promise.all([
      InspectionBooking.find(filter)
        .sort({ preferredDate: 1 })
        .skip((page - 1) * limit)
        .limit(limit),
      InspectionBooking.countDocuments(filter),
    ]);

    const items = await Promise.all(bookings.map(toAdminDTO));
    const data: PaginatedResultDTO<AdminInspectionBookingDTO> = { items, total, page, limit };
    const body: ApiEnvelope = { success: true, message: "OK", data, errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

inspectionsAdminRouter.patch("/:id", validateBody(adminUpdateInspectionSchema), async (req, res, next) => {
  try {
    const booking = await InspectionBooking.findById(req.params.id);
    if (!booking) throw new ApiError(404, "Inspection booking not found");

    if (req.body.status) booking.status = req.body.status;
    if ("assignedSalesRep" in req.body) {
      booking.set("assignedSalesRep", req.body.assignedSalesRep ?? null);
    }
    await booking.save();

    await recordAuditLog({
      actorId: req.auth!.sub,
      actorType: "admin",
      action: "admin.inspection.updated",
      targetType: "InspectionBooking",
      targetId: booking._id.toString(),
      metadata: { status: req.body.status, assignedSalesRep: req.body.assignedSalesRep },
    });

    const data = await toAdminDTO(booking);
    const body: ApiEnvelope = { success: true, message: "Inspection updated", data, errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});
