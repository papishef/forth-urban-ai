import { Router } from "express";
import {
  adminMediaDeleteSchema,
  adminMediaUploadSchema,
  adminPropertyInputSchema,
  adminPropertyUpdateSchema,
} from "@forth-urban/validation";
import type { PaginatedResultDTO, PropertyDTO } from "@forth-urban/shared-types";
import { ApiError, type ApiEnvelope } from "../../middleware/error-handler.js";
import { validateBody } from "../../middleware/validate.js";
import { recordAuditLog } from "../../lib/audit-log.service.js";
import { deleteMediaByUrl, uploadMedia, type MediaKind } from "../../lib/cloudinary.util.js";
import { Property, toPropertyDTO } from "../properties/index.js";

/**
 * `GET/POST/PATCH/DELETE /api/admin/properties` — Phase 7 admin Properties
 * CRUD (docs/IMPLEMENTATION_PLAN.md#phase-7--admin-dashboard). Lists include
 * inactive/soft-deleted-excluded properties (unlike the public
 * `GET /api/properties`, which filters to `isActive: true` only).
 */
export const propertiesAdminRouter: Router = Router();

function parsePagination(query: Record<string, unknown>): { page: number; limit: number } {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  return { page, limit };
}

propertiesAdminRouter.get("/", async (req, res, next) => {
  try {
    const { page, limit } = parsePagination(req.query as Record<string, unknown>);
    const [properties, total] = await Promise.all([
      Property.find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Property.countDocuments(),
    ]);

    const data: PaginatedResultDTO<PropertyDTO> = {
      items: properties.map(toPropertyDTO),
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

propertiesAdminRouter.get("/:id", async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) throw new ApiError(404, "Property not found");
    const body: ApiEnvelope = { success: true, message: "OK", data: toPropertyDTO(property), errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

propertiesAdminRouter.post("/", validateBody(adminPropertyInputSchema), async (req, res, next) => {
  try {
    const property = await Property.create(req.body);

    await recordAuditLog({
      actorId: req.auth!.sub,
      actorType: "admin",
      action: "admin.property.created",
      targetType: "Property",
      targetId: property._id.toString(),
    });

    const body: ApiEnvelope = { success: true, message: "Property created", data: toPropertyDTO(property), errors: null };
    res.status(201).json(body);
  } catch (err) {
    next(err);
  }
});

propertiesAdminRouter.patch("/:id", validateBody(adminPropertyUpdateSchema), async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) throw new ApiError(404, "Property not found");

    property.set(req.body);
    await property.save();

    await recordAuditLog({
      actorId: req.auth!.sub,
      actorType: "admin",
      action: "admin.property.updated",
      targetType: "Property",
      targetId: property._id.toString(),
      metadata: { fields: Object.keys(req.body) },
    });

    const body: ApiEnvelope = { success: true, message: "Property updated", data: toPropertyDTO(property), errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

propertiesAdminRouter.delete("/:id", async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) throw new ApiError(404, "Property not found");

    property.set("deletedAt", new Date());
    await property.save();

    await recordAuditLog({
      actorId: req.auth!.sub,
      actorType: "admin",
      action: "admin.property.deleted",
      targetType: "Property",
      targetId: property._id.toString(),
    });

    const body: ApiEnvelope = { success: true, message: "Property removed", data: null, errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

/**
 * Media upload — accepts base64-encoded file data in the JSON body rather
 * than multipart/form-data (no `multer` dependency needed; Cloudinary's
 * `upload_stream` already takes a raw `Buffer`, decoded here). See
 * ../../lib/cloudinary.util.ts.
 */
propertiesAdminRouter.post("/:id/media", validateBody(adminMediaUploadSchema), async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) throw new ApiError(404, "Property not found");

    const { kind, field, mimeType, base64Data } = req.body as {
      kind: "image" | "video" | "document";
      field: "photos" | "videos" | "brochureUrl" | "titleDocuments";
      mimeType: string;
      base64Data: string;
    };
    const buffer = Buffer.from(base64Data, "base64");
    const url = await uploadMedia(kind, buffer, { mimeType, folder: `properties/${property._id.toString()}` });

    const media = property.media!;
    if (field === "brochureUrl") {
      media.brochureUrl = url;
    } else {
      (media[field] as string[]).push(url);
    }
    property.set("media", media);
    await property.save();

    await recordAuditLog({
      actorId: req.auth!.sub,
      actorType: "admin",
      action: "admin.property.media_uploaded",
      targetType: "Property",
      targetId: property._id.toString(),
      metadata: { field, kind },
    });

    const body: ApiEnvelope = { success: true, message: "Media uploaded", data: toPropertyDTO(property), errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

/**
 * Media removal — deletes the asset from Cloudinary storage (best-effort;
 * see cloudinary.util.ts) and removes its URL from the property document.
 * Used by the admin edit form so photos/videos/documents staged before this
 * feature existed can still be cleaned up without recreating the property.
 */
propertiesAdminRouter.delete("/:id/media", validateBody(adminMediaDeleteSchema), async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) throw new ApiError(404, "Property not found");

    const { field, url } = req.body as {
      field: "photos" | "videos" | "brochureUrl" | "titleDocuments";
      url: string;
    };
    const media = property.media!;

    if (field === "brochureUrl") {
      if (media.brochureUrl !== url) throw new ApiError(404, "Media not found on this property");
      media.brochureUrl = null;
    } else {
      const list = media[field] as string[];
      const index = list.indexOf(url);
      if (index === -1) throw new ApiError(404, "Media not found on this property");
      list.splice(index, 1);
    }
    property.set("media", media);
    await property.save();

    const kind: MediaKind = field === "videos" ? "video" : field === "photos" ? "image" : "document";
    await deleteMediaByUrl(kind, url);

    await recordAuditLog({
      actorId: req.auth!.sub,
      actorType: "admin",
      action: "admin.property.media_deleted",
      targetType: "Property",
      targetId: property._id.toString(),
      metadata: { field },
    });

    const body: ApiEnvelope = { success: true, message: "Media removed", data: toPropertyDTO(property), errors: null };
    res.json(body);
  } catch (err) {
    next(err);
  }
});
