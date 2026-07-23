"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { formatCents } from "@/lib/calculations/money";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SourceBadge } from "@/components/shared/SourceBadge";
import { DealScoreBadge } from "@/components/shared/DealScoreBadge";
import { deriveDealInsights } from "@/lib/investmentAnalysis/deriveDealInsights";
import { formatBedsBaths } from "@/lib/property/labels";
import { resolveEffectiveBedsBaths } from "@/lib/property/bedsBathsOverride";
import type { Deal } from "@/types/deal";

/**
 * Deliberately shows only what answers "which property, is it a good
 * deal, should I open it": address, deal score, MAO, profit, status, and
 * when it was analyzed. Everything else (ARV, repairs, contract price,
 * assignment fee, ...) already lives one click away in the Property
 * Workspace — this list is a finder, not a report.
 */
export function DealsTable({ deals, onDeleteRequest }: { deals: Deal[]; onDeleteRequest: (id: string) => void }) {
  const router = useRouter();

  function openDeal(dealId: string) {
    router.push(`/dashboard/deals/${dealId}`);
  }

  // Mouse-only "click anywhere on the row" convenience. The address Link
  // below remains the real keyboard path (Tab, then Enter) — adding a
  // second focusable stop on the <tr> itself would be a double tab-stop to
  // the same destination, not an accessibility improvement.
  function handleRowClick(event: React.MouseEvent<HTMLTableRowElement>, dealId: string) {
    if ((event.target as HTMLElement).closest("a, button")) return;
    openDeal(dealId);
  }

  return (
    <div className="hidden md:block overflow-x-auto rounded-2xl border border-border bg-surface">
      <table className="w-full min-w-[620px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted">
            <th className="py-3.5 px-4 font-medium">Property</th>
            <th className="py-3.5 px-4 font-medium">Deal score</th>
            <th className="py-3.5 px-4 font-medium">Max offer</th>
            <th className="py-3.5 px-4 font-medium">Profit</th>
            <th className="py-3.5 px-4 font-medium">Status</th>
            <th className="py-3.5 px-4 font-medium">Analyzed</th>
            <th className="py-3.5 px-4 font-medium sr-only">Actions</th>
          </tr>
        </thead>
        <tbody>
          {deals.map((deal) => {
            const insights = deriveDealInsights(deal);
            const effective = resolveEffectiveBedsBaths(deal);
            const bedsBaths = formatBedsBaths(effective.bedrooms, effective.bathrooms);
            const isProfitNegative = deal.results.projectedInvestorProfitCents < 0;
            return (
              <tr
                key={deal.id}
                onClick={(e) => handleRowClick(e, deal.id)}
                className="cursor-pointer border-b border-border/60 last:border-0 transition-colors duration-150 hover:bg-white/[0.025]"
              >
                <td className="py-4 px-4 max-w-[220px]">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/dashboard/deals/${deal.id}`} className="font-medium text-white hover:text-accent-3 transition-colors">
                      {deal.property.address.line1}
                    </Link>
                    <SourceBadge kind={deal.dataMode === "real" ? "provider_record" : "demo"} />
                  </div>
                  <p className="text-xs text-muted mt-1">
                    {deal.property.address.city}, {deal.property.address.state}
                    {bedsBaths ? ` · ${bedsBaths}` : ""}
                  </p>
                </td>
                <td className="py-4 px-4 whitespace-nowrap">
                  <DealScoreBadge score={insights.dealScore.score} label={insights.dealScore.label} labelText={insights.dealScore.labelText} compact />
                  {insights.hasAnalysis && insights.isStale ? <p className="mt-1.5 text-[10px] text-amber-300/70">Analysis stale</p> : null}
                </td>
                <td className="py-4 px-4 text-white tabular-nums whitespace-nowrap">{formatCents(deal.results.maximumAllowableOfferCents)}</td>
                <td
                  className={`py-4 px-4 tabular-nums whitespace-nowrap font-medium ${isProfitNegative ? "text-red-400" : "text-emerald-400"}`}
                >
                  {formatCents(deal.results.projectedInvestorProfitCents)}
                </td>
                <td className="py-4 px-4">
                  <StatusBadge status={deal.status} />
                </td>
                <td className="py-4 px-4 text-white/60 whitespace-nowrap">
                  {new Date(deal.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </td>
                <td className="py-4 px-4 text-right whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => onDeleteRequest(deal.id)}
                    aria-label={`Delete ${deal.property.address.line1}`}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/30 hover:text-red-300 hover:bg-red-400/10 active:scale-[0.98] transition-all duration-150"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
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
