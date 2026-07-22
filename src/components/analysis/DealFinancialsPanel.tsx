"use client";

import { ChevronDown } from "lucide-react";
import { formatCents } from "@/lib/calculations/money";
import { ClassificationBadge } from "@/components/shared/ClassificationBadge";
import { explainClassification } from "@/lib/calculations/explainClassification";
import type { DealFinancialResults } from "@/lib/calculations/types";
import type { DealAssumptions } from "@/types/deal";

/**
 * The financial detail card inside the Deal Analysis section. Deal Score,
 * ARV, and Maximum Allowable Offer already live in `PropertySummaryBar` at
 * the top of the page — this only shows what isn't duplicated there:
 * classification reasoning, repairs/profit, and the supporting cost rows.
 */
type DealFinancialsPanelProps = {
  repairCents: number;
  results: DealFinancialResults;
  assumptions: DealAssumptions;
  hasSufficientPropertyInfo: boolean;
};

type MetricTone = "neutral" | "positive" | "negative";

const TONE_STYLES: Record<MetricTone, { border: string; bg: string; label: string; value: string }> = {
  neutral: { border: "border-border", bg: "bg-surface-2", label: "text-muted", value: "text-white" },
  positive: { border: "border-emerald-400/25", bg: "bg-emerald-400/[0.07]", label: "text-emerald-300/90", value: "text-emerald-300" },
  negative: { border: "border-red-400/25", bg: "bg-red-400/[0.07]", label: "text-red-300/90", value: "text-red-300" },
};

export function DealFinancialsPanel({ repairCents, results, assumptions, hasSufficientPropertyInfo }: DealFinancialsPanelProps) {
  const isProfitNegative = results.projectedInvestorProfitCents < 0;

  const heroMetrics: Array<{ label: string; value: string; tone: MetricTone }> = [
    { label: "Estimated repairs", value: formatCents(repairCents), tone: "neutral" },
    {
      label: "Projected investor profit",
      value: formatCents(results.projectedInvestorProfitCents),
      tone: isProfitNegative ? "negative" : "positive",
    },
  ];

  const secondaryRows: Array<[string, string, boolean?]> = [
    ["Proposed contract price", formatCents(assumptions.contractPriceCents)],
    ["End-buyer purchase price", formatCents(results.endBuyerPurchasePriceCents)],
    ["Desired assignment fee", formatCents(assumptions.desiredAssignmentFeeCents)],
    ["Buyer cushion", formatCents(results.remainingBuyerCushionCents), results.remainingBuyerCushionCents < 0],
  ];

  const explanation = explainClassification(results, hasSufficientPropertyInfo);

  return (
    <section className="rounded-2xl border border-border bg-surface p-6 flex flex-col gap-5">
      <div>
        <p className="text-xs text-muted mb-2">Deal classification</p>
        <ClassificationBadge classification={results.dealClassification} />
        <details className="group mt-3">
          <summary className="flex cursor-pointer list-none items-center gap-1 text-xs text-white/50 hover:text-white/80 transition-colors">
            Why this status?
            <ChevronDown className="h-3 w-3 transition-transform group-open:rotate-180" />
          </summary>
          <ul className="mt-2 flex flex-col gap-1.5">
            {explanation.map((line, i) => (
              <li key={i} className="text-xs text-muted leading-relaxed">
                {line}
              </li>
            ))}
          </ul>
        </details>
      </div>

      <div className="h-px bg-border" />

      <div>
        <p className="text-xs text-muted mb-2.5">Repairs &amp; profit</p>
        <div className="grid grid-cols-2 auto-rows-fr gap-2.5">
          {heroMetrics.map((metric) => {
            const tone = TONE_STYLES[metric.tone];
            return (
              <div
                key={metric.label}
                className={`flex min-w-0 flex-col justify-between rounded-xl border ${tone.border} ${tone.bg} p-3.5 transition-colors duration-200`}
              >
                <p className={`text-[11px] leading-tight ${tone.label}`}>{metric.label}</p>
                <p className={`mt-2 text-lg font-semibold tabular-nums truncate ${tone.value}`}>{metric.value}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="h-px bg-border" />

      <dl className="flex flex-col gap-3">
        {secondaryRows.map(([label, value, negative]) => (
          <div key={label} className="flex items-center justify-between gap-3">
            <dt className="text-sm text-muted">{label}</dt>
            <dd className={`text-sm font-semibold tabular-nums ${negative ? "text-red-400" : "text-white"}`}>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
