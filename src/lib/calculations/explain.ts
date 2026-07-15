import { formatCents, formatPercent } from "@/lib/calculations/money";
import type { DealFinancialInputs, DealFinancialResults } from "@/lib/calculations/types";

export type CalculationExplanationLine = {
  label: string;
  formula: string;
  substituted: string;
  result: string;
};

export function explainDealFinancials(
  inputs: DealFinancialInputs,
  results: DealFinancialResults,
): CalculationExplanationLine[] {
  const otherCosts =
    inputs.buyerClosingCostsCents + inputs.holdingCostsCents + inputs.financingCostsCents + inputs.sellingCostsCents;

  const maoLine: CalculationExplanationLine =
    inputs.maoMethod === "PERCENTAGE_OF_ARV"
      ? {
          label: "Maximum Allowable Offer (% of ARV method)",
          formula: "(ARV x Investor ARV%) - Repairs - Other Investor Costs - Assignment Fee",
          substituted: `(${formatCents(inputs.arvCents)} x ${formatPercent(inputs.investorArvPercentage)}) - ${formatCents(
            inputs.repairCostCents,
          )} - ${formatCents(otherCosts)} - ${formatCents(inputs.desiredAssignmentFeeCents)}`,
          result: formatCents(results.maximumAllowableOfferCents),
        }
      : {
          label: "Maximum Allowable Offer (target profit method)",
          formula: "ARV - Total Investor Costs - Desired Investor Profit - Assignment Fee",
          substituted: `${formatCents(inputs.arvCents)} - ${formatCents(results.totalInvestorCostsCents)} - ${formatCents(
            inputs.investorTargetProfitCents,
          )} - ${formatCents(inputs.desiredAssignmentFeeCents)}`,
          result: formatCents(results.maximumAllowableOfferCents),
        };

  return [
    {
      label: "End-Buyer Purchase Price",
      formula: "Contract Price + Assignment Fee",
      substituted: `${formatCents(inputs.contractPriceCents)} + ${formatCents(inputs.desiredAssignmentFeeCents)}`,
      result: formatCents(results.endBuyerPurchasePriceCents),
    },
    {
      label: "Total Investor Costs",
      formula: "Repairs + Buyer Closing Costs + Holding Costs + Financing Costs + Selling Costs",
      substituted: `${formatCents(inputs.repairCostCents)} + ${formatCents(inputs.buyerClosingCostsCents)} + ${formatCents(
        inputs.holdingCostsCents,
      )} + ${formatCents(inputs.financingCostsCents)} + ${formatCents(inputs.sellingCostsCents)}`,
      result: formatCents(results.totalInvestorCostsCents),
    },
    {
      label: "All-In Project Cost",
      formula: "End-Buyer Purchase Price + Total Investor Costs",
      substituted: `${formatCents(results.endBuyerPurchasePriceCents)} + ${formatCents(results.totalInvestorCostsCents)}`,
      result: formatCents(results.allInProjectCostCents),
    },
    {
      label: "Projected Investor Profit",
      formula: "ARV - All-In Project Cost",
      substituted: `${formatCents(inputs.arvCents)} - ${formatCents(results.allInProjectCostCents)}`,
      result: formatCents(results.projectedInvestorProfitCents),
    },
    {
      label: "Investor Return on Cost",
      formula: "Projected Profit / All-In Project Cost",
      substituted: `${formatCents(results.projectedInvestorProfitCents)} / ${formatCents(results.allInProjectCostCents)}`,
      result: formatPercent(results.investorReturnOnCost),
    },
    {
      label: "Investor Margin on ARV",
      formula: "Projected Profit / ARV",
      substituted: `${formatCents(results.projectedInvestorProfitCents)} / ${formatCents(inputs.arvCents)}`,
      result: formatPercent(results.investorMarginOnArv),
    },
    {
      label: "Wholesale Assignment Spread",
      formula: "End-Buyer Purchase Price - Contract Price",
      substituted: `${formatCents(results.endBuyerPurchasePriceCents)} - ${formatCents(inputs.contractPriceCents)}`,
      result: formatCents(results.wholesaleAssignmentSpreadCents),
    },
    {
      label: "Break-Even Resale Price",
      formula: "All-In Project Cost",
      substituted: formatCents(results.allInProjectCostCents),
      result: formatCents(results.breakEvenResalePriceCents),
    },
    maoLine,
    {
      label: "Remaining Buyer Cushion",
      formula: "Maximum Allowable Offer - End-Buyer Purchase Price",
      substituted: `${formatCents(results.maximumAllowableOfferCents)} - ${formatCents(results.endBuyerPurchasePriceCents)}`,
      result: formatCents(results.remainingBuyerCushionCents),
    },
  ];
}
