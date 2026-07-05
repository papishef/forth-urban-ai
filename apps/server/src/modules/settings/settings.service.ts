import type { SettingsDTO } from "@forth-urban/shared-types";
import { Settings, type SettingsDocument } from "./settings.model.js";

function toSettingsDTO(doc: SettingsDocument): SettingsDTO {
  const weights = doc.propertyMatchWeights!;
  const roi = doc.roiAssumptionDefaults!;
  return {
    propertyMatchWeights: {
      budget: weights.budget,
      area: weights.area,
      buyerGoal: weights.buyerGoal,
      paymentStyle: weights.paymentStyle,
      lifestyle: weights.lifestyle,
    },
    roiAssumptionDefaults: {
      conservative: roi.conservative,
      moderate: roi.moderate,
      optimistic: roi.optimistic,
    },
    updatedAt: (doc.get("updatedAt") as Date).toISOString(),
  };
}

/** Fetches the single global settings document, creating it with defaults on first use. */
export async function getSettingsDocument(): Promise<SettingsDocument> {
  const existing = await Settings.findOne({ key: "global" });
  if (existing) return existing;
  return Settings.create({ key: "global" });
}

export async function getSettings(): Promise<SettingsDTO> {
  return toSettingsDTO(await getSettingsDocument());
}

export interface UpdateSettingsInput {
  propertyMatchWeights?: Partial<SettingsDTO["propertyMatchWeights"]>;
  roiAssumptionDefaults?: Partial<SettingsDTO["roiAssumptionDefaults"]>;
}

export async function updateSettings(patch: UpdateSettingsInput): Promise<SettingsDTO> {
  const doc = await getSettingsDocument();
  const weights = doc.propertyMatchWeights!;
  const roi = doc.roiAssumptionDefaults!;

  if (patch.propertyMatchWeights) {
    doc.set("propertyMatchWeights", {
      budget: patch.propertyMatchWeights.budget ?? weights.budget,
      area: patch.propertyMatchWeights.area ?? weights.area,
      buyerGoal: patch.propertyMatchWeights.buyerGoal ?? weights.buyerGoal,
      paymentStyle: patch.propertyMatchWeights.paymentStyle ?? weights.paymentStyle,
      lifestyle: patch.propertyMatchWeights.lifestyle ?? weights.lifestyle,
    });
  }
  if (patch.roiAssumptionDefaults) {
    doc.set("roiAssumptionDefaults", {
      conservative: patch.roiAssumptionDefaults.conservative ?? roi.conservative,
      moderate: patch.roiAssumptionDefaults.moderate ?? roi.moderate,
      optimistic: patch.roiAssumptionDefaults.optimistic ?? roi.optimistic,
    });
  }
  await doc.save();
  return toSettingsDTO(doc);
}
