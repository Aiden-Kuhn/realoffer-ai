import { missingPropertyFields } from "@/lib/property/completeness";
import type { ComparableSale, PropertyRecord } from "@/lib/property/types";
import type { DealFinancialResults } from "@/lib/calculations/types";

export type RiskItem = {
  severity: "high" | "medium" | "low";
  message: string;
};

export function computeDealRisks(
  property: PropertyRecord,
  comparables: ComparableSale[],
  results: DealFinancialResults,
): RiskItem[] {
  const risks: RiskItem[] = [];

  const missing = missingPropertyFields(property);
  if (missing.length > 0) {
    risks.push({
      severity: "high",
      message: `Missing data: ${missing.join(", ")}. Confirm these details before relying on this analysis.`,
    });
  }

  if (property.confidence === "low") {
    risks.push({
      severity: "medium",
      message: "Simulated data confidence is low for this property — treat all figures as a rough starting point.",
    });
  }

  if (results.remainingBuyerCushionCents < 0) {
    risks.push({
      severity: "high",
      message: "The proposed contract price plus assignment fee exceeds the maximum allowable offer.",
    });
  }

  if (results.projectedInvestorProfitCents <= 0) {
    risks.push({
      severity: "high",
      message: "Projected investor profit is zero or negative at the current ARV and cost assumptions.",
    });
  }

  if (property.daysOnMarket !== null && property.daysOnMarket > 90) {
    risks.push({
      severity: "low",
      message: `This listing has been on market for ${property.daysOnMarket} days — investigate why before making an offer.`,
    });
  }

  const includedComparables = comparables.filter((c) => c.included).length;
  if (includedComparables < 3) {
    risks.push({
      severity: "medium",
      message: "Fewer than 3 comparable sales are included — the ARV estimate may be less reliable.",
    });
  }

  return risks;
}
