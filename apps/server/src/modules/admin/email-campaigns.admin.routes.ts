import { Router } from "express";
import type { AdminEmailCampaignSummaryDTO } from "@forth-urban/shared-types";
import type { ApiEnvelope } from "../../middleware/error-handler.js";
import { EmailEvent } from "../notifications/index.js";

/**
 * `GET /api/admin/email-campaigns` — Phase 7 email campaign view
 * (sent/opened/clicked/bounced per campaign, sourced from `emailEvents`).
 */
export const emailCampaignsAdminRouter: Router = Router();

emailCampaignsAdminRouter.get("/", async (_req, res, next) => {
  try {
    const rows = await EmailEvent.aggregate<{ _id: string; statuses: string[] }>([
      { $group: { _id: "$campaign", statuses: { $push: "$status" } } },
    ]);

    const items: AdminEmailCampaignSummaryDTO[] = rows
      .map((row) => ({
        campaign: row._id,
        sent: row.statuses.length,
        opened: row.statuses.filter((s) => s === "opened").length,
        clicked: row.statuses.filter((s) => s === "clicked").length,
        bounced: row.statuses.filter((s) => s === "bounced").length,
      }))
      .sort((a, b) => a.campaign.localeCompare(b.campaign));

    const body: ApiEnvelope = { success: true, message: "OK", data: items, errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});
