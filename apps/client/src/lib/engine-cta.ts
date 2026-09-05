import type { UserDTO } from "@forth-urban/shared-types";
import { canReadAdminMenu, getAdminLandingPath, hasAdminSurface } from "./admin-access";

export type EngineCtaIntent =
  | "start"
  | "dashboard"
  | "quiz"
  | "area-quiz"
  | "properties"
  | "calculators"
  | "book-inspection";

export interface ResolvedEngineCta {
  to: string;
  label: string;
  isEngineRoute: boolean;
}

/**
 * Resolves a marketing CTA target based on authentication state and user role.
 * Ensures 90%+ of website CTAs direct seamlessly into the Forth Urban AI Property Advisor engine.
 */
export function resolveEngineCta(
  user: UserDTO | null,
  isAuthenticated: boolean,
  intent: EngineCtaIntent = "start",
): ResolvedEngineCta {
  // Let visitors experience the readiness quiz before asking for account details.
  if (!isAuthenticated || !user) {
    switch (intent) {
      case "quiz":
        return { to: "/quiz/home-readiness", label: "Take AI Readiness Quiz", isEngineRoute: true };
      case "area-quiz":
        return { to: "/register", label: "Find Your Best Area", isEngineRoute: true };
      case "properties":
        return { to: "/register", label: "View Matched Properties", isEngineRoute: true };
      case "calculators":
        return { to: "/register", label: "Calculate Land Affordability", isEngineRoute: true };
      case "book-inspection":
        return { to: "/register", label: "Book Site Inspection", isEngineRoute: true };
      case "dashboard":
        return { to: "/login", label: "Client Login", isEngineRoute: true };
      case "start":
      default:
        return { to: "/quiz/home-readiness", label: "Take AI Readiness Quiz", isEngineRoute: true };
    }
  }

  // Owners and converted users navigate to their granted operational surface.
  if (hasAdminSurface(user)) {
    switch (intent) {
      case "properties":
        if (canReadAdminMenu(user, "properties")) {
          return { to: "/admin/properties", label: "Manage Properties", isEngineRoute: true };
        }
        break;
      case "book-inspection":
      case "dashboard":
      case "start":
      default:
        break;
    }
    return { to: getAdminLandingPath(user), label: "Open admin dashboard", isEngineRoute: true };
  }

  // Authenticated regular users navigate directly into the requested engine feature
  switch (intent) {
    case "quiz":
      return { to: "/quiz/home-readiness", label: "Continue AI Readiness Quiz", isEngineRoute: true };
    case "area-quiz":
      return { to: "/quiz/area", label: "Take Area Preference Quiz", isEngineRoute: true };
    case "properties":
      return { to: "/properties/recommended", label: "View Matched Land", isEngineRoute: true };
    case "calculators":
      return { to: "/dashboard", label: "Open Financial Calculators", isEngineRoute: true };
    case "book-inspection":
      return { to: "/inspections/book", label: "Book Site Inspection", isEngineRoute: true };
    case "dashboard":
    case "start":
    default:
      return { to: "/dashboard", label: "Go to Dashboard", isEngineRoute: true };
  }
}
