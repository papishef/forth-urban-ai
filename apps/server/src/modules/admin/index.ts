import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { requireAdminPermission, requireOwnerAdmin } from "../auth/permissions.js";
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
import { contactMessagesAdminRouter } from "../contact/contact-messages.admin.routes.js";
import { newsletterAdminRouter } from "../newsletter/newsletter.admin.routes.js";
import { blogAdminRouter } from "../blog/blog.admin.routes.js";
import { subAdminsAdminRouter } from "./sub-admins.admin.routes.js";

/**
 * Admin module — Phase 7 (docs/IMPLEMENTATION_PLAN.md#phase-7--admin-dashboard).
 *
 * `requireAuth` applies to every route here, at the router root. Each
 * sub-router then requires read access to its corresponding menu. Mutating
 * handlers add a separate write or owner-only check so read-only grants can
 * safely load the same data without gaining mutation authority.
 */
export const adminRouter: Router = Router();

adminRouter.use(requireAuth);
adminRouter.use("/sub-admins", requireOwnerAdmin(), subAdminsAdminRouter);

adminRouter.use("/users", requireAdminPermission("users"), usersAdminRouter);
adminRouter.use("/properties", requireAdminPermission("properties"), propertiesAdminRouter);
adminRouter.use("/inspections", requireAdminPermission("inspections"), inspectionsAdminRouter);
adminRouter.use("/crm", requireAdminPermission("crm"), crmAdminRouter);
adminRouter.use("/email-campaigns", requireAdminPermission("email-campaigns"), emailCampaignsAdminRouter);
adminRouter.use("/analytics", requireAdminPermission("analytics"), analyticsAdminRouter);
adminRouter.use("/logs", requireAdminPermission("logs"), logsAdminRouter);
adminRouter.use("/settings", requireAdminPermission("settings"), settingsAdminRouter);
adminRouter.use("/areas", requireAdminPermission("areas"), areasAdminRouter);
adminRouter.use("/prompts", requireAdminPermission("prompts"), promptsAdminRouter);
adminRouter.use("/contact-messages", requireAdminPermission("contact-messages"), contactMessagesAdminRouter);
adminRouter.use("/newsletter", requireAdminPermission("newsletter"), newsletterAdminRouter);
adminRouter.use("/blog", requireAdminPermission("blog"), blogAdminRouter);


