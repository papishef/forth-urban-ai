import { Router } from "express";
import { requireAuth, requireRole } from "../auth/auth.middleware.js";
import { usersAdminRouter } from "./users.admin.routes.js";
import { propertiesAdminRouter } from "./properties.admin.routes.js";
import { inspectionsAdminRouter } from "./inspections.admin.routes.js";
import { crmAdminRouter } from "./crm.admin.routes.js";
import { emailCampaignsAdminRouter } from "./email-campaigns.admin.routes.js";
import { analyticsAdminRouter } from "./analytics.admin.routes.js";
import { logsAdminRouter } from "./logs.admin.routes.js";
import { settingsAdminRouter } from "./settings.admin.routes.js";
import { areasAdminRouter } from "./areas.admin.routes.js";
import { promptsAdminRouter } from "./prompts.admin.routes.js";

/**
 * Admin module — Phase 7 (docs/IMPLEMENTATION_PLAN.md#phase-7--admin-dashboard).
 *
 * Every route here is gated to `role=admin` (applied once, at the router
 * root, rather than per sub-router) — see docs/ARCHITECTURE.md#6-api-surface
 * for the full `/api/admin/*` surface this implements: users, properties
 * (with Cloudinary uploads), quiz analytics, inspection bookings, CRM board,
 * email campaigns, ROI assumptions/property-matching-weight settings, area
 * management, and the AI prompt editor.
 */
export const adminRouter: Router = Router();

adminRouter.use(requireAuth, requireRole("admin"));

adminRouter.use("/users", usersAdminRouter);
adminRouter.use("/properties", propertiesAdminRouter);
adminRouter.use("/inspections", inspectionsAdminRouter);
adminRouter.use("/crm", crmAdminRouter);
adminRouter.use("/email-campaigns", emailCampaignsAdminRouter);
adminRouter.use("/analytics", analyticsAdminRouter);
adminRouter.use("/logs", logsAdminRouter);
adminRouter.use("/settings", settingsAdminRouter);
adminRouter.use("/areas", areasAdminRouter);
adminRouter.use("/prompts", promptsAdminRouter);

