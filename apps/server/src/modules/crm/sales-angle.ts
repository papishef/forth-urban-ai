import type { LeadCategory } from "@forth-urban/shared-types";

/**
 * Recommended sales angle per lead category — docs/PRODUCT_SPEC.md#15-crm--sales-follow-up
 * "Sample templates". Stored on `crmEvents.payload.salesAngle` so a future
 * admin CRM board (Phase 7) can surface it to a sales rep without
 * recomputing anything — deterministic copy, not LLM-generated.
 */
const SALES_ANGLE_TEMPLATES: Record<LeadCategory, string> = {
  hot: "Hi {firstName}, your result shows you are ready to compare available plots. I have prepared options that match your budget and preferred area. Would you prefer a physical or virtual inspection?",
  warm: "Hi {firstName}, your result shows you are close to being ready. The main thing to clarify is your budget and payment structure. Here is the breakdown that may fit you.",
  research: "Hi {firstName}, here is a simple roadmap for buying land in Abuja and how to avoid common documentation and scam pitfalls.",
  diaspora: "Hi {firstName}, your result shows you want to build something in Abuja from abroad. We can guide you with property details, document explanation, and virtual inspection before you make any decision.",
  budgetStarter: "Hi {firstName}, here are installment payment paths and affordable areas that fit a starter budget.",
  investor: "Hi {firstName}, here is the area growth outlook and ROI education for investment-focused buyers.",
};

/** Returns the deterministic recommended sales angle for a lead category, with `{firstName}` substituted. */
export function getSalesAngle(leadCategory: LeadCategory, firstName: string): string {
  return SALES_ANGLE_TEMPLATES[leadCategory].replace("{firstName}", firstName);
}
