import { describe, expect, it } from "vitest";
import { computeDealFinancials, classifyDeal, validateDealFinancialInputs } from "@/lib/calculations/engine";
import { DealInputValidationError, type DealFinancialInputs } from "@/lib/calculations/types";
import { dollarsToCents, centsToDollars } from "@/lib/calculations/money";
import { normalizeManualAddress } from "@/lib/property/normalizeAddress";
import { MockPropertyDataProvider } from "@/lib/property/mockPropertyDataProvider";

const baseInputs: DealFinancialInputs = {
  listPriceCents: 19_500_000,
  contractPriceCents: 18_000_000,
  arvCents: 30_000_000,
  repairCostCents: 3_000_000,
  desiredAssignmentFeeCents: 1_000_000,
  buyerClosingCostsCents: 600_000,
  holdingCostsCents: 800_000,
  financingCostsCents: 500_000,
  sellingCostsCents: 1_800_000,
  investorTargetProfitCents: 2_000_000,
  investorArvPercentage: 0.7,
  maoMethod: "PERCENTAGE_OF_ARV",
};

describe("computeDealFinancials — standard workable deal", () => {
  const results = computeDealFinancials(baseInputs);

  it("computes end-buyer purchase price", () => {
    expect(results.endBuyerPurchasePriceCents).toBe(19_000_000);
  });

  it("computes total investor costs", () => {
    expect(results.totalInvestorCostsCents).toBe(6_700_000);
  });

  it("computes all-in project cost", () => {
    expect(results.allInProjectCostCents).toBe(25_700_000);
  });

  it("computes projected investor profit", () => {
    expect(results.projectedInvestorProfitCents).toBe(4_300_000);
  });

  it("computes return on cost and margin on ARV", () => {
    expect(results.investorReturnOnCost).toBeCloseTo(4_300_000 / 25_700_000, 6);
    expect(results.investorMarginOnArv).toBeCloseTo(4_300_000 / 30_000_000, 6);
  });

  it("computes wholesale assignment spread equal to the assignment fee", () => {
    expect(results.wholesaleAssignmentSpreadCents).toBe(1_000_000);
  });

  it("computes break-even resale price equal to all-in project cost", () => {
    expect(results.breakEvenResalePriceCents).toBe(results.allInProjectCostCents);
  });
});

describe("computeDealFinancials — MAO methods", () => {
  it("percentage-of-ARV method: MAO = (ARV x pct) - total investor costs - assignment fee", () => {
    const results = computeDealFinancials({ ...baseInputs, maoMethod: "PERCENTAGE_OF_ARV" });
    // (30,000,000 * 0.7) - 6,700,000 - 1,000,000
    expect(results.maximumAllowableOfferCents).toBe(21_000_000 - 6_700_000 - 1_000_000);
  });

  it("target-profit method: MAO = ARV - total investor costs - target profit - assignment fee", () => {
    const results = computeDealFinancials({ ...baseInputs, maoMethod: "TARGET_PROFIT" });
    expect(results.maximumAllowableOfferCents).toBe(30_000_000 - 6_700_000 - 2_000_000 - 1_000_000);
  });

  it("remaining buyer cushion is MAO minus end-buyer purchase price", () => {
    const results = computeDealFinancials(baseInputs);
    expect(results.remainingBuyerCushionCents).toBe(results.maximumAllowableOfferCents - results.endBuyerPurchasePriceCents);
  });
});

