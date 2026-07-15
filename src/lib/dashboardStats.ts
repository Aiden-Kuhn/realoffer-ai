import { DEAL_PIPELINE_STATUSES, type Deal, type DealPipelineStatus } from "@/types/deal";

export type DashboardStats = {
  totalDeals: number;
  potentialDeals: number;
  averageAssignmentFeeCents: number;
  averageProjectedProfitCents: number;
  statusBreakdown: Record<DealPipelineStatus, number>;
};

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
}

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

  return {
    totalDeals: deals.length,
    potentialDeals,
    averageAssignmentFeeCents: average(deals.map((d) => d.assumptions.desiredAssignmentFeeCents)),
    averageProjectedProfitCents: average(deals.map((d) => d.results.projectedInvestorProfitCents)),
    statusBreakdown,
  };
}
