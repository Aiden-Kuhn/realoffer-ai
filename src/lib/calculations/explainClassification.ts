import { DEAL_CLASSIFICATION_THRESHOLDS, DEAL_CLASSIFICATION_LABELS, type DealClassification } from "@/config/dealClassification";
import { formatCents, formatPercent } from "@/lib/calculations/money";
import type { DealFinancialResults } from "@/lib/calculations/types";

export function explainClassification(results: DealFinancialResults, hasSufficientPropertyInfo: boolean): string[] {
  if (!hasSufficientPropertyInfo) {
    return ["Key property details are missing, so a reliable classification can't be made yet."];
  }

  const { strongMargin, potentialDeal, thinMargin } = DEAL_CLASSIFICATION_THRESHOLDS;
  const label = DEAL_CLASSIFICATION_LABELS[results.dealClassification as DealClassification];

  const lines = [
    `Buyer cushion: ${formatCents(results.remainingBuyerCushionCents)} (MAO - end-buyer purchase price)`,
    `Return on cost: ${formatPercent(results.investorReturnOnCost)}`,
    `Projected profit: ${formatCents(results.projectedInvestorProfitCents)}`,
  ];

  switch (results.dealClassification) {
    case "strong_margin":
      lines.push(
        `Classified "${label}" because cushion, return on cost, and profit all meet or exceed the strong-margin thresholds (cushion >= ${formatCents(
          strongMargin.minCushionCents,
        )}, return on cost >= ${formatPercent(strongMargin.minReturnOnCost)}, profit >= ${formatCents(strongMargin.minProfitCents)}).`,
      );
      break;
    case "potential_deal":
      lines.push(
        `Classified "${label}" because cushion and profit meet the potential-deal thresholds (cushion >= ${formatCents(
          potentialDeal.minCushionCents,
        )}, profit >= ${formatCents(potentialDeal.minProfitCents)}) but fall short of the strong-margin bar.`,
      );
      break;
    case "thin_margin":
      lines.push(
        `Classified "${label}" because cushion and profit are still positive (cushion >= ${formatCents(
          thinMargin.minCushionCents,
        )}, profit >= ${formatCents(thinMargin.minProfitCents)}) but below the potential-deal thresholds.`,
      );
      break;
    case "does_not_meet_targets":
      lines.push(`Classified "${label}" because either the buyer cushion or the projected profit is at or below zero.`);
      break;
  }

  return lines;
}
