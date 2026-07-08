/**
 * Single source of truth for Zod schemas shared between apps/client and
 * apps/server (form validation on the client, request validation on the
 * server, using the exact same schema). See AGENTS.md rule #4.
 *
 * Phase 1: auth schemas (register/login/OTP/password reset).
 */
import { z } from "zod";

const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address");
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long");

export const registerSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(60),
  lastName: z.string().trim().min(1, "Last name is required").max(60),
  email: emailSchema,
  password: passwordSchema,
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const otpRequestSchema = z.object({
  email: emailSchema,
});
export type OtpRequestInput = z.infer<typeof otpRequestSchema>;

export const otpVerifySchema = z.object({
  email: emailSchema,
  code: z.string().length(6, "Enter the 6-digit code"),
});
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  email: emailSchema,
  token: z.string().min(1, "Reset token is required"),
  password: passwordSchema,
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const verifyPasswordSchema = z.object({
  password: z.string().min(1, "Password is required"),
});
export type VerifyPasswordInput = z.infer<typeof verifyPasswordSchema>;

export const googleAuthSchema = z.object({
  idToken: z.string().min(1, "Google ID token is required"),
});
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;

/**
 * Phase 2: Home-Readiness Quiz + Best Abuja Area Quiz answer schemas.
 * See docs/PRODUCT_SPEC.md#4-home-readiness-quiz and §12.
 */
export const buyerGoalSchema = z.enum(["investment", "residential", "family", "diaspora", "firstTime"]);
export type BuyerGoal = z.infer<typeof buyerGoalSchema>;

export const paymentStyleSchema = z.enum(["oneTime", "installment"]);
export type PaymentStyle = z.infer<typeof paymentStyleSchema>;

export const timelineSchema = z.enum(["now", "in3To6Months", "in6To12Months", "justExploring"]);
export type Timeline = z.infer<typeof timelineSchema>;

export const lifestylePreferenceSchema = z.enum([
  "premiumQuiet",
  "affordableStarter",
  "cityAccess",
  "familyFriendly",
  "investmentGrowth",
]);
export type LifestylePreference = z.infer<typeof lifestylePreferenceSchema>;

export const biggestFearSchema = z.enum([
  "scamFear",
  "documentation",
  "hiddenCosts",
  "locationConfusion",
  "delayedAllocation",
  "affordability",
]);
export type BiggestFear = z.infer<typeof biggestFearSchema>;

export const inspectionPreferenceSchema = z.enum([
  "physical",
  "virtual",
  "documentReviewFirst",
  "advisorCallFirst",
]);
export type InspectionPreference = z.infer<typeof inspectionPreferenceSchema>;

export const homeReadinessAnswersSchema = z.object({
  buyerGoal: buyerGoalSchema,
  budgetRange: z
    .object({
      min: z.number().nonnegative("Minimum budget cannot be negative"),
      max: z.number().positive("Maximum budget must be greater than 0"),
    })
    .refine((range) => range.max >= range.min, {
      message: "Maximum budget must be greater than or equal to minimum budget",
      path: ["max"],
    }),
  monthlyIncome: z.number().nonnegative("Monthly income/contribution cannot be negative"),
  paymentStyle: paymentStyleSchema,
  timeline: timelineSchema,
  preferredArea: z.string().trim().min(1, "Tell us an area you're considering").max(120),
  lifestylePreference: lifestylePreferenceSchema,
  biggestFear: biggestFearSchema,
  inspectionPreference: inspectionPreferenceSchema,
});
export type HomeReadinessAnswers = z.infer<typeof homeReadinessAnswersSchema>;

export const areaPreferenceSchema = z.enum([
  "premiumLiving",
  "affordableOwnership",
  "cityAccessAffordability",
  "familyOriented",
  "investmentFocused",
  "diasporaBuyer",
]);
export type AreaPreference = z.infer<typeof areaPreferenceSchema>;

export const areaQuizAnswersSchema = z.object({
  areaPreference: areaPreferenceSchema,
});
export type AreaQuizAnswers = z.infer<typeof areaQuizAnswersSchema>;

