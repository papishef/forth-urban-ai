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
 * `requireAuth` applies to every route here, at the router root. Per-domain
 * role gating is applied per sub-router: `/users` additionally allows
 * `role=sales` (read-only list/detail — the PATCH handler itself further
 * restricts role/status changes to `role=admin` only). `/inspections` and
 * `/crm` also allow `role=sales` with full read/write, since managing
 * inspection bookings (status, `assignedSalesRep`) and the CRM board
 * (pipeline stage, notes, `salesRepId`) is the actual day-to-day job of a
 * sales rep. Every other sub-router (properties, email campaigns,
 * analytics, logs, settings, areas, prompts) stays `role=admin`-only —
 * these are governance/config/bulk-marketing surfaces, not sales work. See
 * docs/ARCHITECTURE.md#6-api-surface for the full `/api/admin/*` surface
 * this implements: users, properties (with Cloudinary uploads), quiz
 * analytics, inspection bookings, CRM board, email campaigns, ROI
 * assumptions/property-matching-weight settings, area management, and the
 * AI prompt editor.
 */
export const adminRouter: Router = Router();

adminRouter.use(requireAuth);

adminRouter.use("/users", requireRole("admin", "sales"), usersAdminRouter);
adminRouter.use("/properties", requireRole("admin"), propertiesAdminRouter);
adminRouter.use("/inspections", requireRole("admin", "sales"), inspectionsAdminRouter);
adminRouter.use("/crm", requireRole("admin", "sales"), crmAdminRouter);
adminRouter.use("/email-campaigns", requireRole("admin"), emailCampaignsAdminRouter);
adminRouter.use("/analytics", requireRole("admin"), analyticsAdminRouter);
adminRouter.use("/logs", requireRole("admin"), logsAdminRouter);
adminRouter.use("/settings", requireRole("admin"), settingsAdminRouter);
adminRouter.use("/areas", requireRole("admin"), areasAdminRouter);
adminRouter.use("/prompts", requireRole("admin"), promptsAdminRouter);


