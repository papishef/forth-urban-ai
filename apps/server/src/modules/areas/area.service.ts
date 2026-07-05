import type { AreaPreference } from "@forth-urban/validation";
import type { AreaDTO } from "@forth-urban/shared-types";
import { ApiError } from "../../middleware/error-handler.js";
import { Area, type AreaDocument } from "./area.model.js";

function toAreaDTO(doc: AreaDocument): AreaDTO {
  return {
    id: doc._id.toString(),
    preferenceKey: doc.preferenceKey as AreaPreference,
    areaName: doc.areaName,
    description: doc.description,
    isActive: doc.isActive,
    updatedAt: (doc.get("updatedAt") as Date).toISOString(),
  };
}

/** Lists every admin-configured area (all 6 preference keys are shown even if not yet configured elsewhere). */
export async function listAreas(): Promise<AreaDTO[]> {
  const areas = await Area.find().sort({ preferenceKey: 1 });
  return areas.map(toAreaDTO);
}

export interface UpsertAreaInput {
  preferenceKey: AreaPreference;
  areaName: string;
  description?: string;
  isActive?: boolean;
}

/** Creates or updates the area mapped to a given preference key (one row per key). */
export async function upsertArea(input: UpsertAreaInput): Promise<AreaDTO> {
  const doc = await Area.findOneAndUpdate(
    { preferenceKey: input.preferenceKey },
    {
      preferenceKey: input.preferenceKey,
      areaName: input.areaName,
      description: input.description ?? "",
      isActive: input.isActive ?? true,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
  );
  return toAreaDTO(doc);
}

/** Soft-deletes an area row by id (falls back to the hardcoded default once removed). */
export async function deleteArea(id: string): Promise<void> {
  const doc = await Area.findById(id);
  if (!doc) throw new ApiError(404, "Area not found");
  doc.set("deletedAt", new Date());
  await doc.save();
}

/**
 * Builds the `overrides` map consumed by decision-engine's
 * `matchAreaForPreference` — only active, admin-configured rows override the
 * built-in defaults.
 */
export async function getAreaOverridesMap(): Promise<Partial<Record<AreaPreference, string>>> {
  const areas = await Area.find({ isActive: true });
  const map: Partial<Record<AreaPreference, string>> = {};
  for (const area of areas) {
    map[area.preferenceKey as AreaPreference] = area.areaName;
  }
  return map;
}
