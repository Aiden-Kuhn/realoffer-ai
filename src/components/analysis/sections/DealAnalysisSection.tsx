"use client";

import { AlertTriangle } from "lucide-react";
import { AssumptionsForm } from "@/components/analysis/AssumptionsForm";
import { InvestmentAnalyst } from "@/components/analysis/InvestmentAnalyst";
import { DealFinancialsPanel } from "@/components/analysis/DealFinancialsPanel";
import { CalculationExplainer } from "@/components/analysis/CalculationExplainer";
import { textareaClasses } from "@/components/shared/Field";
import { DEAL_PIPELINE_STATUSES, DEAL_PIPELINE_STATUS_LABELS, type DealAssumptions, type DealPipelineStatus } from "@/types/deal";
import type { RepairEstimateState } from "@/lib/calculations/repairs";
import type { ComparableSale, PropertyRecord } from "@/lib/property/types";
import type { DealFinancialResults } from "@/lib/calculations/types";
import type { InvestmentAnalysisResult } from "@/lib/investmentAnalysis/types";

type DealAnalysisSectionProps = {
  dealId: string;
  property: PropertyRecord;
  comparables: ComparableSale[];
  repairEstimate: RepairEstimateState;
  repairCents: number;
  arvCents: number;
  assumptions: DealAssumptions;
  onChangeAssumptions: (next: DealAssumptions) => void;
  results: DealFinancialResults | null;
  calculationError: string | null;
  hasSufficientPropertyInfo: boolean;
  savedAnalysis: InvestmentAnalysisResult | undefined;
  onAnalysisChange: (analysis: InvestmentAnalysisResult) => void;
  status: DealPipelineStatus;
  onChangeStatus: (status: DealPipelineStatus) => void;
  notes: string;
  onChangeNotes: (notes: string) => void;
};

/** Everything about whether/how this deal works: the deterministic +
 * AI-assisted verdict first (what most users open this section for), then
 * supporting financial detail, then the assumptions that drive it all, then
 * deal-tracking metadata (status/notes) at the end. */
export function DealAnalysisSection({
  dealId,
  property,
  comparables,
  repairEstimate,
  repairCents,
  arvCents,
  assumptions,
  onChangeAssumptions,
  results,
  calculationError,
  hasSufficientPropertyInfo,
  savedAnalysis,
  onAnalysisChange,
  status,
  onChangeStatus,
  notes,
  onChangeNotes,
}: DealAnalysisSectionProps) {
  return (
    <div className="flex flex-col gap-6">
      {calculationError ? (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3.5 text-sm text-red-300">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            <span className="font-medium">Can&apos;t calculate this deal right now:</span> {calculationError} Adjust the assumptions below to
            continue.
          </span>
        </div>
      ) : null}

      {results ? (
        <>
          <InvestmentAnalyst
            dealId={dealId}
            property={property}
            comparables={comparables}
            repairEstimate={repairEstimate}
            assumptions={assumptions}
            results={results}
            savedAnalysis={savedAnalysis}
            onAnalysisChange={onAnalysisChange}
          />
          <DealFinancialsPanel
            repairCents={repairCents}
            results={results}
            assumptions={assumptions}
            hasSufficientPropertyInfo={hasSufficientPropertyInfo}
          />
        </>
      ) : null}

      <AssumptionsForm assumptions={assumptions} onChange={onChangeAssumptions} />

      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="text-sm font-semibold text-white mb-3">Status and notes</h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="sm:w-56 shrink-0">
            <label htmlFor="status" className="block text-sm font-medium text-white/80 mb-1.5">
              Pipeline status
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => onChangeStatus(e.target.value as DealPipelineStatus)}
              className="w-full h-11 rounded-lg border border-border bg-surface px-3.5 text-[15px] text-white outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 appearance-none"
            >
              {DEAL_PIPELINE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {DEAL_PIPELINE_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label htmlFor="notes" className="block text-sm font-medium text-white/80 mb-1.5">
              Notes
            </label>
            <textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => onChangeNotes(e.target.value)}
              placeholder="Add notes about this deal..."
              className={textareaClasses}
            />
          </div>
        </div>
      </section>

      {results ? (
        <CalculationExplainer
          inputs={{
            listPriceCents: property.listPriceCents ?? 0,
            contractPriceCents: assumptions.contractPriceCents,
            arvCents,
            repairCostCents: repairCents,
            desiredAssignmentFeeCents: assumptions.desiredAssignmentFeeCents,
            buyerClosingCostsCents: assumptions.buyerClosingCostsCents,
            holdingCostsCents: assumptions.holdingCostsCents,
            financingCostsCents: assumptions.financingCostsCents,
            sellingCostsCents: assumptions.sellingCostsCents,
            investorTargetProfitCents: assumptions.investorTargetProfitCents,
            investorArvPercentage: assumptions.investorArvPercentage,
            maoMethod: assumptions.maoMethod,
          }}
          results={results}
        />
      ) : null}
    </div>
  );
}