describe("computeDealFinancials — edge cases", () => {
  it("ARV below all-in project cost produces a negative profit and negative return on cost", () => {
    const results = computeDealFinancials({ ...baseInputs, arvCents: 20_000_000 });
    expect(results.projectedInvestorProfitCents).toBeLessThan(0);
    expect(results.investorReturnOnCost).toBeLessThan(0);
    expect(results.dealClassification).toBe("does_not_meet_targets");
  });

  it("zero repairs still computes without error and excludes repairs from total costs", () => {
    const results = computeDealFinancials({ ...baseInputs, repairCostCents: 0 });
    expect(results.totalRepairCostCents).toBe(0);
    expect(results.totalInvestorCostsCents).toBe(600_000 + 800_000 + 500_000 + 1_800_000);
  });

  it("assignment fee larger than the available spread produces a deeply negative cushion without throwing", () => {
    const results = computeDealFinancials({ ...baseInputs, desiredAssignmentFeeCents: 50_000_000 });
    expect(results.remainingBuyerCushionCents).toBeLessThan(0);
    expect(Number.isFinite(results.remainingBuyerCushionCents)).toBe(true);
  });

  it("missing optional costs (all zero) reduces to profit = ARV - contract price", () => {
    const results = computeDealFinancials({
      ...baseInputs,
      repairCostCents: 0,
      desiredAssignmentFeeCents: 0,
      buyerClosingCostsCents: 0,
      holdingCostsCents: 0,
      financingCostsCents: 0,
      sellingCostsCents: 0,
      investorTargetProfitCents: 0,
    });
    expect(results.projectedInvestorProfitCents).toBe(baseInputs.arvCents - baseInputs.contractPriceCents);
  });

  it("handles large property values without precision loss", () => {
    const large: DealFinancialInputs = {
      ...baseInputs,
      listPriceCents: 480_000_00,
      contractPriceCents: 480_000_00,
      arvCents: 750_000_00,
      repairCostCents: 60_000_00,
      desiredAssignmentFeeCents: 25_000_00,
      buyerClosingCostsCents: 15_000_00,
      holdingCostsCents: 20_000_00,
      financingCostsCents: 12_000_00,
      sellingCostsCents: 45_000_00,
    };
    const results = computeDealFinancials(large);
    expect(Number.isInteger(results.allInProjectCostCents)).toBe(true);
    expect(results.allInProjectCostCents).toBe(
      large.contractPriceCents +
        large.desiredAssignmentFeeCents +
        large.repairCostCents +
        large.buyerClosingCostsCents +
        large.holdingCostsCents +
        large.financingCostsCents +
        large.sellingCostsCents,
    );
  });
});

describe("validateDealFinancialInputs — rejects invalid input", () => {
  it("rejects negative monetary values", () => {
    expect(() => validateDealFinancialInputs({ ...baseInputs, repairCostCents: -100 })).toThrow(DealInputValidationError);
  });

  it("rejects an unreasonable ARV percentage", () => {
    expect(() => validateDealFinancialInputs({ ...baseInputs, investorArvPercentage: 5 })).toThrow(DealInputValidationError);
  });

  it("rejects a negative ARV percentage", () => {
    expect(() => validateDealFinancialInputs({ ...baseInputs, investorArvPercentage: -0.1 })).toThrow(DealInputValidationError);
  });

  it("computeDealFinancials propagates validation errors", () => {
    expect(() => computeDealFinancials({ ...baseInputs, contractPriceCents: -1 })).toThrow(DealInputValidationError);
  });
});

describe("currency rounding", () => {
  it("dollarsToCents rounds to the nearest cent", () => {
    expect(dollarsToCents(19.994)).toBe(1999);
    expect(dollarsToCents(19.996)).toBe(2000);
  });

  it("centsToDollars is the inverse of dollarsToCents for whole cents", () => {
    expect(centsToDollars(dollarsToCents(1234.56))).toBeCloseTo(1234.56, 6);
  });

  it("MAO percentage-of-ARV math always yields an integer number of cents", () => {
    const results = computeDealFinancials({ ...baseInputs, arvCents: 10_000_001, investorArvPercentage: 0.7 });
    expect(Number.isInteger(results.maximumAllowableOfferCents)).toBe(true);
  });
});

describe("classifyDeal", () => {
  it("returns insufficient_information when property data is incomplete", () => {
    const results = computeDealFinancials(baseInputs, { hasSufficientPropertyInfo: false });
    expect(results.dealClassification).toBe("insufficient_information");
  });

  it("classifies a strongly profitable deal as strong_margin", () => {
    const results = computeDealFinancials({
      ...baseInputs,
      contractPriceCents: 10_000_000,
      desiredAssignmentFeeCents: 500_000,
    });
    expect(results.dealClassification).toBe("strong_margin");
  });

  it("classifyDeal is a pure function of its inputs", () => {
    const results = computeDealFinancials(baseInputs);
    const classification = classifyDeal(results, true);
    expect(classification).toBe(results.dealClassification);
  });
});

describe("MockPropertyDataProvider determinism", () => {
  it("returns the same property data for the same address on repeated calls", async () => {
    const provider = new MockPropertyDataProvider();
    const address = normalizeManualAddress({ line1: "428 Maple Ridge Dr", city: "Austin", state: "TX", zip: "78701" });

    const first = await provider.getPropertyByAddress(address);
    const second = await provider.getPropertyByAddress(address);

    expect(second).toEqual(first);
  });

  it("returns different profiles for different addresses", async () => {
    const provider = new MockPropertyDataProvider();
    const a = await provider.getPropertyByAddress(
      normalizeManualAddress({ line1: "428 Maple Ridge Dr", city: "Austin", state: "TX", zip: "78701" }),
    );
    const b = await provider.getPropertyByAddress(
      normalizeManualAddress({ line1: "902 Cedar Point Ave", city: "Tampa", state: "FL", zip: "33602" }),
    );

    expect(a.arvExpectedCents).not.toBe(b.arvExpectedCents);
  });
});
