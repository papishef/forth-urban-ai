/**
 * Seeds sample Abuja properties for local development — Phase 3
 * (docs/IMPLEMENTATION_PLAN.md#phase-3--property-inventory--recommendationmatching-engine).
 *
 * Run with: `pnpm --filter server run seed:properties`
 *
 * Idempotent: upserts by `name` so re-running updates existing seed data
 * instead of creating duplicates. Not part of the `apps/server` TypeScript
 * build (run directly via tsx); imports server source files by relative path
 * so bare-specifier deps (mongoose, etc.) resolve from apps/server/node_modules.
 */
import { connectDatabase, disconnectDatabase } from "../apps/server/src/db/connection.js";
import { logger } from "../apps/server/src/config/logger.js";
import { Property } from "../apps/server/src/modules/properties/property.model.js";

interface SeedHiddenCostRule {
  key: string;
  label: string;
  amount: number;
  applicable: boolean;
}

const STANDARD_HIDDEN_COSTS = (overrides: Partial<Record<string, number>> = {}): SeedHiddenCostRule[] => [
  { key: "surveyFee", label: "Survey Fee", amount: overrides.surveyFee ?? 150_000, applicable: true },
  { key: "legalFee", label: "Legal / Documentation Fee", amount: overrides.legalFee ?? 300_000, applicable: true },
  {
    key: "developmentLevy",
    label: "Development Levy",
    amount: overrides.developmentLevy ?? 250_000,
    applicable: true,
  },
  { key: "deedPrepFee", label: "Deed Preparation Fee", amount: overrides.deedPrepFee ?? 100_000, applicable: true },
  {
    key: "consentStampDuty",
    label: "Consent / Stamp Duty",
    amount: overrides.consentStampDuty ?? 200_000,
    applicable: (overrides.consentStampDuty ?? 200_000) > 0,
  },
  {
    key: "allocationFee",
    label: "Allocation Fee",
    amount: overrides.allocationFee ?? 100_000,
    applicable: (overrides.allocationFee ?? 100_000) > 0,
  },
  {
    key: "serviceCharge",
    label: "Infrastructure / Service Charge",
    amount: overrides.serviceCharge ?? 0,
    applicable: (overrides.serviceCharge ?? 0) > 0,
  },
  {
    key: "inspectionLogistics",
    label: "Inspection Logistics",
    amount: overrides.inspectionLogistics ?? 50_000,
    applicable: true,
  },
];

const DEFAULT_ROI_ASSUMPTIONS = { conservative: 0.05, moderate: 0.1, optimistic: 0.15 };

