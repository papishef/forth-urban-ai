/**
 * Shared TypeScript DTOs/interfaces used by both apps/client and apps/server
 * (User, Property, QuizResult, etc.). See docs/ARCHITECTURE.md#5-database-schema-mongodb-atlas
 * for the shapes these types should mirror.
 *
 * Phase 1: auth/user DTOs.
 */

export type UserRole = "user" | "admin" | "sales";
export type UserStatus = "active" | "suspended";
export type AuthProvider = "local" | "google";

/** Client-safe user shape — never includes passwordHash or other secrets. */
export interface UserDTO {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  authProvider: AuthProvider;
  emailVerified: boolean;
  whatsappNumber: string | null;
  currentCity: string | null;
  currentCountry: string | null;
  isDiaspora: boolean;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  accessTokenExpiresAt: string;
}

export interface AuthResponse {
  user: UserDTO;
  tokens: AuthTokens;
}

/** JWT access token payload — kept minimal, no PII beyond email/role. */
export interface JwtAccessPayload {
  sub: string;
  role: UserRole;
  email: string;
}

/**
 * Phase 2: Decision Engine / Quiz DTOs.
 * See docs/PRODUCT_SPEC.md#5-ai-recommendation-output-decision-engine-result-explained-by-llm
 * and docs/PRODUCT_SPEC.md#6-next-best-action-engine-deterministic-rules.
 */

export type ReadinessBand = "readyBuyer" | "almostReady" | "researchingBuyer" | "earlyStageBuyer";

export type BuyerPersona =
  | "Diaspora Investor"
  | "Growth Investor"
  | "Budget Starter"
  | "First-Time Ownership Builder"
  | "Premium Home Builder";

export type LeadCategory = "diaspora" | "investor" | "budgetStarter" | "hot" | "warm" | "research";

export type QuizType = "homeReadiness" | "area";

/** Every trigger from the Next Best Action table (PRODUCT_SPEC §6). */
export type NextActionTrigger =
  | "homeReadinessQuizCompleted"
  | "propertyCardViewed"
  | "budgetCalculatorUsed"
  | "hiddenCostGuideViewed"
  | "roiCalculatorRun"
  | "areaQuizCompleted"
  | "inspectionChecklistDownloaded"
  | "quizAbandoned"
  | "propertyViewedTwice";

export interface NextActionDTO {
  trigger: NextActionTrigger;
  action: string;
  reason: string;
}

export interface HomeReadinessResultDTO {
  score: number;
  band: ReadinessBand;
  bandLabel: string;
  persona: BuyerPersona;
  leadCategory: LeadCategory;
  nextAction: NextActionDTO;
  completedAt: string;
}

export interface AreaQuizResultDTO {
  recommendedArea: string;
  nextAction: NextActionDTO;
  completedAt: string;
}

export interface ProfileDTO {
  id: string;
  buyerGoal: string;
  budgetRange: { min: number; max: number };
  monthlyIncome: number;
  paymentStyle: string;
  timeline: string;
  preferredArea: string;
  lifestylePreference: string;
  biggestFear: string;
  inspectionPreference: string;
  buyerPersona: BuyerPersona;
  leadCategory: LeadCategory;
  readinessScore: number;
  updatedAt: string;
}
