import type { Page, Route } from "@playwright/test";

/**
 * Deterministic API mocks for the Playwright funnel/a11y tests. There is no
 * dedicated E2E backend environment yet (Phase 10), and every endpoint used
 * here already has real Supertest integration coverage server-side — this
 * only needs to prove the client wires screens/navigation together
 * correctly end-to-end. All responses use the app's real
 * `{success,message,data}` envelope shape.
 */

const PROPERTY_ID = "prop-e2e-1";

function envelope<T>(data: T, message = "") {
  return { success: true, message, data };
}

const user = {
  id: "user-e2e-1",
  firstName: "Jane",
  lastName: "Doe",
  email: "jane.e2e@example.com",
  authProvider: "local",
  emailVerified: true,
  whatsappNumber: null,
  currentCity: null,
  currentCountry: null,
  isDiaspora: false,
  role: "user",
  status: "active",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const propertyListItem = {
  id: PROPERTY_ID,
  name: "Sunset Gardens Estate",
  estateName: "Sunset Gardens",
  location: { address: "Kuje, Abuja", landmarks: ["Kuje Market"], lat: null, lng: null },
  pricePerPlot: 5_000_000,
  plotSizes: ["500sqm"],
  developmentStatus: "serviced",
  bestFitBuyerTypes: ["firstTime", "investment"],
  coverPhoto: null,
};

const propertyDetail = {
  ...propertyListItem,
  titleType: "C of O",
  documentationStatus: "Verified",
  paymentPlans: [{ type: "installment", label: "12-month plan", minDownPaymentPercent: 20, maxDurationMonths: 12 }],
  inspectionAvailability: { physical: true, virtual: true },
  hiddenCostRules: [
    { key: "survey", label: "Survey fee", amount: 150_000, applicable: true },
    { key: "legal", label: "Legal/documentation fee", amount: 250_000, applicable: true },
  ],
  roiAssumptions: { conservative: 0.05, moderate: 0.1, optimistic: 0.15 },
  media: { photos: [], videos: [], googleMapsUrl: null, brochureUrl: null, titleDocuments: [] },
  isActive: true,
};

const nextAction = (action: string, reason = "Recommended next step.") => ({
  trigger: "homeReadinessQuizCompleted",
  action,
  reason,
});

/** Mutable per-test state so GET /profiles/me reflects quiz completion, like a real backend would. */
export interface MockState {
  hasCompletedQuiz: boolean;
}

function jsonRoute(route: Route, body: unknown, status = 200) {
  return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
}

export async function installApiMocks(page: Page, state: MockState = { hasCompletedQuiz: false }) {
  await page.route("**/api/**", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname.replace(/^\/api/, "");
    const method = req.method();

    if (path === "/auth/refresh" && method === "POST") {
      return jsonRoute(route, { success: false, message: "No session", data: null }, 401);
    }
    if (path === "/auth/register" && method === "POST") {
      return jsonRoute(
        route,
        envelope({ user, tokens: { accessToken: "mock-access-token", accessTokenExpiresAt: new Date(Date.now() + 3_600_000).toISOString() } }),
      );
    }
    if (path === "/profiles/me" && method === "GET") {
      if (!state.hasCompletedQuiz) return jsonRoute(route, envelope(null));
      return jsonRoute(
        route,
        envelope({
          id: "profile-e2e-1",
          buyerGoal: "residential",
          budgetRange: { min: 1_000_000, max: 5_000_000 },
          monthlyIncome: 300_000,
          paymentStyle: "oneTime",
          timeline: "now",
          preferredArea: "Kuje",
          lifestylePreference: "familyFriendly",
          biggestFear: "affordability",
          inspectionPreference: "physical",
          buyerPersona: "First-Time Ownership Builder",
          leadCategory: "warm",
          readinessScore: 72,
          updatedAt: new Date().toISOString(),
        }),
      );
    }
    if (path === "/inspections/me" && method === "GET") {
      return jsonRoute(route, envelope([]));
    }
    if (path === "/notifications/me" && method === "GET") {
      return jsonRoute(route, envelope([]));
    }
    if (path === "/quiz/home-readiness/start" && method === "POST") {
      return jsonRoute(route, envelope(null));
    }
    if (path === "/quiz/home-readiness" && method === "POST") {
      state.hasCompletedQuiz = true;
      return jsonRoute(
        route,
        envelope({
          score: 72,
          band: "almostReady",
          bandLabel: "Almost Ready",
          persona: "First-Time Ownership Builder",
          leadCategory: "warm",
          nextAction: nextAction("View matched properties"),
          completedAt: new Date().toISOString(),
        }),
      );
    }
    if (path === "/recommendations/properties" && method === "GET") {
      return jsonRoute(route, envelope([{ property: propertyListItem, score: 88, reasonTags: ["Matches your budget", "In your preferred area"] }]));
    }
    if (path === `/properties/${PROPERTY_ID}` && method === "GET") {
      return jsonRoute(route, envelope({ property: propertyDetail, nextAction: nextAction("Calculate payment breakdown") }));
    }
    if (path === "/calculators/budget" && method === "POST") {
      return jsonRoute(
        route,
        envelope({
          propertyId: PROPERTY_ID,
          propertyPrice: 5_000_000,
          downPayment: 1_000_000,
          balance: 4_000_000,
          installmentDurationMonths: 12,
          monthlyInstallment: 333_333,
          monthlyIncome: 300_000,
          affordabilityRatio: 1.11,
          affordabilityBand: "manageable",
          affordabilityBandLabel: "Manageable",
          advice: "This plan fits within a manageable range.",
          includeHiddenCosts: false,
          hiddenCostTotal: 0,
          nextAction: nextAction("Review hidden costs"),
        }),
      );
    }
    if (path === "/calculators/hidden-cost" && method === "POST") {
      return jsonRoute(
        route,
        envelope({
          propertyId: PROPERTY_ID,
          items: propertyDetail.hiddenCostRules,
          total: 400_000,
          disclaimer: "Estimates only — confirm exact figures during inspection.",
          nextAction: nextAction("Review ROI scenarios"),
        }),
      );
    }
    if (path === "/calculators/roi" && method === "POST") {
      return jsonRoute(
        route,
        envelope({
          propertyId: PROPERTY_ID,
          currentPrice: 5_000_000,
          years: 5,
          scenarios: {
            conservative: { rate: 0.05, futureValue: 6_381_408, estimatedGain: 1_381_408, roiPercent: 27.6 },
            moderate: { rate: 0.1, futureValue: 8_052_550, estimatedGain: 3_052_550, roiPercent: 61.1 },
            optimistic: { rate: 0.15, futureValue: 10_056_800, estimatedGain: 5_056_800, roiPercent: 101.1 },
          },
          disclaimer: "Projections are educational estimates, not guarantees.",
          nextAction: nextAction("Book an inspection"),
        }),
      );
    }
    if (path === "/inspections" && method === "POST") {
      return jsonRoute(
        route,
        envelope({
          id: "inspection-e2e-1",
          propertyId: PROPERTY_ID,
          recommendedArea: null,
          inspectionType: "physical",
          preferredDate: "2026-08-01",
          preferredTime: "10:00",
          mainConcern: "hiddenCosts",
          wantsDocsBeforeInspection: false,
          status: "pending",
          checklist: ["Confirm the C of O", "Verify survey beacons on site"],
          whatsappLink: "https://wa.me/2340000000000",
          nextAction: nextAction("Go to dashboard", "We'll confirm your inspection shortly."),
          createdAt: new Date().toISOString(),
        }),
      );
    }
    if (path.startsWith("/ai/") && method === "POST") {
      return jsonRoute(
        route,
        envelope({
          promptKey: "quiz-summary",
          text: "Based on your answers, you're close to ready — a modest down payment now would put you in a strong position.",
          provider: "template",
          promptVersion: "1",
          degraded: false,
        }),
      );
    }
    if (path === "/events" && method === "POST") {
      return jsonRoute(route, envelope(null));
    }

    // Unhandled endpoint — fail loudly during test development instead of
    // silently hanging, but don't block unrelated background calls (e.g.
    // analytics) from resolving.
    return jsonRoute(route, envelope(null));
  });
}

export { PROPERTY_ID };
