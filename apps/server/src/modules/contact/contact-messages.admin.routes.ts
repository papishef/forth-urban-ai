import { Router } from "express";
import { adminUpdateContactMessageSchema } from "@forth-urban/validation";
import type { ContactMessageDTO, PaginatedResultDTO } from "@forth-urban/shared-types";
import { ApiError, type ApiEnvelope } from "../../middleware/error-handler.js";
import { validateBody } from "../../middleware/validate.js";
import { requireAdminPermission } from "../auth/permissions.js";
import { ContactMessage, toContactMessageDTO } from "./contact-message.model.js";

export const contactMessagesAdminRouter: Router = Router();

function parsePagination(query: Record<string, unknown>): { page: number; limit: number; status?: string } {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const status = typeof query.status === "string" && query.status ? query.status : undefined;
  return { page, limit, status };
}

contactMessagesAdminRouter.get("/", async (req, res, next) => {
  try {
    const { page, limit, status } = parsePagination(req.query as Record<string, unknown>);
    const filter = status ? { status } : {};

    const [messages, total] = await Promise.all([
      ContactMessage.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      ContactMessage.countDocuments(filter),
    ]);

    const data: PaginatedResultDTO<ContactMessageDTO> = {
      items: messages.map(toContactMessageDTO),
      total,
      page,
      limit,
    };

    const body: ApiEnvelope = { success: true, message: "OK", data, errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

contactMessagesAdminRouter.get("/:id", async (req, res, next) => {
  try {
    const message = await ContactMessage.findById(req.params.id);
    if (!message) throw new ApiError(404, "Contact message not found");
    const body: ApiEnvelope = { success: true, message: "OK", data: toContactMessageDTO(message), errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

contactMessagesAdminRouter.patch("/:id", requireAdminPermission("contact-messages", "write"), validateBody(adminUpdateContactMessageSchema), async (req, res, next) => {
  try {
    const message = await ContactMessage.findById(req.params.id);
    if (!message) throw new ApiError(404, "Contact message not found");

    if (req.body.status) {
      message.status = req.body.status;
    }
    await message.save();

    const body: ApiEnvelope = { success: true, message: "Status updated", data: toContactMessageDTO(message), errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});
