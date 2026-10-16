import type { StoragePlanId, StorageStatusDTO } from "@forth-urban/shared-types";
import { STORAGE_PLANS } from "@forth-urban/shared-types";
import { ApiError } from "../../middleware/error-handler.js";
import { MediaAsset } from "./media-asset.model.js";
import { StorageSubscription } from "./storage-subscription.model.js";

const GLOBAL_KEY = "global";
const FREE_PLAN_ID: StoragePlanId = "free";

function getPlan(planId: StoragePlanId) {
  return STORAGE_PLANS.find((plan) => plan.id === planId) ?? STORAGE_PLANS[0];
}

async function getOrCreateSubscription() {
  const existing = await StorageSubscription.findOne({ key: GLOBAL_KEY });
  if (existing) return existing;

  try {
    return await StorageSubscription.create({
      key: GLOBAL_KEY,
      planId: FREE_PLAN_ID,
      storageBytes: getPlan(FREE_PLAN_ID).storageBytes,
      status: "active",
      autoRenew: true,
    });
  } catch (error) {
    if ((error as { code?: number }).code !== 11000) throw error;
    return (await StorageSubscription.findOne({ key: GLOBAL_KEY }))!;
  }
}

async function getUsedStorageBytes(): Promise<number> {
  const [result] = await MediaAsset.aggregate<{ total: number }>([
    { $match: { deletedAt: null } },
    { $group: { _id: null, total: { $sum: "$sizeBytes" } } },
  ]);
  return result?.total ?? 0;
}

function hasActiveEntitlement(
  subscription: Awaited<ReturnType<typeof getOrCreateSubscription>>,
  now = new Date(),
): boolean {
  if (subscription.planId === FREE_PLAN_ID) return true;
  if (subscription.status !== "active") return false;
  return Boolean(subscription.currentPeriodEnd && subscription.currentPeriodEnd > now);
}

export async function getStorageStatus(): Promise<StorageStatusDTO> {
  const [subscription, usedBytes] = await Promise.all([getOrCreateSubscription(), getUsedStorageBytes()]);
  const storedPlanId = subscription.planId as StoragePlanId;
  const entitlementActive = hasActiveEntitlement(subscription);
  const effectivePlanId = entitlementActive ? storedPlanId : FREE_PLAN_ID;
  const plan = getPlan(effectivePlanId);
  const status = entitlementActive ? (subscription.status as StorageStatusDTO["status"]) : storedPlanId === FREE_PLAN_ID ? "active" : "past_due";
  const totalBytes = plan.storageBytes;
  const availableBytes = Math.max(0, totalBytes - usedBytes);

  return {
    usedBytes,
    totalBytes,
    availableBytes,
    usagePercent: totalBytes === 0 ? 100 : Math.min(100, (usedBytes / totalBytes) * 100),
    planId: effectivePlanId,
    planLabel: plan.label,
    planPriceNaira: plan.priceNaira,
    status,
    autoRenew: subscription.autoRenew,
    currentPeriodEnd: entitlementActive && subscription.currentPeriodEnd ? subscription.currentPeriodEnd.toISOString() : null,
    lastPaymentAt: subscription.lastPaymentAt ? subscription.lastPaymentAt.toISOString() : null,
    isOverQuota: usedBytes > totalBytes,
  };
}

export async function assertWithinQuota(incomingBytes: number, releasingBytes = 0): Promise<void> {
  if (!Number.isFinite(incomingBytes) || incomingBytes <= 0) {
    throw new ApiError(400, "Uploaded file is empty");
  }

  const [status, usedBytes] = await Promise.all([getStorageStatus(), getUsedStorageBytes()]);
  const projectedBytes = Math.max(0, usedBytes - Math.max(0, releasingBytes)) + incomingBytes;
  if (projectedBytes > status.totalBytes) {
    throw new ApiError(413, "Storage limit reached. Upgrade storage or remove an existing file to continue.", [
      { code: "STORAGE_QUOTA_EXCEEDED", usedBytes, totalBytes: status.totalBytes, incomingBytes },
    ]);
  }
}

export async function registerMediaAsset(input: {
  url: string;
  publicId?: string | null;
  kind: "image" | "video" | "document";
  mimeType: string;
  sizeBytes: number;
  ownerType: "blog" | "property";
  ownerId: string;
}): Promise<void> {
  await MediaAsset.create(input);
}

export async function releaseMediaAsset(url: string): Promise<void> {
  const asset = await MediaAsset.findOne({ url });
  if (!asset) return;
  asset.set("deletedAt", new Date());
  await asset.save();
}

export async function releaseMediaAssetsForOwner(ownerType: "blog" | "property", ownerId: string): Promise<void> {
  await MediaAsset.updateMany(
    { ownerType, ownerId, deletedAt: null },
    { $set: { deletedAt: new Date() } },
  );
}

export async function getTrackedAsset(url: string) {
  return MediaAsset.findOne({ url });
}