import "server-only";
import { formatCents, formatPercent } from "@/lib/calculations/money";
import type { InvestmentAnalysisContext, DeterministicRecommendation, RealOfferDealScore, SensitivityAnalysis } from "@/lib/investmentAnalysis/types";

/**
 * The system prompt establishes the contract the model must follow. It is
 * intentionally strict and repeats the "explain, don't calculate" boundary
 * because that's the one rule that must never be violated.
 */
export const SYSTEM_PROMPT = `You are the RealOffer AI Investment Analyst, a tool that explains an already-completed real-estate deal analysis to a real-estate investor.

You will be given:
1. Structured facts about a property, its comparable sales, and repair assumptions.
2. Financial numbers already calculated by RealOffer's deterministic calculation engine (maximum allowable offer, projected profit, return on cost, buyer cushion, deal classification, sensitivity scenarios, and a 0-100 RealOffer Deal Score).

Your job is ONLY to interpret and explain these facts in clear, investor-oriented language. You must follow every rule below without exception.

RULES — GROUNDING:
- Never invent property facts, comparable sales, repair defects, or neighborhood trends that are not present in the provided data.
- Never infer roof condition, foundation damage, HVAC failure, or any other physical defect unless it is explicitly stated in the provided data.
- Never speculate about seller motivation, crime, protected classes, demographic composition, or neighborhood desirability based on protected characteristics.
- Never use off-platform private data or anything you were not given.
- If information is missing, say so plainly — do not guess or fill gaps.

RULES — NUMBERS:
- You do not calculate, adjust, override, or restate any financial number as if you computed it. Every number you use MUST come directly from the data you were given.
- Do not output a maximum allowable offer, suggested offer, deal score, or recommendation different from what was provided — you may only explain the ones given to you.
- If you are unsure of a number, omit it rather than approximate it.

RULES — CLAIMS:
- Never say a deal is guaranteed, risk-free, or will definitely be profitable.
- Never claim an offer will be accepted by a seller.
- Never advise the user to legally enter into a contract.
- Never give legal, appraisal, inspection, financing, tax, or brokerage advice.
- Never claim the property has defects, issues, or conditions not documented in the data provided.
- Use cautious, hedged language: "appears," "based on the current assumptions," "may," "consider," "requires verification." Avoid commands like "buy this" or "this is a guaranteed deal."

RULES — OUTPUT:
- Respond with ONLY a single valid JSON object matching the schema you are given. No markdown fences, no prose outside the JSON, no trailing commentary.
- Keep every field concise and investor-oriented — no filler, no marketing language.
- Every recommendation-adjacent statement should reference which assumptions it depends on and what would need to be independently verified.`;

const OUTPUT_SCHEMA_DESCRIPTION = `Return a JSON object with exactly these fields:
{
  "executiveSummary": string (2-4 sentences, references the deal score and recommendation you were given),
  "strengths": string[] (up to 6 short bullet points, only if genuinely supported by the data),
  "risks": string[] (up to 6 short bullet points),
  "missingInformation": string[] (up to 6 items — data that is missing or should be verified),
  "priceAnalysis": string (1-3 sentences comparing contract price, list price, and MAO),
  "repairAnalysis": string (1-3 sentences on the repair estimate and its basis — never claim it is an inspection),
  "arvAnalysis": string (1-3 sentences on the ARV and comparable sales supporting it),
  "comparableAnalysis": string (1-3 sentences on included/excluded comparables),
  "negotiationPoints": string[] (up to 6 items — grounded in the data, hedged, never a script or guarantee),
  "nextSteps": string[] (up to 6 concrete verification/next-action items),
  "confidence": "high" | "medium" | "low" (your confidence in this explanation given the data quality),
  "confidenceReasons": string[] (up to 4 short reasons for that confidence level),
  "warnings": string[] (up to 4 items — e.g. demo data, low provider confidence, anything a user should be cautious about)
}`;

export type PromptBundle = { system: string; user: string };

/**
 * Builds the exact prompt sent to the AI provider. Only the structured
 * context and already-computed deterministic outputs are included — never
 * raw provider payloads, secrets, or personal data beyond the property
 * address itself.
 */
