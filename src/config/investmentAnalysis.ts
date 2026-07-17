/**
 * Configuration for the RealOffer Investment Analyst: deal-score weights,
 * label bands, sensitivity-scenario parameters, and which assumption
 * changes should mark a generated analysis as stale.
 *
 * These are RealOffer's own opinionated product rules, not universal
 * investment truths — see DEAL_SCORE_LABELS and the disclaimers rendered
 * alongside the analysis. Keeping them in one file makes them auditable
 * and easy to tune without touching the scoring logic itself.
 */

/** Bumps whenever the AI output schema or prompt contract changes in a way
 * that would make an older cached/saved analysis unsafe to reuse silently. */
export const ANALYSIS_VERSION = 1;

export const DEAL_SCORE_WEIGHTS = {
  cushion: 25,
  returnOnCost: 20,
  profit: 20,
  comparableQuality: 10,
  dataCompleteness: 10,
  repairConfidence: 5,
  daysOnMarket: 5,
  priceReduction: 5,
} as const;

/** Denominators used to scale each weighted component to its point cap —
 * reuses the same "strong deal" bar as the rule-based deal classification
 * so the two systems stay directionally consistent. */
export const DEAL_SCORE_TARGETS = {
  cushionCentsForFullPoints: 500_000, // $5,000
  returnOnCostForFullPoints: 0.18,
  profitCentsForFullPoints: 2_000_000, // $20,000
  comparableCountForFullPoints: 5,
};

/** Hard cap applied when the property doesn't have enough data for a
 * meaningful classification — prevents a coincidentally "OK-looking" score
 * from a mostly-empty record. */
export const INSUFFICIENT_INFO_SCORE_CAP = 35;

export type DealScoreLabel =
  | "strong_candidate"
  | "worth_investigating"
  | "negotiation_required"
  | "weak_candidate"
  | "does_not_meet_targets";

export const DEAL_SCORE_LABELS: Array<{ min: number; label: DealScoreLabel; text: string }> = [
  { min: 85, label: "strong_candidate", text: "Strong Candidate" },
  { min: 70, label: "worth_investigating", text: "Worth Investigating" },
  { min: 50, label: "negotiation_required", text: "Negotiation Required" },
  { min: 30, label: "weak_candidate", text: "Weak Candidate" },
  { min: 0, label: "does_not_meet_targets", text: "Does Not Meet Targets" },
];

/** How far below the maximum recommended offer the suggested *opening* offer
 * starts — a documented, configurable rule of thumb, not a prediction that
 * a seller will accept it. */
export const SUGGESTED_OPENING_OFFER_DISCOUNT = 0.06; // 6% below MAO

export const SENSITIVITY_SCENARIOS = {
  conservative: { arvMultiplier: 0.95, repairMultiplier: 1.15, holdingMultiplier: 1.15 },
  optimistic: { arvMultiplier: 1.05, repairMultiplier: 0.9, holdingMultiplier: 1.0 },
  repairsUp10: { repairMultiplier: 1.1 },
  repairsUp20: { repairMultiplier: 1.2 },
  arvDown5: { arvMultiplier: 0.95 },
  arvDown10: { arvMultiplier: 0.9 },
  holdingCostsUp50: { holdingMultiplier: 1.5 },
} as const;

/** Assumption fields that, when changed, mark a previously generated AI
 * analysis as stale (still shown, but flagged) rather than silently wrong. */
export const STALE_TRIGGER_ASSUMPTION_FIELDS = [
  "contractPriceCents",
  "arvOverrideCents",
  "desiredAssignmentFeeCents",
  "buyerClosingCostsCents",
  "holdingCostsCents",
  "financingCostsCents",
  "sellingCostsCents",
  "investorTargetProfitCents",
  "investorArvPercentage",
  "maoMethod",
] as const;
