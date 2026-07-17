import { z } from "zod";

/**
 * Everything in this file describes data that flows in one direction:
 *
 *   RentCast/demo provider data -> user assumptions -> the existing
 *   deterministic calculation engine -> InvestmentAnalysisContext ->
 *   deterministic score/recommendation/offer/sensitivity -> AI explanation.
 *
 * The AI never receives raw provider payloads, secrets, or PII, and its
 * validated output never includes a number the deterministic engine didn't
 * already produce — see aiProvider.ts and ruleBasedProvider.ts.
 */

// ---------------------------------------------------------------------------
// Structured input — InvestmentAnalysisContext
// ---------------------------------------------------------------------------

const propertyContextSchema = z.object({
  formattedAddress: z.string(),
  city: z.string(),
  state: z.string(),
  propertyType: z.string(),
  bedrooms: z.number().nullable(),
  bathrooms: z.number().nullable(),
  squareFootage: z.number().nullable(),
  lotSizeSqft: z.number().nullable(),
  yearBuilt: z.number().nullable(),
  daysOnMarket: z.number().nullable(),
  listingStatus: z.string().nullable(),
  listPriceCents: z.number().nullable(),
  originalListPriceCents: z.number().nullable(),
  listPriceReducedFromOriginal: z.boolean(),
  hoaFeeCents: z.number().nullable(),
  lastSaleDate: z.string().nullable(),
  lastSalePriceCents: z.number().nullable(),
  taxAssessedValueCents: z.number().nullable(),
  providerAvmCents: z.number().nullable(),
  providerAvmRangeLowCents: z.number().nullable(),
  providerAvmRangeHighCents: z.number().nullable(),
  dataSource: z.enum(["rentcast", "simulated"]),
  confidence: z.enum(["high", "medium", "low"]),
  missingFields: z.array(z.string()),
  retrievedAt: z.string(),
});

const comparableContextSchema = z.object({
  address: z.string(),
  included: z.boolean(),
  salePriceCents: z.number(),
  saleDate: z.string(),
  distanceMiles: z.number(),
  squareFootage: z.number(),
  pricePerSqftCents: z.number(),
  similarityScore: z.number(),
  saleType: z.enum(["sold", "active_listing", "unknown"]),
});

const comparablesContextSchema = z.object({
  selected: z.array(comparableContextSchema),
  excluded: z.array(comparableContextSchema),
  suggestedArvLowCents: z.number(),
  suggestedArvExpectedCents: z.number(),
  suggestedArvHighCents: z.number(),
  selectedArvCents: z.number(),
  arvManuallyOverridden: z.boolean(),
});

const repairsContextSchema = z.object({
  estimationMethod: z.enum(["per_sqft", "category", "manual"]),
  conditionPreset: z.string(),
  perSqftRateCents: z.number().nullable(),
  categoryBreakdown: z.array(z.object({ category: z.string(), included: z.boolean(), costCents: z.number(), notes: z.string() })),
  expectedRepairTotalCents: z.number(),
  hasInspectionInformation: z.literal(false),
});

const assumptionsContextSchema = z.object({
  proposedContractPriceCents: z.number(),
  desiredAssignmentFeeCents: z.number(),
  investorArvPercentage: z.number(),
  buyerClosingCostsCents: z.number(),
  holdingCostsCents: z.number(),
  financingCostsCents: z.number(),
  sellingCostsCents: z.number(),
  investorTargetProfitCents: z.number(),
  maoMethod: z.enum(["PERCENTAGE_OF_ARV", "TARGET_PROFIT"]),
});

const calculatedOutputsContextSchema = z.object({
  maximumAllowableOfferCents: z.number(),
  endBuyerPurchasePriceCents: z.number(),
  totalInvestorCostsCents: z.number(),
  allInProjectCostCents: z.number(),
  projectedInvestorProfitCents: z.number(),
  investorReturnOnCost: z.number(),
  investorMarginOnArv: z.number(),
  wholesaleAssignmentSpreadCents: z.number(),
  breakEvenResalePriceCents: z.number(),
  remainingBuyerCushionCents: z.number(),
  dealClassification: z.string(),
  dealClassificationKey: z.enum(["strong_margin", "potential_deal", "thin_margin", "does_not_meet_targets", "insufficient_information"]),
  classificationReasons: z.array(z.string()),
});

const sourceAndConfidenceContextSchema = z.object({
  providerSourcedFields: z.array(z.string()),
  activeListingFields: z.array(z.string()),
  automatedEstimateFields: z.array(z.string()),
  userEnteredFields: z.array(z.string()),
  calculatedFields: z.array(z.string()),
  missingFields: z.array(z.string()),
  isDemoData: z.boolean(),
});

