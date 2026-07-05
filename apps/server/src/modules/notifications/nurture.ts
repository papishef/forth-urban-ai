import type { LeadCategory } from "@forth-urban/shared-types";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { recordAuditLog } from "../../lib/audit-log.service.js";
import { AuditLog } from "../../db/audit-log.model.js";
import { selectNextBestAction } from "../decision-engine/index.js";
import { User } from "../users/user.model.js";
import { Profile } from "../users/profile.model.js";
import { EmailEvent } from "./email-event.model.js";
import { createNotification, sendTrackedEmail } from "./notifications.service.js";

/**
 * Segment-based nurture email copy — docs/PRODUCT_SPEC.md#14-lead-capture--email-marketing.
 * `LeadCategory` already matches the six segments from the spec 1:1
 * (diaspora/investor/budgetStarter/hot/warm/research), so it's reused
 * directly rather than introducing a parallel enum.
 */
const SEGMENT_EMAIL_TEMPLATES: Record<LeadCategory, { subject: string; body: string }> = {
  hot: {
    subject: "Your matched Abuja plots are ready",
    body: "Your result shows you are ready to compare available plots. We've prepared options that match your budget and preferred area. Would you prefer a physical or virtual inspection?",
  },
  warm: {
    subject: "You're close to being ready",
    body: "Your result shows you're close to being ready. The main thing to clarify is your budget and payment structure — here is a breakdown that may fit you.",
  },
  research: {
    subject: "Your Abuja land-buying roadmap",
    body: "Here is a simple roadmap for buying land in Abuja, plus how to avoid common documentation and scam pitfalls, so you can move forward with confidence whenever you're ready.",
  },
  diaspora: {
    subject: "Buying land in Abuja from abroad",
    body: "Your result shows you want to build something in Abuja from abroad. We can guide you with property details, document explanation, and a virtual inspection before you make any decision.",
  },
  budgetStarter: {
    subject: "Affordable ways to start owning land in Abuja",
    body: "Here are installment payment paths and affordable areas that fit a starter budget, so you can begin building equity without waiting to save the full price.",
  },
  investor: {
    subject: "Area growth & ROI outlook for investors",
    body: "Here is an educational look at area growth potential and ROI scenarios for investment-focused buyers like you.",
  },
};

function nurtureEmailHtml(firstName: string, body: string): string {
  return `<p>Hi ${firstName},</p><p>${body}</p><p>— Forth Urban</p>`;
}

/** Sends the segment-appropriate nurture email for a user's current lead category, right after their profile is established. */
export async function sendSegmentNurtureEmail(userId: string, leadCategory: LeadCategory): Promise<void> {
  const user = await User.findById(userId);
  if (!user) return;

  const template = SEGMENT_EMAIL_TEMPLATES[leadCategory];
  await sendTrackedEmail({
    userId,
    campaign: `nurture-${leadCategory}`,
    template: "segment-nurture",
    to: user.email,
    subject: template.subject,
    html: nurtureEmailHtml(user.firstName, template.body),
  });

  await createNotification(userId, "email", template.subject, template.body);
}

function quizAbandonmentEmailHtml(firstName: string): string {
  return `<p>Hi ${firstName},</p><p>You started your free Abuja Property Profile consultation but haven't finished yet. Pick up right where you left off — it only takes a couple of minutes to get your readiness score and matched land recommendations.</p><p>— Forth Urban</p>`;
}

/**
 * Finds users whose most recent `quiz.started` audit log entry has no
 * matching `quiz.completed` entry after it, and who haven't already been
 * reminded since that attempt (docs/IMPLEMENTATION_PLAN.md Phase 2
 * "Abandonment detection ... via auditLogs").
 */
export async function findAbandonedQuizUserIds(
  reminderHours: number = env.QUIZ_ABANDONMENT_REMINDER_HOURS,
): Promise<string[]> {
  const cutoff = new Date(Date.now() - reminderHours * 60 * 60 * 1000);
  const starts = await AuditLog.find({ action: "quiz.started", createdAt: { $lte: cutoff } }).sort({
    createdAt: -1,
  });

  const seenUsers = new Set<string>();
  const abandonedUserIds: string[] = [];

  for (const start of starts) {
    const userId = start.actorId?.toString();
    if (!userId || seenUsers.has(userId)) continue;
    seenUsers.add(userId);

    const startedAt = start.get("createdAt") as Date;

    const completedSince = await AuditLog.findOne({
      actorId: start.actorId,
      action: "quiz.completed",
      createdAt: { $gte: startedAt },
    });
    if (completedSince) continue;

    const alreadyReminded = await EmailEvent.findOne({
      userId,
      campaign: "quiz-abandonment",
      createdAt: { $gte: startedAt },
    });
    if (alreadyReminded) continue;

    abandonedUserIds.push(userId);
  }

  return abandonedUserIds;
}

/**
 * Sends the quiz-abandonment reminder email (PRODUCT_SPEC §6 "Starts but
 * abandons quiz -> Email reminder to continue") to every eligible user.
 * Invoked from the daily cron job (apps/server/src/lib/scheduler.ts) and
 * exported standalone so it can be triggered/tested without the scheduler.
 */
export async function sendAbandonedQuizReminders(
  reminderHours: number = env.QUIZ_ABANDONMENT_REMINDER_HOURS,
): Promise<number> {
  const userIds = await findAbandonedQuizUserIds(reminderHours);
  const nextAction = selectNextBestAction("quizAbandoned");

  for (const userId of userIds) {
    const user = await User.findById(userId);
    if (!user) continue;

    await sendTrackedEmail({
      userId,
      campaign: "quiz-abandonment",
      template: "quiz-abandonment",
      to: user.email,
      subject: "Continue your free Abuja property consultation",
      html: quizAbandonmentEmailHtml(user.firstName),
    });

    await createNotification(userId, "email", "Continue your quiz", nextAction.action);

    await recordAuditLog({
      actorId: userId,
      actorType: "system",
      action: "notification.quiz_abandonment_sent",
      targetType: "User",
      targetId: userId,
    });
  }

  if (userIds.length > 0) {
    logger.info({ count: userIds.length }, "Sent quiz-abandonment reminder emails");
  }

  return userIds.length;
}

/** Reads a user's current lead category from their profile, if one exists. */
export async function getLeadCategory(userId: string): Promise<LeadCategory | null> {
  const profile = await Profile.findOne({ userId });
  return (profile?.leadCategory as LeadCategory | undefined) ?? null;
}
