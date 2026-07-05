import type { HomeReadinessAnswers, AreaQuizAnswers } from "@forth-urban/validation";
import type {
  AreaQuizResultDTO,
  BuyerPersona,
  HomeReadinessResultDTO,
  LeadCategory,
  QuizType,
} from "@forth-urban/shared-types";
import { recordAuditLog } from "../../lib/audit-log.service.js";
import { sendSegmentNurtureEmail } from "../notifications/index.js";
import { getAreaOverridesMap } from "../areas/index.js";
import { Profile } from "../users/profile.model.js";
import {
  READINESS_BAND_LABELS,
  READINESS_BAND_NEXT_ACTION,
  getReadinessBand,
  matchAreaForPreference,
  scoreHomeReadiness,
  selectBuyerPersona,
  selectLeadCategory,
  selectNextBestAction,
} from "../decision-engine/index.js";
import { QuizResponse } from "./quiz-response.model.js";

interface RequestMeta {
  ip: string | null;
}

function toAnswerEntries(answers: Record<string, unknown>) {
  return Object.entries(answers).map(([questionKey, answer]) => ({ questionKey, answer }));
}

/**
 * Records that a user began a quiz, without persisting a quiz document.
 * Abandonment (Phase 6 nurture email) is detected later by finding a
 * `quiz.started` audit log entry with no matching `quiz.completed` entry
 * for the same user within a time window.
 */
export async function startQuiz(userId: string, quizType: QuizType, meta: RequestMeta): Promise<void> {
  await recordAuditLog({
    actorId: userId,
    actorType: "user",
    action: "quiz.started",
    targetType: "Quiz",
    metadata: { quizType },
    ipAddress: meta.ip,
  });
}

export async function submitHomeReadinessQuiz(
  userId: string,
  answers: HomeReadinessAnswers,
  meta: RequestMeta,
): Promise<HomeReadinessResultDTO> {
  const score = scoreHomeReadiness(answers);
  const band = getReadinessBand(score);
  const persona = selectBuyerPersona(answers);
  const leadCategory = selectLeadCategory(answers, band, persona);
  const nextAction = selectNextBestAction("homeReadinessQuizCompleted");
  const completedAt = new Date();

  await QuizResponse.create({
    userId,
    quizType: "homeReadiness",
    answers: toAnswerEntries(answers),
    readinessScore: score,
    resultType: band,
    completedAt,
  });

  await Profile.findOneAndUpdate(
    { userId },
    {
      userId,
      buyerGoal: answers.buyerGoal,
      budgetRange: answers.budgetRange,
      monthlyIncome: answers.monthlyIncome,
      paymentStyle: answers.paymentStyle,
      timeline: answers.timeline,
      preferredArea: answers.preferredArea,
      lifestylePreference: answers.lifestylePreference,
      biggestFear: answers.biggestFear,
      inspectionPreference: answers.inspectionPreference,
      buyerPersona: persona,
      leadCategory,
      readinessScore: score,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
  );

  await recordAuditLog({
    actorId: userId,
    actorType: "user",
    action: "quiz.completed",
    targetType: "Quiz",
    metadata: { quizType: "homeReadiness", score, band },
    ipAddress: meta.ip,
  });
  await recordAuditLog({
    actorId: userId,
    actorType: "user",
    action: "quiz.readiness_result_viewed",
    targetType: "Quiz",
    metadata: { score, band },
    ipAddress: meta.ip,
  });

  // Phase 6: segment-based nurture email (PRODUCT_SPEC §14) — fired as soon
  // as a lead category is established. Never throws (sendTrackedEmail
  // swallows delivery failures), so it can't break the quiz result response.
  await sendSegmentNurtureEmail(userId, leadCategory);

  return {
    score,
    band,
    bandLabel: READINESS_BAND_LABELS[band],
    persona,
    leadCategory,
    nextAction: {
      trigger: nextAction.trigger,
      action: READINESS_BAND_NEXT_ACTION[band],
      reason: nextAction.reason,
    },
    completedAt: completedAt.toISOString(),
  };
}

/** Reads the user's current profile (populated by the last completed quiz submission). */
export async function getHomeReadinessResult(userId: string): Promise<HomeReadinessResultDTO | null> {
  const profile = await Profile.findOne({ userId });
  if (!profile) return null;

  const band = getReadinessBand(profile.readinessScore);
  const nextAction = selectNextBestAction("homeReadinessQuizCompleted");

  await recordAuditLog({
    actorId: userId,
    actorType: "user",
    action: "quiz.readiness_result_viewed",
    targetType: "Quiz",
    metadata: { score: profile.readinessScore, band },
  });

  return {
    score: profile.readinessScore,
    band,
    bandLabel: READINESS_BAND_LABELS[band],
    persona: profile.buyerPersona as BuyerPersona,
    leadCategory: profile.leadCategory as LeadCategory,
    nextAction: {
      trigger: nextAction.trigger,
      action: READINESS_BAND_NEXT_ACTION[band],
      reason: nextAction.reason,
    },
    completedAt: (profile.get("updatedAt") as Date).toISOString(),
  };
}

export async function submitAreaQuiz(
  userId: string,
  answers: AreaQuizAnswers,
  meta: RequestMeta,
): Promise<AreaQuizResultDTO> {
  const areaOverrides = await getAreaOverridesMap();
  const recommendedArea = matchAreaForPreference(answers.areaPreference, areaOverrides);
  const nextAction = selectNextBestAction("areaQuizCompleted");
  const completedAt = new Date();

  await QuizResponse.create({
    userId,
    quizType: "area",
    answers: toAnswerEntries(answers),
    readinessScore: null,
    resultType: recommendedArea,
    completedAt,
  });

  await recordAuditLog({
    actorId: userId,
    actorType: "user",
    action: "quiz.completed",
    targetType: "Quiz",
    metadata: { quizType: "area", recommendedArea },
    ipAddress: meta.ip,
  });

  return {
    recommendedArea,
    nextAction: { trigger: nextAction.trigger, action: nextAction.action, reason: nextAction.reason },
    completedAt: completedAt.toISOString(),
  };
}

/** Reads the most recently completed Area Quiz submission for the user. */
export async function getAreaQuizResult(userId: string): Promise<AreaQuizResultDTO | null> {
  const latest = await QuizResponse.findOne({ userId, quizType: "area" }).sort({ completedAt: -1 });
  if (!latest) return null;

  const nextAction = selectNextBestAction("areaQuizCompleted");

  return {
    recommendedArea: latest.resultType,
    nextAction: { trigger: nextAction.trigger, action: nextAction.action, reason: nextAction.reason },
    completedAt: latest.completedAt.toISOString(),
  };
}
