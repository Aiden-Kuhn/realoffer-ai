import { deriveDealInsights } from "@/lib/investmentAnalysis/deriveDealInsights";
import { DEAL_PIPELINE_STATUSES, type Deal, type DealPipelineStatus } from "@/types/deal";

export type DashboardStats = {
  totalDeals: number;
  potentialDeals: number;
  averageAssignmentFeeCents: number;
  averageProjectedProfitCents: number;
  statusBreakdown: Record<DealPipelineStatus, number>;
  averageDealScore: number;
  strongCandidateDeals: number;
  negotiationRequiredDeals: number;
  staleAnalysisDeals: number;
};

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
}

/** All figures below are computed from the user's actual saved deals —
 * nothing here is hardcoded or simulated activity. */
export function computeDashboardStats(deals: Deal[]): DashboardStats {
  const statusBreakdown = DEAL_PIPELINE_STATUSES.reduce(
    (acc, status) => {
      acc[status] = 0;
      return acc;
    },
    {} as Record<DealPipelineStatus, number>,
  );

  for (const deal of deals) {
    statusBreakdown[deal.status] += 1;
  }

  const potentialDeals = deals.filter(
    (d) => d.results.dealClassification === "strong_margin" || d.results.dealClassification === "potential_deal",
  ).length;

  const insights = deals.map(deriveDealInsights);

  return {
    totalDeals: deals.length,
    potentialDeals,
    averageAssignmentFeeCents: average(deals.map((d) => d.assumptions.desiredAssignmentFeeCents)),
    averageProjectedProfitCents: average(deals.map((d) => d.results.projectedInvestorProfitCents)),
    statusBreakdown,
    averageDealScore: average(insights.map((i) => i.dealScore.score)),
    strongCandidateDeals: insights.filter((i) => i.dealScore.label === "strong_candidate").length,
    negotiationRequiredDeals: insights.filter(
      (i) => i.dealScore.label === "negotiation_required" || i.recommendation.recommendation === "pursue_if_negotiated_lower",
    ).length,
    staleAnalysisDeals: insights.filter((i) => i.hasAnalysis && i.isStale).length,
  };
}
