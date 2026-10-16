import { BlogPost } from "../blog/blog-post.model.js";
import { Property } from "../properties/property.model.js";
import { getMediaSizeByUrl, type MediaKind } from "../../lib/cloudinary.util.js";
import { logger } from "../../config/logger.js";
import { MediaAsset } from "./media-asset.model.js";
import { registerMediaAsset } from "./storage-quota.service.js";

interface LegacyAsset {
  url: string;
  kind: MediaKind;
  mimeType: string;
  ownerType: "blog" | "property";
  ownerId: string;
}

function addAsset(assets: LegacyAsset[], url: string | null | undefined, input: Omit<LegacyAsset, "url">): void {
  if (url) assets.push({ url, ...input });
}

export async function reconcileStorageAssets(): Promise<void> {
  const [posts, properties] = await Promise.all([BlogPost.find(), Property.find()]);
  const assets: LegacyAsset[] = [];

  for (const post of posts) {
    addAsset(assets, post.coverImageUrl, {
      kind: "image",
      mimeType: "image/jpeg",
      ownerType: "blog",
      ownerId: post._id.toString(),
    });
  }

  for (const property of properties) {
    const media = property.media!;
    media.photos.forEach((url) => addAsset(assets, url, { kind: "image", mimeType: "image/jpeg", ownerType: "property", ownerId: property._id.toString() }));
    media.videos.forEach((url) => addAsset(assets, url, { kind: "video", mimeType: "video/mp4", ownerType: "property", ownerId: property._id.toString() }));
    addAsset(assets, media.brochureUrl, { kind: "document", mimeType: "application/pdf", ownerType: "property", ownerId: property._id.toString() });
    media.titleDocuments.forEach((url) => addAsset(assets, url, { kind: "document", mimeType: "application/pdf", ownerType: "property", ownerId: property._id.toString() }));
  }

  let reconciled = 0;
  for (const asset of assets) {
    if (await MediaAsset.findOne({ url: asset.url })) continue;
    const sizeBytes = await getMediaSizeByUrl(asset.kind, asset.url);
    if (!sizeBytes) continue;
    await registerMediaAsset({ ...asset, sizeBytes });
    reconciled += 1;
  }

  if (reconciled > 0) logger.info({ reconciled }, "Reconciled legacy Cloudinary assets into storage ledger");
}