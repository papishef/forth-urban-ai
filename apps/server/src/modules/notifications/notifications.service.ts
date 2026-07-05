import type { NotificationDTO, NotificationType } from "@forth-urban/shared-types";
import { logger } from "../../config/logger.js";
import { ApiError } from "../../middleware/error-handler.js";
import { sendEmail } from "../../lib/email.service.js";
import { Notification, type NotificationDocument } from "./notification.model.js";
import { EmailEvent } from "./email-event.model.js";

function toNotificationDTO(doc: NotificationDocument): NotificationDTO {
  return {
    id: doc._id.toString(),
    type: doc.type as NotificationType,
    title: doc.title,
    body: doc.body,
    read: doc.read,
    createdAt: (doc.get("createdAt") as Date).toISOString(),
  };
}

/** Creates an in-app notification-feed entry for a user (PRODUCT_SPEC §16). */
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
): Promise<NotificationDTO> {
  const doc = await Notification.create({ userId, type, title, body });
  return toNotificationDTO(doc);
}

export async function listNotifications(userId: string): Promise<NotificationDTO[]> {
  const docs = await Notification.find({ userId }).sort({ createdAt: -1 }).limit(50);
  return docs.map(toNotificationDTO);
}

export async function markNotificationRead(userId: string, notificationId: string): Promise<NotificationDTO> {
  const doc = await Notification.findOne({ _id: notificationId, userId });
  if (!doc) throw new ApiError(404, "Notification not found");
  doc.read = true;
  await doc.save();
  return toNotificationDTO(doc);
}

interface SendTrackedEmailInput {
  userId: string;
  campaign: string;
  template: string;
  to: string;
  subject: string;
  html: string;
}

/**
 * Sends an email via Resend and records the attempt in `emailEvents`
 * (docs/PRODUCT_SPEC.md#14-lead-capture--email-marketing). Never throws —
 * a delivery failure is logged and recorded as "bounced" instead of blocking
 * the caller's request (e.g. an inspection booking must still succeed even
 * if the confirmation email fails to send).
 */
export async function sendTrackedEmail(input: SendTrackedEmailInput): Promise<void> {
  try {
    await sendEmail({ to: input.to, subject: input.subject, html: input.html });
    await EmailEvent.create({
      userId: input.userId,
      campaign: input.campaign,
      template: input.template,
      status: "sent",
    });
  } catch (err) {
    logger.error({ err, campaign: input.campaign, userId: input.userId }, "Failed to send tracked email");
    await EmailEvent.create({
      userId: input.userId,
      campaign: input.campaign,
      template: input.template,
      status: "bounced",
    });
  }
}
