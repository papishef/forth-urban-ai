/**
 * Cloudinary media upload helper — Phase 3 (docs/IMPLEMENTATION_PLAN.md#phase-3
 * --property-inventory--recommendationmatching-engine).
 *
 * Phase 3 itself is seed-driven (no admin UI yet), so nothing calls
 * `uploadMedia` in this phase — it exists so the Phase 7 admin Properties CRUD
 * (photos/videos/brochure/title docs uploads) can reuse validated, configured
 * upload logic without re-deriving MIME/size rules per route.
 */
import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env.js";
import { ApiError } from "../middleware/error-handler.js";

export type MediaKind = "image" | "video" | "document";

const ALLOWED_MIME_TYPES: Record<MediaKind, string[]> = {
  image: ["image/jpeg", "image/png", "image/webp"],
  video: ["video/mp4", "video/quicktime", "video/webm"],
  document: ["application/pdf"],
};

const MAX_BYTES: Record<MediaKind, number> = {
  image: 10 * 1024 * 1024, // 10MB
  video: 100 * 1024 * 1024, // 100MB
  document: 20 * 1024 * 1024, // 20MB
};

let configured = false;

function ensureConfigured(): void {
  if (configured) return;
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new ApiError(503, "Media uploads are not configured");
  }
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
  configured = true;
}

/** Throws a 400 ApiError if the file's declared MIME type or size is not allowed for its kind. */
export function assertValidMediaUpload(kind: MediaKind, mimeType: string, sizeBytes: number): void {
  if (!ALLOWED_MIME_TYPES[kind].includes(mimeType)) {
    throw new ApiError(400, `Unsupported ${kind} type: ${mimeType}`);
  }
  if (sizeBytes > MAX_BYTES[kind]) {
    throw new ApiError(400, `${kind} file exceeds the ${MAX_BYTES[kind] / (1024 * 1024)}MB limit`);
  }
}

/** Uploads a validated file buffer to Cloudinary, returning its public URL. */
export async function uploadMedia(
  kind: MediaKind,
  buffer: Buffer,
  opts: { mimeType: string; folder: string },
): Promise<string> {
  assertValidMediaUpload(kind, opts.mimeType, buffer.byteLength);
  ensureConfigured();

  const resourceType = kind === "document" ? "raw" : kind === "video" ? "video" : "image";

  return new Promise<string>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: opts.folder, resource_type: resourceType },
      (err, result) => {
        if (err || !result) {
          reject(err ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve(result.secure_url);
      },
    );
    stream.end(buffer);
  });
}
