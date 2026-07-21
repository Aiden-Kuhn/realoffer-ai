"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Trash2, ArrowLeft, FileQuestion, AlertTriangle, RefreshCw, Loader2, FileSignature } from "lucide-react";
import Link from "next/link";
import { useSetPageHeader } from "@/components/dashboard/PageHeaderContext";
import { useMounted } from "@/hooks/useMounted";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useDeal } from "@/hooks/useDeal";
import { dealRepository } from "@/lib/repositories/dealRepository";
import { buyerProfileRepository } from "@/lib/repositories/buyerProfileRepository";
import { contractDefaultsRepository } from "@/lib/repositories/contractDefaultsRepository";
import { contractRepository } from "@/lib/repositories/contractRepository";
import {
  buildPrefillFromDeal,
  GENERAL_PURCHASE_AGREEMENT_TEMPLATE_ID,
  GENERAL_PURCHASE_AGREEMENT_TEMPLATE_VERSION,
} from "@/lib/contracts/templates/generalPurchaseAgreement";
import { clearDraftDeal } from "@/lib/repositories/draftDealStore";
import { buildDealFinancialResults, resolveSelectedArvCents } from "@/lib/calculations/buildDealResults";
import { computeRepairTotalCents } from "@/lib/calculations/repairs";
import { computeDealRisks } from "@/lib/calculations/risks";
import { hasSufficientPropertyInfo } from "@/lib/property/completeness";
import { analyzePropertyAddress } from "@/lib/property/providerSelection";
import { describeProviderErrorCode } from "@/lib/property/errorMessages";
import { PropertyHeader } from "@/components/analysis/PropertyHeader";
import { DataSourceBanner } from "@/components/analysis/DataSourceBanner";
import { PropertyOverview } from "@/components/analysis/PropertyOverview";
import { AssumptionsForm } from "@/components/analysis/AssumptionsForm";
import { ArvPanel } from "@/components/analysis/ArvPanel";
import { RepairEstimator } from "@/components/analysis/RepairEstimator";
import { ComparablesTable } from "@/components/analysis/ComparablesTable";
import { RiskList } from "@/components/analysis/RiskList";
import { InvestmentAnalyst } from "@/components/analysis/InvestmentAnalyst";
import { CalculationExplainer } from "@/components/analysis/CalculationExplainer";
import { SummaryPanel } from "@/components/analysis/SummaryPanel";
import { Disclaimers } from "@/components/shared/Disclaimers";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { textareaClasses } from "@/components/shared/Field";
import { DEAL_PIPELINE_STATUSES, DEAL_PIPELINE_STATUS_LABELS, type Deal, type DealAssumptions, type DealPipelineStatus } from "@/types/deal";
import type { RepairEstimateState } from "@/lib/calculations/repairs";
import type { ComparableSale, PropertyRecord } from "@/lib/property/types";
import { DealInputValidationError, type DealFinancialResults } from "@/lib/calculations/types";
import type { InvestmentAnalysisResult } from "@/lib/investmentAnalysis/types";
import { buildInvestmentAnalysisContext } from "@/lib/investmentAnalysis/buildContext";
import { computeDealScore } from "@/lib/investmentAnalysis/dealScore";

export function DealWorkspace({ id }: { id: string }) {
  const mounted = useMounted();
  const { deal, isSaved, isLoading } = useDeal(id);

  const addressLine = deal ? deal.property.address.line1 : "Deal";
  const breadcrumbs = useMemo(() => ["Saved Deals", addressLine], [addressLine]);
  useSetPageHeader(addressLine, breadcrumbs);

  if (!mounted || isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-accent-3" />
      </div>
    );
  }

  if (!deal) {
    return (
      <EmptyState
        icon={FileQuestion}
        title="Deal not found"
        description="This analysis doesn't exist, was deleted, or its draft expired with your browser session."
        action={
          <Link
            href="/dashboard/deals"
            className="inline-flex items-center gap-2 h-10 rounded-full bg-white px-4 text-sm font-medium text-black hover:bg-white/90 transition-colors"
          >
            Back to saved deals
          </Link>
        }
      />
    );
  }

  return <DealWorkspaceContent key={deal.id} deal={deal} isSaved={isSaved} />;
}