/**
 * Phase 4: Calculator input schemas (Budget/Hidden Cost/ROI — deterministic
 * only, no LLM involvement). See docs/PRODUCT_SPEC.md#8-budget--installment-calculator-deterministic,
 * §9, §10. `propertyId` is validated as a non-empty string here; the server
 * looks it up and returns 404 if it doesn't resolve to a real property.
 */
const propertyIdSchema = z.string().trim().min(1, "Select a property");

export const budgetCalculatorInputSchema = z.object({
  propertyId: propertyIdSchema,
  downPayment: z.number().nonnegative("Down payment cannot be negative"),
  installmentDurationMonths: z.number().int().positive("Installment duration must be at least 1 month"),
  monthlyIncome: z.number().nonnegative("Monthly income/contribution cannot be negative"),
  includeHiddenCosts: z.boolean().default(false),
});
export type BudgetCalculatorInput = z.infer<typeof budgetCalculatorInputSchema>;

export const hiddenCostCalculatorInputSchema = z.object({
  propertyId: propertyIdSchema,
});
export type HiddenCostCalculatorInput = z.infer<typeof hiddenCostCalculatorInputSchema>;

export const roiCalculatorInputSchema = z.object({
  propertyId: propertyIdSchema,
  years: z.number().int().positive("Years must be at least 1").max(50, "Years must be 50 or less"),
});
export type RoiCalculatorInput = z.infer<typeof roiCalculatorInputSchema>;

/**
 * Phase 5: LLM Advisory Layer input schemas. See docs/ARCHITECTURE.md#llm-advisory-layer-appsserversrcmodulesai-advisory.
 * Every endpoint here is account-gated and pulls the user's own stored
 * Decision Engine output as context server-side (AGENTS.md rule #2) — these
 * schemas only accept identifiers/selections, never numbers to explain.
 */
export const roiScenarioKeySchema = z.enum(["conservative", "moderate", "optimistic"]);
export type RoiScenarioKeyInput = z.infer<typeof roiScenarioKeySchema>;

export const aiRoiExplainerInputSchema = z.object({
  propertyId: propertyIdSchema,
  years: z.number().int().positive("Years must be at least 1").max(50, "Years must be 50 or less"),
  scenario: roiScenarioKeySchema,
});
export type AiRoiExplainerInput = z.infer<typeof aiRoiExplainerInputSchema>;

export const aiRecommendationExplainerInputSchema = z.object({
  propertyId: propertyIdSchema,
});
export type AiRecommendationExplainerInput = z.infer<typeof aiRecommendationExplainerInputSchema>;

export const inspectionTypeSchema = z.enum(["physical", "virtual"]);
export type InspectionType = z.infer<typeof inspectionTypeSchema>;

export const aiInspectionAdviceInputSchema = z.object({
  propertyId: propertyIdSchema,
  inspectionType: inspectionTypeSchema,
});
export type AiInspectionAdviceInput = z.infer<typeof aiInspectionAdviceInputSchema>;

export const aiAskInputSchema = z.object({
  question: z.string().trim().min(1, "Enter a question").max(500, "Keep your question under 500 characters"),
});
export type AiAskInput = z.infer<typeof aiAskInputSchema>;

/**
 * Phase 6: Site Inspection Scheduler input schema. See
 * docs/PRODUCT_SPEC.md#11-site-inspection-scheduler-the-conversion-event.
 * `mainConcern` reuses `biggestFearSchema` — the same fear taxonomy already
 * captured on the profile, so the booking form doesn't invent a new enum.
 * Either `propertyId` (a specific matched land) or `recommendedArea` (from
 * the Best Abuja Area Quiz) must be provided.
 */
export const inspectionBookingInputSchema = z
  .object({
    propertyId: z.string().trim().optional(),
    recommendedArea: z.string().trim().max(120).optional(),
    inspectionType: inspectionTypeSchema,
    preferredDate: z.string().trim().min(1, "Choose a preferred date"),
    preferredTime: z.string().trim().min(1, "Choose a preferred time"),
    mainConcern: biggestFearSchema,
    wantsDocsBeforeInspection: z.boolean().default(false),
    whatsappNumber: z.string().trim().min(5, "Enter a valid WhatsApp number").max(20).optional(),
  })
  .refine((data) => Boolean(data.propertyId) || Boolean(data.recommendedArea), {
    message: "Select a property or a recommended area",
    path: ["propertyId"],
  });
