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
