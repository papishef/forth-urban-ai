/**
 * Notifications module — Phase 6.
 *
 * Owns: tracked Resend email sending (`emailEvents`), wa.me click-to-chat
 * link generation (no Meta Cloud API), the in-app `notifications` feed, and
 * the quiz-abandonment / segment-nurture email logic.
 */
export { notificationsRouter } from "./notifications.routes.js";
export { createNotification, listNotifications, markNotificationRead, sendTrackedEmail } from "./notifications.service.js";
export { buildWhatsAppLink } from "./whatsapp.util.js";
export { sendAbandonedQuizReminders, findAbandonedQuizUserIds, sendSegmentNurtureEmail, getLeadCategory } from "./nurture.js";
export { EmailEvent, type EmailEventDocument } from "./email-event.model.js";
