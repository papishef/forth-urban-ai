import type { PropertyDTO, PropertyListItemDTO } from "@forth-urban/shared-types";
import type { PropertyDocument } from "./property.model.js";

/** Maps a Mongoose Property document to the lightweight list/card DTO. */
export function toPropertyListItemDTO(property: PropertyDocument): PropertyListItemDTO {
  const location = property.location!;
  return {
    id: property._id.toString(),
    name: property.name,
    estateName: property.estateName,
    location: {
      address: location.address,
      landmarks: location.landmarks ?? [],
      lat: location.lat ?? null,
      lng: location.lng ?? null,
    },
    pricePerPlot: property.pricePerPlot,
    plotSizes: property.plotSizes,
    developmentStatus: property.developmentStatus,
    bestFitBuyerTypes: property.bestFitBuyerTypes,
    coverPhoto: property.media!.photos?.[0] ?? null,
  };
}

/** Maps a Mongoose Property document to the full detail DTO (property detail page). */
export function toPropertyDTO(property: PropertyDocument): PropertyDTO {
  const inspectionAvailability = property.inspectionAvailability!;
  const roiAssumptions = property.roiAssumptions!;
  const media = property.media!;

  return {
    ...toPropertyListItemDTO(property),
    titleType: property.titleType,
    documentationStatus: property.documentationStatus,
    paymentPlans: property.paymentPlans.map((plan) => ({
      type: plan.type,
      label: plan.label,
      minDownPaymentPercent: plan.minDownPaymentPercent ?? null,
      maxDurationMonths: plan.maxDurationMonths ?? null,
    })),
    inspectionAvailability: { physical: inspectionAvailability.physical, virtual: inspectionAvailability.virtual },
    hiddenCostRules: property.hiddenCostRules.map((rule) => ({
      key: rule.key,
      label: rule.label,
      amount: rule.amount,
      applicable: rule.applicable,
    })),
    roiAssumptions: {
      conservative: roiAssumptions.conservative,
      moderate: roiAssumptions.moderate,
      optimistic: roiAssumptions.optimistic,
    },
    media: {
      photos: media.photos ?? [],
      videos: media.videos ?? [],
      googleMapsUrl: media.googleMapsUrl ?? null,
      brochureUrl: media.brochureUrl ?? null,
      titleDocuments: media.titleDocuments ?? [],
    },
    isActive: property.isActive,
  };
}
