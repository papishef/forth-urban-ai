import { Router } from "express";
import type {
  AdminLeadCategoryDistributionDTO,
  AdminQuizAnalyticsDTO,
  AdminQuizFunnelDTO,
  AdminReadinessBandDistributionDTO,
  LeadCategory,
  QuizType,
  ReadinessBand,
} from "@forth-urban/shared-types";
import type { ApiEnvelope } from "../../middleware/error-handler.js";
import { AuditLog } from "../../db/audit-log.model.js";
import { QuizResponse } from "../quiz/quiz-response.model.js";
import { Profile } from "../users/index.js";
import { InspectionBooking } from "../inspections/inspection-booking.model.js";

/**
 * `GET /api/admin/analytics/quiz` — Phase 7 quiz analytics (funnel
 * drop-off, readiness band / lead category distribution). PostHog is the
 * real analytics backend (Phase 8); this endpoint reads the same
 * `auditLogs`/`quizResponses`/`profiles` data already recorded by Phases 2-6
 * so a funnel view exists before Phase 8 lands.
 */
export const analyticsAdminRouter: Router = Router();

const QUIZ_TYPES: QuizType[] = ["homeReadiness", "area"];
const READINESS_BANDS: ReadinessBand[] = ["readyBuyer", "almostReady", "researchingBuyer", "earlyStageBuyer"];
const LEAD_CATEGORIES: LeadCategory[] = ["diaspora", "investor", "budgetStarter", "hot", "warm", "research"];

analyticsAdminRouter.get("/quiz", async (_req, res, next) => {
  try {
    const funnels: AdminQuizFunnelDTO[] = await Promise.all(
      QUIZ_TYPES.map(async (quizType) => {
        const [started, completed] = await Promise.all([
          AuditLog.countDocuments({ action: "quiz.started", "metadata.quizType": quizType }),
          AuditLog.countDocuments({ action: "quiz.completed", "metadata.quizType": quizType }),
        ]);
        return {
          quizType,
          started,
          completed,
          completionRate: started > 0 ? completed / started : 0,
        };
      }),
    );

    const readinessBandDistribution: AdminReadinessBandDistributionDTO[] = await Promise.all(
      READINESS_BANDS.map(async (band) => ({
        band,
        count: await QuizResponse.countDocuments({ quizType: "homeReadiness", resultType: band }),
      })),
    );

    const leadCategoryDistribution: AdminLeadCategoryDistributionDTO[] = await Promise.all(
      LEAD_CATEGORIES.map(async (leadCategory) => ({
        leadCategory,
        count: await Profile.countDocuments({ leadCategory }),
      })),
    );

    const inspectionsBooked = await InspectionBooking.countDocuments();

    const data: AdminQuizAnalyticsDTO = {
      funnels,
      readinessBandDistribution,
      leadCategoryDistribution,
      inspectionsBooked,
    };
    const body: ApiEnvelope = { success: true, message: "OK", data, errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});
