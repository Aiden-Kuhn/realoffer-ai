import type { DealClassification } from "@/config/dealClassification";

export type MaoMethod = "PERCENTAGE_OF_ARV" | "TARGET_PROFIT";

/**
 * All monetary fields are integer cents. Percentages are fractions (0.7 = 70%).
 */
export type DealFinancialInputs = {
  listPriceCents: number;
  contractPriceCents: number;
  arvCents: number;
  repairCostCents: number;
  desiredAssignmentFeeCents: number;
  buyerClosingCostsCents: number;
  holdingCostsCents: number;
  financingCostsCents: number;
  sellingCostsCents: number;
  investorTargetProfitCents: number;
  investorArvPercentage: number;
  maoMethod: MaoMethod;
};

export type DealFinancialResults = {
  endBuyerPurchasePriceCents: number;
  totalRepairCostCents: number;
  totalInvestorCostsCents: number;
  allInProjectCostCents: number;
  projectedInvestorProfitCents: number;
  investorReturnOnCost: number;
  investorMarginOnArv: number;
  wholesaleAssignmentSpreadCents: number;
  breakEvenResalePriceCents: number;
  maximumAllowableOfferCents: number;
  remainingBuyerCushionCents: number;
  dealClassification: DealClassification;
};

export class DealInputValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DealInputValidationError";
  }
}