function DealWorkspaceContent({ deal, isSaved }: { deal: Deal; isSaved: boolean }) {
  const router = useRouter();
  const { user } = useAuth();
  const [isCreatingContract, setIsCreatingContract] = useState(false);

  const [property, setProperty] = useState<PropertyRecord>(deal.property);
  const [assumptions, setAssumptions] = useState<DealAssumptions>(deal.assumptions);
  const [repairEstimate, setRepairEstimate] = useState<RepairEstimateState>(deal.repairEstimate);
  const [comparables, setComparables] = useState<ComparableSale[]>(deal.comparables);
  const [notes, setNotes] = useState(deal.notes);
  const [status, setStatus] = useState<DealPipelineStatus>(deal.status);
  const [investmentAnalysis, setInvestmentAnalysis] = useState<InvestmentAnalysisResult | undefined>(deal.investmentAnalysis);

  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { results, calculationError } = useMemo<{
    results: DealFinancialResults | null;
    calculationError: string | null;
  }>(() => {
    try {
      return { results: buildDealFinancialResults(property, comparables, repairEstimate, assumptions), calculationError: null };
    } catch (error) {
      const message =
        error instanceof DealInputValidationError
          ? error.message
          : "One of these numbers is out of a supported range.";
      return { results: null, calculationError: message };
    }
  }, [property, assumptions, repairEstimate, comparables]);

  const arvCents = useMemo(
    () => resolveSelectedArvCents(property, comparables, assumptions.arvOverrideCents),
    [property, assumptions.arvOverrideCents, comparables],
  );

  const repairCents = useMemo(
    () => computeRepairTotalCents(repairEstimate, property.squareFootage),
    [repairEstimate, property.squareFootage],
  );

  const sufficientInfo = hasSufficientPropertyInfo(property);
  const risks = results ? computeDealRisks(property, comparables, results) : [];

  const dealScore = useMemo(() => {
    if (!results) return null;
    const context = buildInvestmentAnalysisContext(property, comparables, repairEstimate, assumptions, results);
    return computeDealScore(context);
  }, [property, comparables, repairEstimate, assumptions, results]);

  async function handleSave() {
    if (!results) return;
    setIsSaving(true);
    setActionError(null);
    const toSave: Deal = {
      ...deal,
      status,
      notes,
      property,
      comparables,
      assumptions,
      repairEstimate,
      results,
      investmentAnalysis,
      dataMode: property.source === "rentcast" ? "real" : "demo",
    };
    try {
      await dealRepository.save(toSave);
      clearDraftDeal(deal.id);
      setJustSaved(true);
      window.setTimeout(() => setJustSaved(false), 2000);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Couldn't save this deal. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDuplicate() {
    setActionError(null);
    try {
      const copy = await dealRepository.duplicate(deal.id);
      if (copy) router.push(`/dashboard/deals/${copy.id}`);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Couldn't duplicate this deal. Please try again.");
    }
  }

  async function handleCreateContract() {
    setActionError(null);
    setIsCreatingContract(true);
    try {
      const [buyerProfile, dueDiligenceDefaults] = await Promise.all([
        buyerProfileRepository.get(),
        contractDefaultsRepository.getDueDiligenceDefaults(),
      ]);
      const formData = buildPrefillFromDeal(deal, buyerProfile, dueDiligenceDefaults?.values ?? null);
      // Fall back to the login email only when the saved profile didn't
      // already supply one — a user may deliberately want a different
      // contact email on contracts than the one they sign in with.
      if (user?.email && !formData.buyer.email) formData.buyer.email = user.email;
      const contract = await contractRepository.create({
        dealId: deal.id,
        templateId: GENERAL_PURCHASE_AGREEMENT_TEMPLATE_ID,
        templateVersion: GENERAL_PURCHASE_AGREEMENT_TEMPLATE_VERSION,
        formData,
      });
      router.push(`/dashboard/contracts/${contract.id}`);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Couldn't start a purchase agreement for this deal. Please try again.");
      setIsCreatingContract(false);
    }
  }

  async function handleDelete() {
    setActionError(null);
    try {
      await dealRepository.delete(deal.id);
      if (!isSaved) clearDraftDeal(deal.id);
      router.push("/dashboard/deals");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Couldn't delete this deal. Please try again.");
    }
  }

  async function handleRefreshPropertyData() {
    setIsRefreshing(true);
    setRefreshError(null);
    try {
      const result = await analyzePropertyAddress(property.address, { forceRefresh: true });
      if (result.status === "ok") {
        setProperty(result.property);
        setComparables(result.property.comparables.map((c) => ({ ...c })));
      } else if (result.status === "error") {
        setRefreshError(describeProviderErrorCode(result.error.code));
      } else {
        setRefreshError("Multiple matching properties were found for this address — refresh isn't available for ambiguous matches yet.");
      }
    } catch {
      setRefreshError("Something went wrong refreshing this property's data.");
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/dashboard/deals" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Saved deals
        </Link>
        {isSaved ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCreateContract}
              disabled={isCreatingContract}
              className="inline-flex items-center gap-1.5 h-9 rounded-full bg-white px-3.5 text-xs font-medium text-black hover:bg-white/90 active:scale-[0.98] transition-all duration-150 disabled:opacity-60"
            >
              {isCreatingContract ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSignature className="h-3.5 w-3.5" />}
              {isCreatingContract ? "Starting…" : "Create Purchase Agreement"}
            </button>
            <button
              type="button"
              onClick={handleDuplicate}
              className="inline-flex items-center gap-1.5 h-9 rounded-full border border-border px-3.5 text-xs font-medium text-white/70 hover:text-white hover:border-border-strong active:scale-[0.98] transition-all duration-150"
            >
              <Copy className="h-3.5 w-3.5" />
              Duplicate
            </button>
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="inline-flex items-center gap-1.5 h-9 rounded-full border border-red-400/25 px-3.5 text-xs font-medium text-red-300 hover:bg-red-400/10 active:scale-[0.98] transition-all duration-150"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        ) : (
          <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-300">
            Unsaved analysis
          </span>
        )}
      </div>

      {actionError ? (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3.5 text-sm text-red-300">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          {actionError}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
        <div className="flex flex-col gap-6 min-w-0">
          <PropertyHeader property={property} status={status} />
          <DataSourceBanner source={property.source} />

          <div className="flex flex-wrap items-center justify-between gap-2 -mt-2">
            <p className="text-xs text-muted">
              Last retrieved {new Date(property.lastUpdated).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
            <button
              type="button"
              onClick={handleRefreshPropertyData}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 h-8 rounded-full border border-border px-3 text-xs font-medium text-white/70 hover:text-white hover:border-border-strong active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:active:scale-100"
            >
              {isRefreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              {isRefreshing ? "Refreshing..." : "Refresh Property Data"}
            </button>
          </div>
          {refreshError ? <p className="text-xs text-red-400 -mt-3">{refreshError}</p> : null}

          <PropertyOverview property={property} />
          <AssumptionsForm assumptions={assumptions} onChange={setAssumptions} />
          <ArvPanel
            property={property}
            comparables={comparables}
            arvOverrideCents={assumptions.arvOverrideCents}
            onChangeOverride={(cents) => setAssumptions({ ...assumptions, arvOverrideCents: cents })}
          />
          <RepairEstimator repairEstimate={repairEstimate} squareFootage={property.squareFootage} onChange={setRepairEstimate} />
          <ComparablesTable comparables={comparables} onChange={setComparables} />

          {calculationError ? (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3.5 text-sm text-red-300">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                <span className="font-medium">Can&apos;t calculate this deal right now:</span> {calculationError} Adjust the
                assumptions above to continue.
              </span>
            </div>
          ) : (
            <RiskList risks={risks} />
          )}

          {results ? (
            <InvestmentAnalyst
              dealId={deal.id}
              property={property}
              comparables={comparables}
              repairEstimate={repairEstimate}
              assumptions={assumptions}
              results={results}
              savedAnalysis={investmentAnalysis}
              onAnalysisChange={setInvestmentAnalysis}
            />
          ) : null}

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
                  onChange={(e) => setStatus(e.target.value as DealPipelineStatus)}
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
                  onChange={(e) => setNotes(e.target.value)}
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

          <Disclaimers />
        </div>

        {results ? (
          <SummaryPanel
            arvCents={arvCents}
            repairCents={repairCents}
            results={results}
            assumptions={assumptions}
            hasSufficientPropertyInfo={sufficientInfo}
            dealScore={dealScore}
            onSave={handleSave}
            isSaving={isSaving}
            justSaved={justSaved}
          />
        ) : (
          <aside className="lg:sticky lg:top-6 rounded-2xl border border-red-400/25 bg-surface-2 p-6">
            <p className="text-sm text-red-300 font-medium">Summary unavailable</p>
            <p className="mt-2 text-sm text-muted leading-relaxed">
              One of the assumption values above is out of a supported range, so results can&apos;t be calculated. Fix
              the highlighted input to see the summary and save the deal again.
            </p>
          </aside>
        )}
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete this deal?"
        description="This will permanently remove the saved analysis from your account. This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
