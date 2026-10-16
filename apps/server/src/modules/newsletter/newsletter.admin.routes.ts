import { Router } from "express";
import type { NewsletterSubscriberDTO, PaginatedResultDTO } from "@forth-urban/shared-types";
import type { ApiEnvelope } from "../../middleware/error-handler.js";
import { NewsletterSubscriber, toNewsletterSubscriberDTO } from "./newsletter-subscriber.model.js";

export const newsletterAdminRouter: Router = Router();

function parsePagination(query: Record<string, unknown>): { page: number; limit: number; status?: string } {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const status = typeof query.status === "string" && query.status ? query.status : undefined;
  return { page, limit, status };
}

newsletterAdminRouter.get("/", async (req, res, next) => {
  try {
    const { page, limit, status } = parsePagination(req.query as Record<string, unknown>);
    const filter = status ? { status } : {};

    const [subscribers, total, confirmedCount, pendingCount, unsubscribedCount] = await Promise.all([
      NewsletterSubscriber.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      NewsletterSubscriber.countDocuments(filter),
      NewsletterSubscriber.countDocuments({ status: "confirmed" }),
      NewsletterSubscriber.countDocuments({ status: "pending" }),
      NewsletterSubscriber.countDocuments({ status: "unsubscribed" }),
    ]);

    const data: PaginatedResultDTO<NewsletterSubscriberDTO> & {
      counts: { confirmed: number; pending: number; unsubscribed: number; total: number };
    } = {
      items: subscribers.map(toNewsletterSubscriberDTO),
      total,
      page,
      limit,
      counts: {
        confirmed: confirmedCount,
        pending: pendingCount,
        unsubscribed: unsubscribedCount,
        total: confirmedCount + pendingCount + unsubscribedCount,
      },
    };

    const body: ApiEnvelope = { success: true, message: "OK", data, errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});
