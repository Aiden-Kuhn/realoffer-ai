/**
 * Rule-based (non-AI) thresholds used to classify a deal's health.
 * These are opinionated defaults, not universal standards, and are
 * intentionally kept in one place so they can be tuned or made
 * user-configurable later.
 */
export const DEAL_CLASSIFICATION_THRESHOLDS = {
  strongMargin: {
    minCushionCents: 500_000, // $5,000+ of headroom below MAO
    minReturnOnCost: 0.18,
    minProfitCents: 2_000_000, // $20,000+
  },
  potentialDeal: {
    minCushionCents: 100_000, // $1,000+
    minProfitCents: 1_000_000, // $10,000+
  },
  thinMargin: {
    minCushionCents: 0,
    minProfitCents: 1,
  },
} as const;

export type DealClassification =
  | "strong_margin"
  | "potential_deal"
  | "thin_margin"
  | "does_not_meet_targets"
  | "insufficient_information";

export const DEAL_CLASSIFICATION_LABELS: Record<DealClassification, string> = {
  strong_margin: "Strong Margin",
  potential_deal: "Potential Deal",
  thin_margin: "Thin Margin",
  does_not_meet_targets: "Does Not Meet Targets",
  insufficient_information: "Insufficient Information",
};