const seedProperties = [
  {
    name: "Forth Urban Residency",
    estateName: "Forth Urban Residency",
    location: { address: "Kuje, Abuja", landmarks: ["Kuje Market", "Kuje General Hospital"], lat: null, lng: null },
    pricePerPlot: 12_000_000,
    plotSizes: ["300sqm", "500sqm"],
    titleType: "Governor's Consent",
    documentationStatus: "Registered Survey",
    paymentPlans: [
      { type: "installment", label: "12-month installment", minDownPaymentPercent: 30, maxDurationMonths: 12 },
      { type: "oneTime", label: "Outright payment", minDownPaymentPercent: null, maxDurationMonths: null },
    ],
    bestFitBuyerTypes: ["firstTime", "family"],
    developmentStatus: "developing",
    inspectionAvailability: { physical: true, virtual: true },
    hiddenCostRules: STANDARD_HIDDEN_COSTS(),
    roiAssumptions: DEFAULT_ROI_ASSUMPTIONS,
    media: {
      photos: ["https://example.com/properties/forth-urban-residency-1.jpg"],
      videos: [],
      googleMapsUrl: "https://maps.google.com/?q=Kuje+Abuja",
      brochureUrl: null,
      titleDocuments: [],
    },
    isActive: true,
  },
  {
    name: "Kuje Garden City",
    estateName: "Kuje Garden City",
    location: { address: "Kuje, Abuja", landmarks: ["Kuje-Gwagwalada Road"], lat: null, lng: null },
    pricePerPlot: 9_500_000,
    plotSizes: ["300sqm"],
    titleType: "Excision",
    documentationStatus: "Title in Progress",
    paymentPlans: [
      { type: "installment", label: "18-month installment", minDownPaymentPercent: 20, maxDurationMonths: 18 },
    ],
    bestFitBuyerTypes: ["firstTime"],
    developmentStatus: "planned",
    inspectionAvailability: { physical: true, virtual: true },
    hiddenCostRules: STANDARD_HIDDEN_COSTS({ allocationFee: 0 }),
    roiAssumptions: DEFAULT_ROI_ASSUMPTIONS,
    media: {
      photos: ["https://example.com/properties/kuje-garden-city-1.jpg"],
      videos: [],
      googleMapsUrl: "https://maps.google.com/?q=Kuje+Abuja",
      brochureUrl: null,
      titleDocuments: [],
    },
    isActive: true,
  },
  {
    name: "Lugbe Green Estate",
    estateName: "Lugbe Green Estate",
    location: { address: "Lugbe, Abuja", landmarks: ["Lugbe Airport Road"], lat: null, lng: null },
    pricePerPlot: 18_000_000,
    plotSizes: ["500sqm"],
    titleType: "Governor's Consent",
    documentationStatus: "Registered Survey",
    paymentPlans: [
      { type: "installment", label: "12-month installment", minDownPaymentPercent: 30, maxDurationMonths: 12 },
      { type: "oneTime", label: "Outright payment", minDownPaymentPercent: null, maxDurationMonths: null },
    ],
    bestFitBuyerTypes: ["residential", "investment"],
    developmentStatus: "serviced",
    inspectionAvailability: { physical: true, virtual: true },
    hiddenCostRules: STANDARD_HIDDEN_COSTS({ serviceCharge: 75_000 }),
    roiAssumptions: DEFAULT_ROI_ASSUMPTIONS,
    media: {
      photos: ["https://example.com/properties/lugbe-green-estate-1.jpg"],
      videos: [],
      googleMapsUrl: "https://maps.google.com/?q=Lugbe+Abuja",
      brochureUrl: null,
      titleDocuments: [],
    },
    isActive: true,
  },
  {
    name: "Lugbe Heights",
    estateName: "Lugbe Heights",
    location: { address: "Lugbe, Abuja", landmarks: ["Lugbe District"], lat: null, lng: null },
    pricePerPlot: 22_000_000,
    plotSizes: ["500sqm", "1000sqm"],
    titleType: "Certificate of Occupancy",
    documentationStatus: "Fully Documented",
    paymentPlans: [
      { type: "installment", label: "24-month installment", minDownPaymentPercent: 25, maxDurationMonths: 24 },
    ],
    bestFitBuyerTypes: ["investment"],
    developmentStatus: "developing",
    inspectionAvailability: { physical: true, virtual: true },
    hiddenCostRules: STANDARD_HIDDEN_COSTS(),
    roiAssumptions: { conservative: 0.06, moderate: 0.12, optimistic: 0.18 },
    media: {
      photos: ["https://example.com/properties/lugbe-heights-1.jpg"],
      videos: [],
      googleMapsUrl: "https://maps.google.com/?q=Lugbe+Abuja",
      brochureUrl: null,
      titleDocuments: [],
    },
    isActive: true,
  },
  {
    name: "Guzape II Royal Gardens",
    estateName: "Guzape II Royal Gardens",
    location: { address: "Guzape II, Abuja", landmarks: ["Guzape District"], lat: null, lng: null },
    pricePerPlot: 85_000_000,
    plotSizes: ["1000sqm"],
    titleType: "Certificate of Occupancy",
    documentationStatus: "Fully Documented",
    paymentPlans: [{ type: "oneTime", label: "Outright payment", minDownPaymentPercent: null, maxDurationMonths: null }],
    bestFitBuyerTypes: ["residential", "investment"],
    developmentStatus: "completed",
    inspectionAvailability: { physical: true, virtual: true },
    hiddenCostRules: STANDARD_HIDDEN_COSTS({ serviceCharge: 500_000 }),
    roiAssumptions: DEFAULT_ROI_ASSUMPTIONS,
    media: {
      photos: ["https://example.com/properties/guzape-ii-royal-gardens-1.jpg"],
      videos: [],
      googleMapsUrl: "https://maps.google.com/?q=Guzape+II+Abuja",
      brochureUrl: null,
      titleDocuments: [],
    },
    isActive: true,
  },
  {
    name: "Guzape II Diplomatic Estate",
    estateName: "Guzape II Diplomatic Estate",
    location: { address: "Guzape II, Abuja", landmarks: ["Diplomatic Zone"], lat: null, lng: null },
    pricePerPlot: 120_000_000,
    plotSizes: ["1000sqm", "2000sqm"],
    titleType: "Certificate of Occupancy",
    documentationStatus: "Fully Documented",
    paymentPlans: [{ type: "oneTime", label: "Outright payment", minDownPaymentPercent: null, maxDurationMonths: null }],
    bestFitBuyerTypes: ["diaspora", "investment"],
    developmentStatus: "serviced",
    inspectionAvailability: { physical: true, virtual: true },
    hiddenCostRules: STANDARD_HIDDEN_COSTS({ serviceCharge: 750_000 }),
    roiAssumptions: { conservative: 0.06, moderate: 0.11, optimistic: 0.17 },
    media: {
      photos: ["https://example.com/properties/guzape-ii-diplomatic-estate-1.jpg"],
      videos: [],
      googleMapsUrl: "https://maps.google.com/?q=Guzape+II+Abuja",
      brochureUrl: null,
      titleDocuments: [],
    },
    isActive: true,
  },
  {
    name: "Lokogoma Family Court",
    estateName: "Lokogoma Family Court",
    location: { address: "Lokogoma, Abuja", landmarks: ["Lokogoma District"], lat: null, lng: null },
    pricePerPlot: 25_000_000,
    plotSizes: ["500sqm"],
    titleType: "Governor's Consent",
    documentationStatus: "Registered Survey",
    paymentPlans: [
      { type: "installment", label: "18-month installment", minDownPaymentPercent: 25, maxDurationMonths: 18 },
    ],
    bestFitBuyerTypes: ["family", "residential"],
    developmentStatus: "planned",
    inspectionAvailability: { physical: true, virtual: true },
    hiddenCostRules: STANDARD_HIDDEN_COSTS(),
    roiAssumptions: DEFAULT_ROI_ASSUMPTIONS,
    media: {
      photos: ["https://example.com/properties/lokogoma-family-court-1.jpg"],
      videos: [],
      googleMapsUrl: "https://maps.google.com/?q=Lokogoma+Abuja",
      brochureUrl: null,
      titleDocuments: [],
    },
    isActive: true,
  },
  {
    name: "Lokogoma Riverside",
    estateName: "Lokogoma Riverside",
    location: { address: "Lokogoma, Abuja", landmarks: ["Lokogoma River"], lat: null, lng: null },
    pricePerPlot: 30_000_000,
    plotSizes: ["500sqm", "1000sqm"],
    titleType: "Certificate of Occupancy",
    documentationStatus: "Fully Documented",
    paymentPlans: [
      { type: "installment", label: "24-month installment", minDownPaymentPercent: 30, maxDurationMonths: 24 },
      { type: "oneTime", label: "Outright payment", minDownPaymentPercent: null, maxDurationMonths: null },
    ],
    bestFitBuyerTypes: ["family", "residential"],
    developmentStatus: "developing",
    inspectionAvailability: { physical: true, virtual: true },
    hiddenCostRules: STANDARD_HIDDEN_COSTS({ serviceCharge: 100_000 }),
    roiAssumptions: DEFAULT_ROI_ASSUMPTIONS,
    media: {
      photos: ["https://example.com/properties/lokogoma-riverside-1.jpg"],
      videos: [],
      googleMapsUrl: "https://maps.google.com/?q=Lokogoma+Abuja",
      brochureUrl: null,
      titleDocuments: [],
    },
    isActive: true,
  },
];

async function seed(): Promise<void> {
  await connectDatabase();

  for (const property of seedProperties) {
    await Property.findOneAndUpdate({ name: property.name }, property, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
      runValidators: true,
    });
    logger.info({ name: property.name }, "Upserted property");
  }

  logger.info({ count: seedProperties.length }, "Property seed complete");
  await disconnectDatabase();
}

seed().catch((err: unknown) => {
  logger.error({ err }, "Property seed failed");
  process.exitCode = 1;
});
