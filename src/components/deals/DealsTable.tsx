import Link from "next/link";
import { formatCents } from "@/lib/calculations/money";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SourceBadge } from "@/components/shared/SourceBadge";
import { DealScoreBadge } from "@/components/shared/DealScoreBadge";
import { deriveDealInsights } from "@/lib/investmentAnalysis/deriveDealInsights";
import type { Deal } from "@/types/deal";

export function DealsTable({ deals, onDeleteRequest }: { deals: Deal[]; onDeleteRequest: (id: string) => void }) {
  return (
    <div className="hidden md:block overflow-x-auto rounded-2xl border border-border bg-surface">
      <table className="w-full min-w-[960px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted">
            <th className="py-3 px-4 font-medium">Address</th>
            <th className="py-3 px-4 font-medium">Created</th>
            <th className="py-3 px-4 font-medium">Status</th>
            <th className="py-3 px-4 font-medium">Score</th>
            <th className="py-3 px-4 font-medium">ARV</th>
            <th className="py-3 px-4 font-medium">Repairs</th>
            <th className="py-3 px-4 font-medium">Contract</th>
            <th className="py-3 px-4 font-medium">MAO</th>
            <th className="py-3 px-4 font-medium">Assignment fee</th>
            <th className="py-3 px-4 font-medium">Profit</th>
            <th className="py-3 px-4 font-medium sr-only">Actions</th>
          </tr>
        </thead>
        <tbody>
          {deals.map((deal) => {
            const arv = deal.assumptions.arvOverrideCents ?? deal.property.arvExpectedCents;
            const insights = deriveDealInsights(deal);
            return (
              <tr key={deal.id} className="border-b border-border/60 last:border-0 transition-colors duration-150 hover:bg-white/[0.02]">
                <td className="py-3 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Link href={`/dashboard/deals/${deal.id}`} className="font-medium text-white hover:text-accent-3 transition-colors">
                      {deal.property.address.line1}
                    </Link>
                    <SourceBadge kind={deal.dataMode === "real" ? "provider_record" : "demo"} />
                  </div>
                  <p className="text-xs text-muted mt-0.5">{deal.property.address.city}, {deal.property.address.state}</p>
                </td>
                <td className="py-3 px-4 text-white/60 whitespace-nowrap">
                  {new Date(deal.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </td>
                <td className="py-3 px-4">
                  <StatusBadge status={deal.status} />
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <DealScoreBadge score={insights.dealScore.score} label={insights.dealScore.label} labelText={insights.dealScore.labelText} compact />
                  {insights.hasAnalysis && insights.isStale ? <p className="mt-1 text-[10px] text-amber-300/70">Analysis stale</p> : null}
                </td>
                <td className="py-3 px-4 text-white tabular-nums whitespace-nowrap">{formatCents(arv)}</td>
                <td className="py-3 px-4 text-white/70 tabular-nums whitespace-nowrap">{formatCents(deal.results.totalRepairCostCents)}</td>
                <td className="py-3 px-4 text-white/70 tabular-nums whitespace-nowrap">{formatCents(deal.assumptions.contractPriceCents)}</td>
                <td className="py-3 px-4 text-white/70 tabular-nums whitespace-nowrap">{formatCents(deal.results.maximumAllowableOfferCents)}</td>
                <td className="py-3 px-4 text-white/70 tabular-nums whitespace-nowrap">{formatCents(deal.assumptions.desiredAssignmentFeeCents)}</td>
                <td
                  className={`py-3 px-4 tabular-nums whitespace-nowrap font-medium ${
                    deal.results.projectedInvestorProfitCents < 0 ? "text-red-400" : "text-emerald-400"
                  }`}
                >
                  {formatCents(deal.results.projectedInvestorProfitCents)}
                </td>
                <td className="py-3 px-4 text-right whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => onDeleteRequest(deal.id)}
                    className="text-xs font-medium text-white/40 hover:text-red-300 active:scale-[0.98] transition-all duration-150"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
