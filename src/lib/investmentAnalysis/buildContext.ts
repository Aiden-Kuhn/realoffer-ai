import { REPAIR_CATEGORIES, REPAIR_CATEGORY_LABELS } from "@/config/repairPresets";
import { missingPropertyFields } from "@/lib/property/completeness";
import { PROPERTY_TYPE_LABELS } from "@/lib/property/labels";
import type { ComparableSale, PropertyRecord } from "@/lib/property/types";
import type { RepairEstimateState } from "@/lib/calculations/repairs";
import { computeRepairTotalCents } from "@/lib/calculations/repairs";
import { DEAL_CLASSIFICATION_LABELS } from "@/config/dealClassification";
import { explainClassification } from "@/lib/calculations/explainClassification";
import { hasSufficientPropertyInfo } from "@/lib/property/completeness";
import type { DealFinancialResults } from "@/lib/calculations/types";
import type { DealAssumptions } from "@/types/deal";
import { investmentAnalysisContextSchema, type InvestmentAnalysisContext } from "@/lib/investmentAnalysis/types";

/**
 * Builds the structured, validated context object the Investment Analyst
 * (AI or rule-based) reasons over. Contains only the facts needed to
 * analyze this deal — no auth data, no API keys, no raw provider payloads,
 * no owner-contact information. This is the *only* thing ever sent to the
 * AI provider; see aiProvider.ts.
 */
export function buildInvestmentAnalysisContext(
  property: PropertyRecord,
  comparables: ComparableSale[],
  repairEstimate: RepairEstimateState,
  assumptions: DealAssumptions,
  results: DealFinancialResults,
): InvestmentAnalysisContext {
  const selected = comparables.filter((c) => c.included).map(toComparableContext);
  const excluded = comparables.filter((c) => !c.included).map(toComparableContext);

  const listPriceReducedFromOriginal =
    property.originalListPriceCents !== null &&
    property.listPriceCents !== null &&
    property.listPriceCents < property.originalListPriceCents;

  const context: InvestmentAnalysisContext = {
    property: {
      formattedAddress: property.address.formatted,
      city: property.address.city,
      state: property.address.state,
      propertyType: PROPERTY_TYPE_LABELS[property.propertyType],
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      squareFootage: property.squareFootage,
      lotSizeSqft: property.lotSizeSqft,
      yearBuilt: property.yearBuilt,
      daysOnMarket: property.daysOnMarket,
      listingStatus: property.listingStatus,
      listPriceCents: property.listPriceCents,
      originalListPriceCents: property.originalListPriceCents,
      listPriceReducedFromOriginal,
      hoaFeeCents: property.hoaFeeCents,
      lastSaleDate: property.lastSaleDate,
      lastSalePriceCents: property.lastSalePriceCents,
      taxAssessedValueCents: property.taxAssessedValueCents,
      providerAvmCents: property.currentValueCents,
      providerAvmRangeLowCents: property.valuationRangeLowCents,
      providerAvmRangeHighCents: property.valuationRangeHighCents,
      dataSource: property.source,
      confidence: property.confidence,
      missingFields: missingPropertyFields(property),
      retrievedAt: property.lastUpdated,
    },
    comparables: {
      selected,
      excluded,
      suggestedArvLowCents: property.arvLowCents,
      suggestedArvExpectedCents: property.arvExpectedCents,
      suggestedArvHighCents: property.arvHighCents,
      selectedArvCents: assumptions.arvOverrideCents ?? property.arvExpectedCents,
      arvManuallyOverridden: assumptions.arvOverrideCents !== null,
    },
    repairs: {
      estimationMethod: repairEstimate.mode,
      conditionPreset: repairEstimate.conditionPreset,
      perSqftRateCents: repairEstimate.mode === "per_sqft" ? repairEstimate.perSqftRateCents : null,
      categoryBreakdown:
        repairEstimate.mode === "category"
          ? REPAIR_CATEGORIES.filter((c) => repairEstimate.categories[c].included).map((c) => ({
              category: REPAIR_CATEGORY_LABELS[c],
              included: repairEstimate.categories[c].included,
              costCents: repairEstimate.categories[c].costCents,
              notes: repairEstimate.categories[c].notes,
            }))
          : [],
      expectedRepairTotalCents: computeRepairTotalCents(repairEstimate, property.squareFootage),
      hasInspectionInformation: false,
    },
    assumptions: {
      proposedContractPriceCents: assumptions.contractPriceCents,
      desiredAssignmentFeeCents: assumptions.desiredAssignmentFeeCents,
      investorArvPercentage: assumptions.investorArvPercentage,
      buyerClosingCostsCents: assumptions.buyerClosingCostsCents,
      holdingCostsCents: assumptions.holdingCostsCents,
      financingCostsCents: assumptions.financingCostsCents,
      sellingCostsCents: assumptions.sellingCostsCents,
      investorTargetProfitCents: assumptions.investorTargetProfitCents,
      maoMethod: assumptions.maoMethod,
    },
    calculatedOutputs: {
      maximumAllowableOfferCents: results.maximumAllowableOfferCents,
      endBuyerPurchasePriceCents: results.endBuyerPurchasePriceCents,
      totalInvestorCostsCents: results.totalInvestorCostsCents,
      allInProjectCostCents: results.allInProjectCostCents,
      projectedInvestorProfitCents: results.projectedInvestorProfitCents,
      investorReturnOnCost: results.investorReturnOnCost,
      investorMarginOnArv: results.investorMarginOnArv,
      wholesaleAssignmentSpreadCents: results.wholesaleAssignmentSpreadCents,
      breakEvenResalePriceCents: results.breakEvenResalePriceCents,
      remainingBuyerCushionCents: results.remainingBuyerCushionCents,
      dealClassification: DEAL_CLASSIFICATION_LABELS[results.dealClassification],
      dealClassificationKey: results.dealClassification,
      classificationReasons: explainClassification(results, hasSufficientPropertyInfo(property)),
    },
    sourceAndConfidence: buildSourceAndConfidence(property),
  };

  return investmentAnalysisContextSchema.parse(context);
}