export type InspectionBookingInput = z.infer<typeof inspectionBookingInputSchema>;

/**
 * Phase 7: Admin dashboard input schemas. See
 * docs/IMPLEMENTATION_PLAN.md#phase-7--admin-dashboard. Every `/api/admin/*`
 * route is gated to `role=admin` (enforced by middleware, not by these
 * schemas), but every route still gets its own Zod schema per AGENTS.md
 * rule #4.
 */

export const userRoleSchema = z.enum(["user", "admin", "sales"]);
export type UserRoleInput = z.infer<typeof userRoleSchema>;

export const userStatusSchema = z.enum(["active", "suspended"]);
export type UserStatusInput = z.infer<typeof userStatusSchema>;

export const adminUpdateUserSchema = z.object({
  role: userRoleSchema.optional(),
  status: userStatusSchema.optional(),
});
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;

export const developmentStatusSchema = z.enum(["serviced", "developing", "planned", "completed"]);
export type DevelopmentStatusInput = z.infer<typeof developmentStatusSchema>;

const adminPaymentPlanSchema = z.object({
  type: paymentStyleSchema,
  label: z.string().trim().min(1, "Label is required"),
  minDownPaymentPercent: z.number().min(0).max(100).nullable().optional(),
  maxDurationMonths: z.number().int().positive().nullable().optional(),
});

const adminHiddenCostRuleSchema = z.object({
  key: z.string().trim().min(1),
  label: z.string().trim().min(1),
  amount: z.number().nonnegative(),
  applicable: z.boolean().default(true),
});

const adminRoiAssumptionsSchema = z.object({
  conservative: z.number().min(0).max(5),
  moderate: z.number().min(0).max(5),
  optimistic: z.number().min(0).max(5),
});

const adminPropertyLocationSchema = z.object({
  address: z.string().trim().min(1, "Address is required"),
  landmarks: z.array(z.string().trim().min(1)).default([]),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
});

const adminPropertyMediaSchema = z.object({
  photos: z.array(z.string().trim().min(1)).default([]),
  videos: z.array(z.string().trim().min(1)).default([]),
  googleMapsUrl: z.string().trim().min(1).nullable().optional(),
  brochureUrl: z.string().trim().min(1).nullable().optional(),
  titleDocuments: z.array(z.string().trim().min(1)).default([]),
});

export const adminPropertyInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  estateName: z.string().trim().min(1, "Estate name is required"),
  location: adminPropertyLocationSchema,
  pricePerPlot: z.number().nonnegative(),
  plotSizes: z.array(z.string().trim().min(1)).default([]),
  titleType: z.string().trim().min(1),
  documentationStatus: z.string().trim().min(1),
  paymentPlans: z.array(adminPaymentPlanSchema).default([]),
  bestFitBuyerTypes: z.array(buyerGoalSchema).default([]),
  developmentStatus: developmentStatusSchema,
  inspectionAvailability: z.object({ physical: z.boolean().default(true), virtual: z.boolean().default(true) }),
  hiddenCostRules: z.array(adminHiddenCostRuleSchema).default([]),
  roiAssumptions: adminRoiAssumptionsSchema,
  media: adminPropertyMediaSchema,
  features: z.array(z.string().trim().min(1, "Feature cannot be empty").max(80)).default([]),
  description: z.string().trim().max(2000, "Keep the description under 2000 characters").nullable().optional(),
  isActive: z.boolean().default(true),
});
export type AdminPropertyInput = z.infer<typeof adminPropertyInputSchema>;

export const adminPropertyUpdateSchema = adminPropertyInputSchema.partial();
export type AdminPropertyUpdateInput = z.infer<typeof adminPropertyUpdateSchema>;

/** Media is uploaded as base64 (no multipart/multer dependency) — see cloudinary.util.ts. */
export const adminMediaUploadSchema = z.object({
  kind: z.enum(["image", "video", "document"]),
  field: z.enum(["photos", "videos", "brochureUrl", "titleDocuments"]),
  mimeType: z.string().trim().min(1),
  base64Data: z.string().trim().min(1, "File data is required"),
});
export type AdminMediaUploadInput = z.infer<typeof adminMediaUploadSchema>;

