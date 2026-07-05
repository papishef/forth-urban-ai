import { describe, expect, it } from "vitest";
import { User } from "../users/user.model.js";
import { recordAuditLog } from "../../lib/audit-log.service.js";
import { EmailEvent } from "./email-event.model.js";
import { Notification } from "./notification.model.js";
import { findAbandonedQuizUserIds, sendAbandonedQuizReminders } from "./nurture.js";

describe("quiz-abandonment nurture (PRODUCT_SPEC §6 quizAbandoned)", () => {
  async function seedUser() {
    return User.create({
      firstName: "Ada",
      lastName: "Lovelace",
      email: `ada-${Date.now()}-${Math.random()}@example.com`,
      passwordHash: "irrelevant",
    });
  }

  it("returns no abandoned users when there are no quiz.started audit logs", async () => {
    const result = await findAbandonedQuizUserIds(0);
    expect(result).toEqual([]);
  });

  it("flags a user who started but never completed the quiz", async () => {
    const user = await seedUser();
    await recordAuditLog({ actorId: user._id.toString(), actorType: "user", action: "quiz.started" });

    const result = await findAbandonedQuizUserIds(0);
    expect(result).toContain(user._id.toString());
  });

  it("does not flag a user who completed the quiz after starting it", async () => {
    const user = await seedUser();
    await recordAuditLog({ actorId: user._id.toString(), actorType: "user", action: "quiz.started" });
    await recordAuditLog({ actorId: user._id.toString(), actorType: "user", action: "quiz.completed" });

    const result = await findAbandonedQuizUserIds(0);
    expect(result).not.toContain(user._id.toString());
  });

  it("sends a reminder email + notification for each abandoned user, and doesn't double-send", async () => {
    const user = await seedUser();
    await recordAuditLog({ actorId: user._id.toString(), actorType: "user", action: "quiz.started" });

    const firstRunCount = await sendAbandonedQuizReminders(0);
    expect(firstRunCount).toBeGreaterThanOrEqual(1);

    const emailEvents = await EmailEvent.find({ userId: user._id, campaign: "quiz-abandonment" });
    expect(emailEvents.length).toBe(1);

    const notifications = await Notification.find({ userId: user._id });
    expect(notifications.some((n) => n.type === "email")).toBe(true);

    const secondRunCount = await sendAbandonedQuizReminders(0);
    const emailEventsAfterSecondRun = await EmailEvent.find({ userId: user._id, campaign: "quiz-abandonment" });
    // The same user should not be reminded twice for the same abandoned attempt.
    expect(emailEventsAfterSecondRun.length).toBe(1);
    expect(secondRunCount).toBe(0);
  });
});
