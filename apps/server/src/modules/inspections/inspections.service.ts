import type { InspectionBookingInput } from "@forth-urban/validation";
import type { InspectionBookingDTO, InspectionBookingStatus, LeadCategory } from "@forth-urban/shared-types";
import { env } from "../../config/env.js";
import { ApiError } from "../../middleware/error-handler.js";
import { recordAuditLog } from "../../lib/audit-log.service.js";
import { getInspectionChecklist, selectNextBestAction } from "../decision-engine/index.js";
import { Property } from "../properties/property.model.js";
import { User } from "../users/user.model.js";
import { Profile } from "../users/profile.model.js";
import { buildWhatsAppLink, createNotification, sendTrackedEmail } from "../notifications/index.js";
import { recordLeadEvent, recordLeadEventWithSalesAngle } from "../crm/index.js";
import { InspectionBooking, type InspectionBookingDocument } from "./inspection-booking.model.js";

function toInspectionBookingDTO(doc: InspectionBookingDocument): InspectionBookingDTO {
  const nextAction = selectNextBestAction("inspectionBooked");
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
  };
}

function bookingConfirmationEmailHtml(firstName: string, subject: string): string {
  return `<p>Hi ${firstName},</p><p>${subject} Our team will reach out to confirm details before your visit.</p><p>— Forth Urban</p>`;
}

/**
 * Books a site inspection (PRODUCT_SPEC §11 — the sole conversion event) and
 * fans out every side effect the exit criteria requires: persists the
 * booking with its auto-generated checklist, sends a confirmation email,
 * generates a wa.me link, records a CRM pipeline entry, and notifies sales.
 */
export async function bookInspection(userId: string, input: InspectionBookingInput): Promise<InspectionBookingDTO> {
  let propertySummary = input.recommendedArea ?? "your preferred area";

  if (input.propertyId) {
    const property = await Property.findById(input.propertyId);
    if (!property) throw new ApiError(404, "Property not found");
    propertySummary = `${property.name} (${property.estateName})`;
  }

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  if (input.whatsappNumber && !user.whatsappNumber) {
    user.whatsappNumber = input.whatsappNumber;
    await user.save();
  }

  const checklist = getInspectionChecklist();
  const whatsappMessage = `Hi Forth Urban, I just booked a ${input.inspectionType} inspection for ${propertySummary} on ${input.preferredDate} at ${input.preferredTime}. My main concern is ${input.mainConcern}.`;
  const whatsappLink = buildWhatsAppLink(whatsappMessage);

  const booking = await InspectionBooking.create({
    userId,
    propertyId: input.propertyId ?? null,
    recommendedArea: input.recommendedArea ?? null,
    inspectionType: input.inspectionType,
    preferredDate: new Date(input.preferredDate),
    preferredTime: input.preferredTime,
    mainConcern: input.mainConcern,
    wantsDocsBeforeInspection: input.wantsDocsBeforeInspection,
    checklist: [...checklist],
    whatsappLink,
  });

  await sendTrackedEmail({
    userId,
    campaign: "inspection-booking-confirmation",
    template: "inspection-booking-confirmation",
    to: user.email,
    subject: `Your ${input.inspectionType} inspection request is received`,
    html: bookingConfirmationEmailHtml(
      user.firstName,
      `Your ${input.inspectionType} inspection for ${propertySummary} on ${input.preferredDate} at ${input.preferredTime} has been received.`,
    ),
  });

  await createNotification(
    userId,
    "browser",
    "Inspection booking received",
    `Your ${input.inspectionType} inspection request for ${propertySummary} is confirmed pending sales follow-up.`,
  );

  const profile = await Profile.findOne({ userId });
  if (profile?.leadCategory) {
    await recordLeadEventWithSalesAngle({
      userId,
      eventType: "inspection.booked",
      pipelineStage: "inspectionScheduled",
      payload: {
        bookingId: booking._id.toString(),
        propertyId: input.propertyId ?? null,
        recommendedArea: input.recommendedArea ?? null,
        inspectionType: input.inspectionType,
        preferredDate: input.preferredDate,
        preferredTime: input.preferredTime,
        mainConcern: input.mainConcern,
      },
      leadCategory: profile.leadCategory as LeadCategory,
      firstName: user.firstName,
    });
  } else {
    await recordLeadEvent({
      userId,
      eventType: "inspection.booked",
      pipelineStage: "inspectionScheduled",
      payload: { bookingId: booking._id.toString() },
    });
  }

  // Notify sales — a real sales-user directory/admin queue is Phase 7; for
  // now the confirmation goes to the shared sales inbox by email.
  await sendTrackedEmail({
    userId,
    campaign: "sales-inspection-alert",
    template: "sales-inspection-alert",
    to: env.SALES_NOTIFICATION_EMAIL,
    subject: `New inspection booking: ${user.firstName} ${user.lastName}`,
    html: `<p>${user.firstName} ${user.lastName} (${user.email}) booked a ${input.inspectionType} inspection for ${propertySummary} on ${input.preferredDate} at ${input.preferredTime}.</p><p>Main concern: ${input.mainConcern}.</p>`,
  });

  await recordAuditLog({
    actorId: userId,
    actorType: "user",
    action: "inspection.booked",
    targetType: "InspectionBooking",
    targetId: booking._id.toString(),
    metadata: { inspectionType: input.inspectionType },
  });

  return toInspectionBookingDTO(booking);
}

/** Lists the user's own inspection bookings, most recent first. */
export async function listMyInspections(userId: string): Promise<InspectionBookingDTO[]> {
  const bookings = await InspectionBooking.find({ userId }).sort({ createdAt: -1 });
  return bookings.map(toInspectionBookingDTO);
}