function toComparableContext(comp: ComparableSale) {
  return {
    address: comp.address,
    included: comp.included,
    salePriceCents: comp.salePriceCents,
    saleDate: comp.saleDate,
    distanceMiles: comp.distanceMiles,
    squareFootage: comp.squareFootage,
    pricePerSqftCents: comp.pricePerSqftCents,
    similarityScore: comp.similarityScore,
    saleType: comp.saleType,
  };
}

function buildSourceAndConfidence(property: PropertyRecord): InvestmentAnalysisContext["sourceAndConfidence"] {
  const isDemoData = property.source !== "rentcast";

  const providerSourcedFields: string[] = [];
  const activeListingFields: string[] = [];
  const automatedEstimateFields: string[] = [];
  const calculatedFields = ["Suggested ARV range", "Maximum allowable offer", "Projected investor profit", "Deal classification"];

  if (property.bedrooms !== null) providerSourcedFields.push("Bedrooms");
  if (property.bathrooms !== null) providerSourcedFields.push("Bathrooms");
  if (property.squareFootage !== null) providerSourcedFields.push("Square footage");
  if (property.yearBuilt !== null) providerSourcedFields.push("Year built");
  if (property.lotSizeSqft !== null) providerSourcedFields.push("Lot size");
  if (property.lastSaleDate !== null) providerSourcedFields.push("Last sale");
  if (property.taxAssessedValueCents !== null) providerSourcedFields.push("Tax assessed value");

  if (property.listPriceCents !== null) activeListingFields.push("List price");
  if (property.listingStatus !== null) activeListingFields.push("Listing status");
  if (property.daysOnMarket !== null) activeListingFields.push("Days on market");
  if (property.hoaFeeCents !== null) activeListingFields.push("HOA fee");

  if (property.currentValueCents !== null) automatedEstimateFields.push("Provider automated valuation (AVM)");

  return {
    providerSourcedFields,
    activeListingFields,
    automatedEstimateFields,
    userEnteredFields: ["Proposed contract price", "Desired assignment fee", "Investor cost assumptions", "Repair estimate inputs"],
    calculatedFields,
    missingFields: missingPropertyFields(property),
    isDemoData,
  };
}
