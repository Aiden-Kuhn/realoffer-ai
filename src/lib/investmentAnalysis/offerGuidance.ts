import { SUGGESTED_OPENING_OFFER_DISCOUNT } from "@/config/investmentAnalysis";
import type { InvestmentAnalysisContext, OfferGuidance } from "@/lib/investmentAnalysis/types";

/**
 * Transparent offer guidance. The maximum recommended price is always the
 * deterministic MAO from the calculation engine — this function only adds a
 * documented discount to derive a suggested *opening* offer. It never
 * invents a number the engine didn't already produce, and it makes no
 * claim about what a seller will actually accept.
 */
export function computeOfferGuidance(context: InvestmentAnalysisContext): OfferGuidance {
  const maoCents = context.calculatedOutputs.maximumAllowableOfferCents;
  const maximumRecommendedOfferCents = Math.max(0, maoCents);
  const suggestedOpeningOfferCents = Math.max(
    0,
    Math.round(maximumRecommendedOfferCents * (1 - SUGGESTED_OPENING_OFFER_DISCOUNT)),
  );

  const listPriceCents = context.property.listPriceCents;

  return {
    suggestedOpeningOfferCents,
    maximumRecommendedOfferCents,
    existingMaoCents: maoCents,
    differenceFromListPriceCents: listPriceCents !== null ? suggestedOpeningOfferCents - listPriceCents : null,
    differenceFromProposedContractCents: maximumRecommendedOfferCents - context.assumptions.proposedContractPriceCents,
    discountBelowMaxUsed: SUGGESTED_OPENING_OFFER_DISCOUNT,
  };
}
