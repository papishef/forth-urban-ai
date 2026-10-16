import { describe, expect, it } from "vitest";
import { Types } from "mongoose";
import { STORAGE_PLANS } from "@forth-urban/shared-types";
import { MediaAsset } from "./media-asset.model.js";
import { StorageSubscription } from "./storage-subscription.model.js";
import { assertWithinQuota, getStorageStatus } from "./storage-quota.service.js";

const ownerId = new Types.ObjectId();

describe("storage quota service", () => {
  it("starts with a 50MB free allowance", async () => {
    const status = await getStorageStatus();

    expect(status.planId).toBe("free");
    expect(status.totalBytes).toBe(50 * 1024 * 1024);
    expect(status.usedBytes).toBe(0);
    expect(status.availableBytes).toBe(status.totalBytes);
  });

  it("allows an upload exactly at the remaining boundary and rejects one byte over", async () => {
    const freeBytes = STORAGE_PLANS[0].storageBytes;
    await MediaAsset.create({
      url: "https://res.cloudinary.com/demo/image/upload/free.jpg",
      kind: "image",
      mimeType: "image/jpeg",
      sizeBytes: freeBytes - 1024,
      ownerType: "property",
      ownerId,
    });

    await expect(assertWithinQuota(1024)).resolves.toBeUndefined();
    await expect(assertWithinQuota(1025)).rejects.toMatchObject({ statusCode: 413 });
  });

  it("permits a replacement when the outgoing asset makes enough room", async () => {
    const freeBytes = STORAGE_PLANS[0].storageBytes;
    await MediaAsset.create({
      url: "https://res.cloudinary.com/demo/image/upload/old.jpg",
      kind: "image",
      mimeType: "image/jpeg",
      sizeBytes: freeBytes - 1024,
      ownerType: "blog",
      ownerId,
    });

    await expect(assertWithinQuota(2048, 2048)).resolves.toBeUndefined();
  });

  it("falls back to the free allowance after a paid plan expires", async () => {
    await StorageSubscription.create({
      key: "global",
      planId: "starter_5gb",
      storageBytes: STORAGE_PLANS[1].storageBytes,
      status: "active",
      autoRenew: true,
      currentPeriodEnd: new Date(Date.now() - 60_000),
    });

    const status = await getStorageStatus();

    expect(status.planId).toBe("free");
    expect(status.planLabel).toBe("Free");
    expect(status.status).toBe("past_due");
    expect(status.totalBytes).toBe(STORAGE_PLANS[0].storageBytes);
  });
});