/** Removes a single media item — the matching Cloudinary asset is destroyed alongside the property reference. */
export const adminMediaDeleteSchema = z.object({
  field: z.enum(["photos", "videos", "brochureUrl", "titleDocuments"]),
  url: z.string().trim().min(1, "URL is required"),
});
export type AdminMediaDeleteInput = z.infer<typeof adminMediaDeleteSchema>;

export const inspectionBookingStatusSchema = z.enum(["pending", "confirmed", "completed", "cancelled"]);
export type InspectionBookingStatusInput = z.infer<typeof inspectionBookingStatusSchema>;

export const adminUpdateInspectionSchema = z.object({
  status: inspectionBookingStatusSchema.optional(),
  assignedSalesRep: z.string().trim().min(1).nullable().optional(),
});
export type AdminUpdateInspectionInput = z.infer<typeof adminUpdateInspectionSchema>;

export const pipelineStageSchema = z.enum([
  "new",
  "contacted",
  "qualified",
  "inspectionScheduled",
  "inspectionCompleted",
  "won",
  "lost",
]);
export type PipelineStageInput = z.infer<typeof pipelineStageSchema>;

export const adminUpdateCrmEventSchema = z.object({
  pipelineStage: pipelineStageSchema.optional(),
  addNote: z.string().trim().min(1).max(2000).optional(),
  tags: z.array(z.string().trim().min(1)).optional(),
  salesRepId: z.string().trim().min(1).nullable().optional(),
});
export type AdminUpdateCrmEventInput = z.infer<typeof adminUpdateCrmEventSchema>;

const propertyMatchWeightsSchema = z.object({
  budget: z.number().min(0).max(100).optional(),
  area: z.number().min(0).max(100).optional(),
  buyerGoal: z.number().min(0).max(100).optional(),
  paymentStyle: z.number().min(0).max(100).optional(),
  lifestyle: z.number().min(0).max(100).optional(),
});

const roiAssumptionDefaultsSchema = z.object({
  conservative: z.number().min(0).max(5).optional(),
  moderate: z.number().min(0).max(5).optional(),
  optimistic: z.number().min(0).max(5).optional(),
});

export const adminUpdateSettingsSchema = z.object({
  propertyMatchWeights: propertyMatchWeightsSchema.optional(),
  roiAssumptionDefaults: roiAssumptionDefaultsSchema.optional(),
});
export type AdminUpdateSettingsInput = z.infer<typeof adminUpdateSettingsSchema>;

export const adminAreaInputSchema = z.object({
  preferenceKey: areaPreferenceSchema,
  areaName: z.string().trim().min(1, "Area name is required").max(120),
  description: z.string().trim().max(500).optional(),
  isActive: z.boolean().optional(),
});
export type AdminAreaInput = z.infer<typeof adminAreaInputSchema>;

export const adminPromptKeySchema = z.enum([
  "quiz-summary",
  "recommendation",
  "buyer-persona",
  "inspection-advice",
  "roi-explainer",
  "ask",
]);
export type AdminPromptKeyInput = z.infer<typeof adminPromptKeySchema>;

export const adminUpdatePromptSchema = z.object({
  body: z.string().trim().min(1, "Prompt body is required"),
});
export type AdminUpdatePromptInput = z.infer<typeof adminUpdatePromptSchema>;

export const adminPreviewPromptSchema = z.object({
  context: z.record(z.string(), z.unknown()),
});
export type AdminPreviewPromptInput = z.infer<typeof adminPreviewPromptSchema>;

/**
 * Phase 8: `POST /api/events` — client-fired analytics events. The allowed
 * event names are intentionally a small, fixed subset of the full canonical
 * list in docs/ARCHITECTURE.md §7 (the rest are recorded server-side
 * automatically); this prevents a client from injecting arbitrary event
 * names into PostHog/auditLogs.
 */
export const trackEventSchema = z.object({
  event: z.enum(["inspection_started", "report_downloaded", "whatsapp_clicked"]),
  properties: z.record(z.string(), z.unknown()).optional(),
});
export type TrackEventInput = z.infer<typeof trackEventSchema>;