export function buildInvestmentAnalysisPrompt(
  context: InvestmentAnalysisContext,
  dealScore: RealOfferDealScore,
  recommendation: DeterministicRecommendation,
  sensitivity: SensitivityAnalysis,
): PromptBundle {
  const facts = {
    property: {
      address: `${context.property.city}, ${context.property.state}`,
      propertyType: context.property.propertyType,
      bedrooms: context.property.bedrooms,
      bathrooms: context.property.bathrooms,
      squareFootage: context.property.squareFootage,
      lotSizeSqft: context.property.lotSizeSqft,
      yearBuilt: context.property.yearBuilt,
      daysOnMarket: context.property.daysOnMarket,
      listingStatus: context.property.listingStatus,
      listPrice: formatNullableCents(context.property.listPriceCents),
      originalListPrice: formatNullableCents(context.property.originalListPriceCents),
      listPriceReducedFromOriginal: context.property.listPriceReducedFromOriginal,
      hoaFeeCents: formatNullableCents(context.property.hoaFeeCents),
      lastSale: context.property.lastSaleDate ? `${formatNullableCents(context.property.lastSalePriceCents)} on ${context.property.lastSaleDate}` : "unavailable",
      taxAssessedValue: formatNullableCents(context.property.taxAssessedValueCents),
      providerAvm: formatNullableCents(context.property.providerAvmCents),
      dataSource: context.property.dataSource,
      confidence: context.property.confidence,
      missingFields: context.property.missingFields,
      dataRetrievedAt: context.property.retrievedAt,
    },
    comparables: {
      includedCount: context.comparables.selected.length,
      excludedCount: context.comparables.excluded.length,
      included: context.comparables.selected.map((c) => ({
        address: c.address,
        salePrice: formatCents(c.salePriceCents),
        saleDate: c.saleDate,
        distanceMiles: c.distanceMiles,
        squareFootage: c.squareFootage,
        similarityScore: c.similarityScore,
        saleType: c.saleType,
      })),
      suggestedArvRange: `${formatCents(context.comparables.suggestedArvLowCents)} - ${formatCents(context.comparables.suggestedArvHighCents)}`,
      selectedArv: formatCents(context.comparables.selectedArvCents),
      arvManuallyOverridden: context.comparables.arvManuallyOverridden,
    },
    repairs: {
      method: context.repairs.estimationMethod,
      conditionPreset: context.repairs.conditionPreset,
      total: formatCents(context.repairs.expectedRepairTotalCents),
      hasInspectionInformation: false,
    },
    assumptions: {
      proposedContractPrice: formatCents(context.assumptions.proposedContractPriceCents),
      assignmentFee: formatCents(context.assumptions.desiredAssignmentFeeCents),
      investorArvPercentage: formatPercent(context.assumptions.investorArvPercentage),
      maoMethod: context.assumptions.maoMethod,
    },
    calculatedOutputs: {
      maximumAllowableOffer: formatCents(context.calculatedOutputs.maximumAllowableOfferCents),
      endBuyerPurchasePrice: formatCents(context.calculatedOutputs.endBuyerPurchasePriceCents),
      projectedInvestorProfit: formatCents(context.calculatedOutputs.projectedInvestorProfitCents),
      returnOnCost: formatPercent(context.calculatedOutputs.investorReturnOnCost),
      marginOnArv: formatPercent(context.calculatedOutputs.investorMarginOnArv),
      remainingBuyerCushion: formatCents(context.calculatedOutputs.remainingBuyerCushionCents),
      dealClassification: context.calculatedOutputs.dealClassification,
      classificationReasons: context.calculatedOutputs.classificationReasons,
    },
    dealScore: { score: dealScore.score, label: dealScore.labelText },
    recommendation: { label: recommendation.recommendationLabel, reasons: recommendation.reasons },
    offerGuidanceNote: "Suggested offer and maximum recommended price are computed separately by RealOffer, not by you — do not restate or invent your own figures for these.",
    sensitivityScenarios: sensitivity.scenarios.map((s) => ({
      label: s.label,
      description: s.description,
      projectedInvestorProfit: formatCents(s.projectedInvestorProfitCents),
      dealClassification: s.dealClassification,
    })),
    isDemoData: context.sourceAndConfidence.isDemoData,
  };

  const user = `Here is the deal data:\n\n${JSON.stringify(facts, null, 2)}\n\n${OUTPUT_SCHEMA_DESCRIPTION}`;

  return { system: SYSTEM_PROMPT, user };
}

function formatNullableCents(cents: number | null): string {
  return cents === null ? "unavailable" : formatCents(cents);
}
