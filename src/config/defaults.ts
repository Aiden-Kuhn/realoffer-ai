/**
 * Default assumptions used to seed a new deal analysis. All of these are
 * editable per-deal and editable globally in Settings — they are rules of
 * thumb, not guarantees.
 */
export const DEFAULT_ASSUMPTIONS = {
  investorArvPercentage: 0.7,
  assignmentFeeCents: 1_000_000,
  buyerClosingCostPercentage: 0.02,
  sellingCostPercentage: 0.08,
  financingCostPercentage: 0.02,
  holdingPeriodMonths: 4,
  holdingCostPerMonthCents: 40_000,
  investorTargetProfitCents: 2_000_000,
};

export const DEFAULT_SETTINGS = {
  fullName: "",
  companyName: "",
  defaultAssignmentFeeCents: DEFAULT_ASSUMPTIONS.assignmentFeeCents,
  defaultInvestorArvPercentage: DEFAULT_ASSUMPTIONS.investorArvPercentage,
  defaultHoldingPeriodMonths: DEFAULT_ASSUMPTIONS.holdingPeriodMonths,
  defaultBuyerClosingCostPercentage: DEFAULT_ASSUMPTIONS.buyerClosingCostPercentage,
  defaultSellingCostPercentage: DEFAULT_ASSUMPTIONS.sellingCostPercentage,
  defaultFinancingCostPercentage: DEFAULT_ASSUMPTIONS.financingCostPercentage,
  currency: "USD" as const,
  density: "comfortable" as const,
};
