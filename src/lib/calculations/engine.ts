import { DEAL_CLASSIFICATION_THRESHOLDS, type DealClassification } from "@/config/dealClassification";
import { clampNonNegativeCents, MAX_REASONABLE_CENTS, MAX_REASONABLE_PERCENTAGE } from "@/lib/calculations/money";
import { DealInputValidationError, type DealFinancialInputs, type DealFinancialResults } from "@/lib/calculations/types";

const MAX_PERCENTAGE = MAX_REASONABLE_PERCENTAGE;

/**
 * Throws DealInputValidationError for negative values or unreasonable
 * percentages. All monetary fields must be integer cents.
 */
export function validateDealFinancialInputs(inputs: DealFinancialInputs): void {
  const moneyFields: Array<[string, number]> = [
    ["listPriceCents", inputs.listPriceCents],
    ["contractPriceCents", inputs.contractPriceCents],
    ["arvCents", inputs.arvCents],
    ["repairCostCents", inputs.repairCostCents],
    ["desiredAssignmentFeeCents", inputs.desiredAssignmentFeeCents],
    ["buyerClosingCostsCents", inputs.buyerClosingCostsCents],
    ["holdingCostsCents", inputs.holdingCostsCents],
    ["financingCostsCents", inputs.financingCostsCents],
    ["sellingCostsCents", inputs.sellingCostsCents],
    ["investorTargetProfitCents", inputs.investorTargetProfitCents],
  ];

  for (const [name, value] of moneyFields) {
    if (!Number.isFinite(value)) {
      throw new DealInputValidationError(`${name} must be a finite number.`);
    }
    if (value < 0) {
      throw new DealInputValidationError(`${name} cannot be negative.`);
    }
    if (!Number.isInteger(value)) {
      throw new DealInputValidationError(`${name} must be an integer number of cents.`);
    }
    if (value > MAX_REASONABLE_CENTS) {
      throw new DealInputValidationError(`${name} exceeds a reasonable maximum value.`);
    }
  }

  if (!Number.isFinite(inputs.investorArvPercentage) || inputs.investorArvPercentage < 0) {
    throw new DealInputValidationError("investorArvPercentage cannot be negative.");
  }
  if (inputs.investorArvPercentage > MAX_PERCENTAGE) {
    throw new DealInputValidationError("investorArvPercentage is not a reasonable percentage.");
  }
  if (inputs.arvCents === 0 && inputs.maoMethod === "PERCENTAGE_OF_ARV") {
    // Not an error on its own (results just come out at 0), but callers
    // should treat a zero ARV as insufficient information upstream.
  }
}

/** repairs + buyer closing costs + holding costs + financing costs + selling costs */
function computeTotalInvestorCosts(inputs: DealFinancialInputs): number {
  return (
    inputs.repairCostCents +
    inputs.buyerClosingCostsCents +
    inputs.holdingCostsCents +
    inputs.financingCostsCents +
    inputs.sellingCostsCents
  );
}

function computeMaximumAllowableOffer(inputs: DealFinancialInputs, totalInvestorCostsCents: number): number {
  if (inputs.maoMethod === "PERCENTAGE_OF_ARV") {
    // MAO = (ARV x investor ARV%) - repairs - other investor costs - assignment fee
    return Math.round(inputs.arvCents * inputs.investorArvPercentage) - totalInvestorCostsCents - inputs.desiredAssignmentFeeCents;
  }
  // TARGET_PROFIT: MAO = ARV - total investor costs - target profit - assignment fee
  return inputs.arvCents - totalInvestorCostsCents - inputs.investorTargetProfitCents - inputs.desiredAssignmentFeeCents;
}

export function classifyDeal(
  results: Omit<DealFinancialResults, "dealClassification">,
  hasSufficientPropertyInfo: boolean,
): DealClassification {
  if (!hasSufficientPropertyInfo) {
    return "insufficient_information";
  }

  const { strongMargin, potentialDeal, thinMargin } = DEAL_CLASSIFICATION_THRESHOLDS;

  if (
    results.remainingBuyerCushionCents >= strongMargin.minCushionCents &&
    results.investorReturnOnCost >= strongMargin.minReturnOnCost &&
    results.projectedInvestorProfitCents >= strongMargin.minProfitCents
  ) {
    return "strong_margin";
  }

  if (
    results.remainingBuyerCushionCents >= potentialDeal.minCushionCents &&
    results.projectedInvestorProfitCents >= potentialDeal.minProfitCents
  ) {
    return "potential_deal";
  }

  if (
    results.remainingBuyerCushionCents >= thinMargin.minCushionCents &&
    results.projectedInvestorProfitCents >= thinMargin.minProfitCents
  ) {
    return "thin_margin";
  }

  return "does_not_meet_targets";
}

/**
 * Pure calculation of every deal financial output from a set of inputs.
 * Throws DealInputValidationError on invalid input.
 */
export function computeDealFinancials(
  inputs: DealFinancialInputs,
  options?: { hasSufficientPropertyInfo?: boolean },
): DealFinancialResults {
  validateDealFinancialInputs(inputs);

  const endBuyerPurchasePriceCents = inputs.contractPriceCents + inputs.desiredAssignmentFeeCents;
  const totalRepairCostCents = inputs.repairCostCents;
  const totalInvestorCostsCents = computeTotalInvestorCosts(inputs);
  const allInProjectCostCents = endBuyerPurchasePriceCents + totalInvestorCostsCents;
  const projectedInvestorProfitCents = inputs.arvCents - allInProjectCostCents;
  const investorReturnOnCost = allInProjectCostCents > 0 ? projectedInvestorProfitCents / allInProjectCostCents : 0;
  const investorMarginOnArv = inputs.arvCents > 0 ? projectedInvestorProfitCents / inputs.arvCents : 0;
  const wholesaleAssignmentSpreadCents = endBuyerPurchasePriceCents - inputs.contractPriceCents;
  const breakEvenResalePriceCents = allInProjectCostCents;
  const maximumAllowableOfferCents = computeMaximumAllowableOffer(inputs, totalInvestorCostsCents);
  const remainingBuyerCushionCents = maximumAllowableOfferCents - endBuyerPurchasePriceCents;

  const resultsWithoutClassification: Omit<DealFinancialResults, "dealClassification"> = {
    endBuyerPurchasePriceCents,
    totalRepairCostCents,
    totalInvestorCostsCents,
    allInProjectCostCents,
    projectedInvestorProfitCents,
    investorReturnOnCost,
    investorMarginOnArv,
    wholesaleAssignmentSpreadCents,
    breakEvenResalePriceCents,
    maximumAllowableOfferCents,
    remainingBuyerCushionCents,
  };

  const dealClassification = classifyDeal(resultsWithoutClassification, options?.hasSufficientPropertyInfo ?? true);

  return { ...resultsWithoutClassification, dealClassification };
}

export function safeCents(value: number): number {
  return clampNonNegativeCents(value);
}