export const investmentAnalysisContextSchema = z.object({
  property: propertyContextSchema,
  comparables: comparablesContextSchema,
  repairs: repairsContextSchema,
  assumptions: assumptionsContextSchema,
  calculatedOutputs: calculatedOutputsContextSchema,
  sourceAndConfidence: sourceAndConfidenceContextSchema,
});

export type InvestmentAnalysisContext = z.infer<typeof investmentAnalysisContextSchema>;

// ---------------------------------------------------------------------------
// Deterministic outputs — never produced by the AI
// ---------------------------------------------------------------------------

export type DealScoreBreakdownItem = {
  component: string;
  pointsEarned: number;
  pointsPossible: number;
  explanation: string;
};

export type RealOfferDealScore = {
  score: number;
  label: import("@/config/investmentAnalysis").DealScoreLabel;
  labelText: string;
  breakdown: DealScoreBreakdownItem[];
};

export type RecommendationKey =
  | "pursue_at_current_assumptions"
  | "pursue_if_negotiated_lower"
  | "verify_repairs_and_comparables"
  | "insufficient_information"
  | "does_not_meet_targets";

export type DeterministicRecommendation = {
  recommendation: RecommendationKey;
  recommendationLabel: string;
  reasons: string[];
  keyAssumptions: string[];
  whatWouldChangeThis: string[];
  requiresVerification: string[];
};

export type OfferGuidance = {
  suggestedOpeningOfferCents: number;
  maximumRecommendedOfferCents: number;
  existingMaoCents: number;
  differenceFromListPriceCents: number | null;
  differenceFromProposedContractCents: number;
  discountBelowMaxUsed: number;
};

export type SensitivityScenarioKey =
  | "base"
  | "conservative"
  | "optimistic"
  | "repairsUp10"
  | "repairsUp20"
  | "arvDown5"
  | "arvDown10"
  | "holdingCostsUp50"
  | "contractAtMao"
  | "contractAtSuggestedOffer";

export type SensitivityScenarioResult = {
  key: SensitivityScenarioKey;
  label: string;
  description: string;
  arvCents: number;
  repairCostCents: number;
  contractPriceCents: number;
  projectedInvestorProfitCents: number;
  maximumAllowableOfferCents: number;
  remainingBuyerCushionCents: number;
  investorReturnOnCost: number;
  dealClassification: string;
};

export type SensitivityAnalysis = {
  scenarios: SensitivityScenarioResult[];
};

// ---------------------------------------------------------------------------
// AI-generated narrative — validated, never trusted for numbers
// ---------------------------------------------------------------------------

/** What we ask the model to return. Deliberately contains no financial
 * numbers, scores, or recommendation enums — those are always ours. */
export const aiNarrativeSchema = z.object({
  executiveSummary: z.string().min(1).max(700),
  strengths: z.array(z.string().min(1).max(240)).max(6),
  risks: z.array(z.string().min(1).max(240)).max(6),
  missingInformation: z.array(z.string().min(1).max(240)).max(6),
  priceAnalysis: z.string().min(1).max(500),
  repairAnalysis: z.string().min(1).max(500),
  arvAnalysis: z.string().min(1).max(500),
  comparableAnalysis: z.string().min(1).max(500),
  negotiationPoints: z.array(z.string().min(1).max(240)).max(6),
  nextSteps: z.array(z.string().min(1).max(240)).max(6),
  confidence: z.enum(["high", "medium", "low"]),
  confidenceReasons: z.array(z.string().min(1).max(240)).max(4),
  warnings: z.array(z.string().min(1).max(240)).max(4),
});

export type AiNarrative = z.infer<typeof aiNarrativeSchema>;

export type InvestmentAnalysisSource = "ai" | "rule_based";

/** The single object the UI renders — deterministic facts merged with
 * either AI narrative text or the rule-based equivalent. */
export type InvestmentAnalysisResult = {
  dealScore: RealOfferDealScore;
  recommendation: DeterministicRecommendation;
  offerGuidance: OfferGuidance;
  sensitivity: SensitivityAnalysis;
  narrative: AiNarrative;
  source: InvestmentAnalysisSource;
  provider: string | null;
  model: string | null;
  generatedAt: string;
  analysisVersion: number;
  inputHash: string;
};

export type CachedAnalysisOrigin = "cache" | "ai" | "rule_based";
