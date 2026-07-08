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

/** Every trigger from the Next Best Action table (PRODUCT_SPEC §6), plus `inspectionBooked` (Phase 6 — the terminal step after the conversion event itself). */
export type NextActionTrigger =
  | "homeReadinessQuizCompleted"
  | "propertyCardViewed"
  | "budgetCalculatorUsed"
  | "hiddenCostGuideViewed"
  | "roiCalculatorRun"
  | "areaQuizCompleted"
  | "inspectionChecklistDownloaded"
  | "quizAbandoned"
  | "propertyViewedTwice"
  | "inspectionBooked";

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

/**
 * Phase 3: Property inventory & recommendation/matching engine.
 * See docs/PRODUCT_SPEC.md#7-property-recommendation-engine and
 * docs/ARCHITECTURE.md#5-database-schema-mongodb-atlas.
 */

export type DevelopmentStatus = "serviced" | "developing" | "planned" | "completed";

export type RecommendationSource = "quiz" | "areaQuiz" | "manual";

export interface PropertyLocationDTO {
  address: string;
  landmarks: string[];
  lat: number | null;
  lng: number | null;
}

export interface PropertyPaymentPlanDTO {
  type: "oneTime" | "installment";
  label: string;
  minDownPaymentPercent: number | null;
  maxDurationMonths: number | null;
}

/** One line item from a property's hidden-cost rules (PRODUCT_SPEC §9), summed by the Decision Engine in Phase 4. */
export interface PropertyHiddenCostRuleDTO {
  key: string;
  label: string;
  amount: number;
  applicable: boolean;
}

/** Annual appreciation rate assumptions used by the Phase 4 ROI Calculator (PRODUCT_SPEC §10). */
export interface PropertyRoiAssumptionsDTO {
  conservative: number;
  moderate: number;
  optimistic: number;
}

export interface PropertyMediaDTO {
  photos: string[];
  videos: string[];
  googleMapsUrl: string | null;
  brochureUrl: string | null;
  titleDocuments: string[];
}

/** Subset of property fields safe/sufficient for list views and recommendation cards. */
export interface PropertyListItemDTO {
  id: string;
  name: string;
  estateName: string;
  location: PropertyLocationDTO;
  pricePerPlot: number;
  plotSizes: string[];
  developmentStatus: DevelopmentStatus;
  bestFitBuyerTypes: string[];
  coverPhoto: string | null;
  /** All property photos (Cloudinary URLs) — used for gallery/carousel rendering on recommendation & list cards. */
  photos: string[];
  /** Short highlight tags (e.g. "Gated estate", "C of O ready") — rendered as premium pills on the client. */
  features: string[];
}

export interface PropertyDTO extends PropertyListItemDTO {
  titleType: string;
  documentationStatus: string;
  paymentPlans: PropertyPaymentPlanDTO[];
  inspectionAvailability: { physical: boolean; virtual: boolean };
  hiddenCostRules: PropertyHiddenCostRuleDTO[];
  roiAssumptions: PropertyRoiAssumptionsDTO;
  media: PropertyMediaDTO;
  /** Free-form additional notes about the property, admin-authored. */
  description: string | null;
  isActive: boolean;
}

/** One entry in a user's matched-property list, with the Decision Engine's score/reasonTags (never LLM-generated). */
export interface RecommendedPropertyDTO {
  property: PropertyListItemDTO;
  score: number;
  reasonTags: string[];
}

export interface PropertyDetailDTO {
  property: PropertyDTO;
  nextAction: NextActionDTO;
}

/**
 * Phase 4: Calculators (Budget, Hidden Cost, ROI) — deterministic only, no
 * LLM involvement. See docs/PRODUCT_SPEC.md#8-budget--installment-calculator-deterministic,
 * §9-hidden-cost-guide, §10-roi-calculator-deterministic-admin-editable-assumptions.
 */

export type AffordabilityBand = "comfortable" | "manageable" | "tight" | "risky";

export interface BudgetCalculatorResultDTO {
  propertyId: string;
  propertyPrice: number;
  downPayment: number;
  balance: number;
  installmentDurationMonths: number;
  monthlyInstallment: number;
  monthlyIncome: number;
  affordabilityRatio: number | null;
  affordabilityBand: AffordabilityBand;
  affordabilityBandLabel: string;
  advice: string;
  includeHiddenCosts: boolean;
  hiddenCostTotal: number;
  nextAction: NextActionDTO;
}

export interface HiddenCostCalculatorResultDTO {
  propertyId: string;
  items: PropertyHiddenCostRuleDTO[];
  total: number;
  disclaimer: string;
  nextAction: NextActionDTO;
}

export type RoiScenarioKey = "conservative" | "moderate" | "optimistic";

export interface RoiScenarioResultDTO {
  rate: number;
  futureValue: number;
  estimatedGain: number;
  roiPercent: number;
}

export interface RoiCalculatorResultDTO {
  propertyId: string;
  currentPrice: number;
  years: number;
  scenarios: Record<RoiScenarioKey, RoiScenarioResultDTO>;
  disclaimer: string;
  nextAction: NextActionDTO;
}

/**
 * Phase 6: Site Inspection Scheduler, notifications, lightweight CRM.
 * See docs/PRODUCT_SPEC.md#11-site-inspection-scheduler-the-conversion-event,
 * §14-lead-capture--email-marketing, §15-crm--sales-follow-up.
 */

