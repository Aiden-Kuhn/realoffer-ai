"use client";

import { ChevronDown, Check } from "lucide-react";
import { formatCents } from "@/lib/calculations/money";
import { ClassificationBadge } from "@/components/shared/ClassificationBadge";
import { explainClassification } from "@/lib/calculations/explainClassification";
import type { DealFinancialResults } from "@/lib/calculations/types";
import type { DealAssumptions } from "@/types/deal";

type SummaryPanelProps = {
  arvCents: number;
  repairCents: number;
  results: DealFinancialResults;
  assumptions: DealAssumptions;
  hasSufficientPropertyInfo: boolean;
  onSave: () => void;
  isSaving: boolean;
  justSaved: boolean;
};

export function SummaryPanel({
  arvCents,
  repairCents,
  results,
  assumptions,
  hasSufficientPropertyInfo,
  onSave,
  isSaving,
  justSaved,
}: SummaryPanelProps) {
  const rows: Array<[string, string, boolean?]> = [
    ["Expected ARV", formatCents(arvCents)],
    ["Estimated repairs", formatCents(repairCents)],
    ["Maximum allowable offer", formatCents(results.maximumAllowableOfferCents)],
    ["Proposed contract price", formatCents(assumptions.contractPriceCents)],
    ["End-buyer purchase price", formatCents(results.endBuyerPurchasePriceCents)],
    ["Desired assignment fee", formatCents(assumptions.desiredAssignmentFeeCents)],
    [
      "Projected investor profit",
      formatCents(results.projectedInvestorProfitCents),
      results.projectedInvestorProfitCents < 0,
    ],
    ["Buyer cushion", formatCents(results.remainingBuyerCushionCents), results.remainingBuyerCushionCents < 0],
  ];

  const explanation = explainClassification(results, hasSufficientPropertyInfo);

  return (
    <aside className="lg:sticky lg:top-6 rounded-2xl border border-border-strong bg-surface-2 p-6 flex flex-col gap-5">
      <div>
        <p className="text-xs text-muted mb-2">Deal classification</p>
        <ClassificationBadge classification={results.dealClassification} />
        <details className="group mt-3">
          <summary className="flex cursor-pointer list-none items-center gap-1 text-xs text-white/50 hover:text-white/80">
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

      <dl className="flex flex-col gap-3">
        {rows.map(([label, value, negative]) => (
          <div key={label} className="flex items-center justify-between gap-3">
            <dt className="text-sm text-muted">{label}</dt>
            <dd className={`text-sm font-semibold tabular-nums ${negative ? "text-red-400" : "text-white"}`}>{value}</dd>
          </div>
        ))}
      </dl>

      <div className="h-px bg-border" />

      <button
        type="button"
        onClick={onSave}
        disabled={isSaving}
        className="inline-flex items-center justify-center gap-2 h-11 rounded-full bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-60"
      >
        {justSaved ? <Check className="h-4 w-4" /> : null}
        {justSaved ? "Saved" : isSaving ? "Saving..." : "Save Deal"}
      </button>
      <p className="text-[11px] text-muted -mt-2 text-center">Saved to this browser only — not synced to the cloud.</p>
    </aside>
  );
}