export type InspectionBookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface InspectionBookingDTO {
  id: string;
  propertyId: string | null;
  recommendedArea: string | null;
  inspectionType: "physical" | "virtual";
  preferredDate: string;
  preferredTime: string;
  mainConcern: string;
  wantsDocsBeforeInspection: boolean;
  status: InspectionBookingStatus;
  checklist: string[];
  whatsappLink: string;
  nextAction: NextActionDTO;
  createdAt: string;
}

/** Lightweight CRM pipeline stage — `crmEvents` is an event log, not a mutable record (ARCHITECTURE §9). */
export type PipelineStage =
  | "new"
  | "contacted"
  | "qualified"
  | "inspectionScheduled"
  | "inspectionCompleted"
  | "won"
  | "lost";

export type NotificationType = "email" | "browser" | "sms" | "whatsapp";

export interface NotificationDTO {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

/**
 * Phase 5: LLM Advisory Layer. See docs/ARCHITECTURE.md#llm-advisory-layer-appsserversrcmodulesai-advisory.
 *
 * The LLM only ever explains numbers the Decision Engine already computed
 * elsewhere — it never returns a number of its own, so every response here
 * is just explanatory text plus provenance (which provider/prompt version
 * produced it, and whether it's a non-LLM safety-net fallback).
 */
export interface AIProvider {
  generate(input: {
    promptKey: string;
    version?: string;
    context: Record<string, unknown>;
    maxTokens?: number;
  }): Promise<{ text: string; provider: string; promptVersion: string }>;
}

export type AIPromptKey =
  | "quiz-summary"
  | "recommendation"
  | "buyer-persona"
  | "inspection-advice"
  | "roi-explainer"
  | "ask";

export interface AIAdvisoryResponseDTO {
  promptKey: AIPromptKey;
  text: string;
  provider: string;
  promptVersion: string;
  /** True when both LLM providers failed and a local plain-language template was used instead. */
  degraded: boolean;
}

/**
 * Phase 7: Admin dashboard DTOs. See docs/IMPLEMENTATION_PLAN.md#phase-7--admin-dashboard.
 * Every `/api/admin/*` route (docs/ARCHITECTURE.md §6) is gated to `role=admin`.
 */

/** Lightweight pagination envelope reused by every admin list endpoint. */
export interface PaginatedResultDTO<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminUserDTO extends UserDTO {
  profile: ProfileDTO | null;
}

export interface AdminInspectionBookingDTO extends InspectionBookingDTO {
  user: { id: string; firstName: string; lastName: string; email: string };
  propertyName: string | null;
}

export interface AdminCrmEventDTO {
  id: string;
  userId: string;
  user: { id: string; firstName: string; lastName: string; email: string } | null;
  eventType: string;
  pipelineStage: PipelineStage;
  payload: Record<string, unknown>;
  notes: string[];
  tags: string[];
  salesRepId: string | null;
  createdAt: string;
}

export interface AdminEmailCampaignSummaryDTO {
  campaign: string;
  sent: number;
  opened: number;
  clicked: number;
  bounced: number;
}

export interface AdminQuizFunnelDTO {
  quizType: QuizType;
  started: number;
  completed: number;
  completionRate: number;
}

export interface AdminReadinessBandDistributionDTO {
  band: ReadinessBand;
  count: number;
}

export interface AdminLeadCategoryDistributionDTO {
  leadCategory: LeadCategory;
  count: number;
}

export interface AdminQuizAnalyticsDTO {
  funnels: AdminQuizFunnelDTO[];
  readinessBandDistribution: AdminReadinessBandDistributionDTO[];
  leadCategoryDistribution: AdminLeadCategoryDistributionDTO[];
  inspectionsBooked: number;
}

export interface AdminAuditLogDTO {
  id: string;
  actorId: string | null;
  actorType: "user" | "admin" | "system";
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, unknown>;
  ipAddress: string | null;
  createdAt: string;
}

export interface SettingsDTO {
  propertyMatchWeights: {
    budget: number;
    area: number;
    buyerGoal: number;
    paymentStyle: number;
    lifestyle: number;
  };
  roiAssumptionDefaults: PropertyRoiAssumptionsDTO;
  updatedAt: string;
}

export interface AreaDTO {
  id: string;
  preferenceKey: string;
  areaName: string;
  description: string;
  isActive: boolean;
  updatedAt: string;
}

export interface AdminPromptDTO {
  key: AIPromptKey;
  version: number;
  modelHint: string;
  inputs: string[];
  body: string;
}

export interface AdminPromptPreviewDTO {
  text: string;
  provider: string;
  promptVersion: string;
  degraded: boolean;
}

/**
 * Phase 8: Analytics & monitoring. See docs/ARCHITECTURE.md#7-event-tracking-posthog--auditlogs
 * for the full canonical PostHog event name list — most of those are recorded automatically
 * server-side alongside their audit log entry (apps/server/src/lib/analytics.ts). The names
 * below are the only ones the client fires directly via `POST /api/events`, since no other
 * server-side hook exists for them yet.
 */
export type ClientTrackableEventName = "inspection_started" | "report_downloaded" | "whatsapp_clicked";

export interface TrackEventInputDTO {
  event: ClientTrackableEventName;
  properties?: Record<string, unknown>;
}
