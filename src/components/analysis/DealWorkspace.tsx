"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, BarChart3, Calculator, ClipboardList, Copy, FileQuestion, FileSignature, Hammer, Trash2 } from "lucide-react";
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
import { getStoredWorkspaceSection, saveWorkspaceSection, type WorkspaceSectionKey } from "@/lib/repositories/workspaceSectionStore";
import { buildDealFinancialResults, resolveSelectedArvCents } from "@/lib/calculations/buildDealResults";
import { computeRepairTotalCents } from "@/lib/calculations/repairs";
import { computeDealRisks } from "@/lib/calculations/risks";
import { formatCents } from "@/lib/calculations/money";
import { hasSufficientPropertyInfo } from "@/lib/property/completeness";
import { withEffectiveBedsBaths } from "@/lib/property/bedsBathsOverride";
import { formatBedsBaths } from "@/lib/property/labels";
import { analyzePropertyAddress } from "@/lib/property/providerSelection";
import { describeProviderErrorCode } from "@/lib/property/errorMessages";
import { CONDITION_PRESETS } from "@/config/repairPresets";
import { PropertySummaryBar } from "@/components/analysis/PropertySummaryBar";
import { WorkspaceNavigationGrid, type WorkspaceCard } from "@/components/analysis/WorkspaceNavigationGrid";
import { WorkspaceSectionContent } from "@/components/analysis/WorkspaceSectionContent";
import { DealAnalysisSection } from "@/components/analysis/sections/DealAnalysisSection";
import { ArvComparablesSection } from "@/components/analysis/sections/ArvComparablesSection";
import { RepairEstimator } from "@/components/analysis/RepairEstimator";
import { PropertyDetailsSection } from "@/components/analysis/sections/PropertyDetailsSection";
import { RisksSection } from "@/components/analysis/sections/RisksSection";
import { ContractSection } from "@/components/analysis/sections/ContractSection";
import { Disclaimers } from "@/components/shared/Disclaimers";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { type Deal, type DealAssumptions, type DealPipelineStatus } from "@/types/deal";
import type { RepairEstimateState } from "@/lib/calculations/repairs";
import type { ComparableSale, PropertyRecord } from "@/lib/property/types";
import { DealInputValidationError, type DealFinancialResults } from "@/lib/calculations/types";
import type { InvestmentAnalysisResult } from "@/lib/investmentAnalysis/types";
import { buildInvestmentAnalysisContext } from "@/lib/investmentAnalysis/buildContext";
import { computeDealScore } from "@/lib/investmentAnalysis/dealScore";

const SECTION_DESCRIPTIONS: Record<WorkspaceSectionKey, string> = {
  dealAnalysis: "Offer calculations, editable assumptions, and the investment verdict for this deal.",
  arvComparables: "Comparable sales and the selected after-repair value used in calculations.",
  repairEstimate: "Estimate rehab costs by condition preset, category, or a manual total.",
  propertyDetails: "Bedrooms, bathrooms, square footage, and where each fact comes from.",
  risks: "Warnings, missing information, and anything else worth reviewing before moving forward.",
  contract: "Generate a purchase agreement prefilled from this deal and your saved defaults.",
};

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
  const [bedroomsOverride, setBedroomsOverride] = useState<number | null>(deal.bedroomsOverride ?? null);
  const [bathroomsOverride, setBathroomsOverride] = useState<number | null>(deal.bathroomsOverride ?? null);
  const [assumptions, setAssumptions] = useState<DealAssumptions>(deal.assumptions);
  const [repairEstimate, setRepairEstimate] = useState<RepairEstimateState>(deal.repairEstimate);
  const [comparables, setComparables] = useState<ComparableSale[]>(deal.comparables);
  const [notes, setNotes] = useState(deal.notes);
  const [status, setStatus] = useState<DealPipelineStatus>(deal.status);
  const [investmentAnalysis, setInvestmentAnalysis] = useState<InvestmentAnalysisResult | undefined>(deal.investmentAnalysis);

  // Which workspace card is open — defaults to Deal Analysis for a deal
  // with no stored preference (including every freshly-analyzed deal),
  // and remembers the choice per-deal across visits (see
  // lib/repositories/workspaceSectionStore.ts).
  const [activeSection, setActiveSectionState] = useState<WorkspaceSectionKey>(() => getStoredWorkspaceSection(deal.id) ?? "dealAnalysis");

  function selectSection(key: WorkspaceSectionKey) {
    setActiveSectionState(key);
    saveWorkspaceSection(deal.id, key);
  }

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

  // Reflects the user's bedroom/bathroom correction (if any) — used for
  // every downstream investment calculation and narrative, never for the
  // raw provenance display in PropertyHeader/PropertyOverview, which needs
  // the untouched provider value plus the override separately.
  const effectiveProperty = useMemo(
    () => withEffectiveBedsBaths(property, bedroomsOverride, bathroomsOverride),
    [property, bedroomsOverride, bathroomsOverride],
  );

  const dealScore = useMemo(() => {
    if (!results) return null;
    const context = buildInvestmentAnalysisContext(effectiveProperty, comparables, repairEstimate, assumptions, results);
    return computeDealScore(context);
  }, [effectiveProperty, comparables, repairEstimate, assumptions, results]);

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
      bedroomsOverride,
      bathroomsOverride,
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

  const isProfitNegative = results ? results.projectedInvestorProfitCents < 0 : false;
  const isBedsBathsCorrected = bedroomsOverride !== null || bathroomsOverride !== null;
  const propertyDataSourceLabel = property.source === "rentcast" ? "RentCast data" : "Demo data";
  const propertyDetailsDescription =
    [
      formatBedsBaths(effectiveProperty.bedrooms, effectiveProperty.bathrooms),
      property.squareFootage ? `${property.squareFootage.toLocaleString()} sqft` : null,
    ]
      .filter(Boolean)
      .join(" • ") || "Bedrooms, bathrooms, sqft & more";

  const workspaceCards: WorkspaceCard[] = [
    {
      key: "dealAnalysis",
      icon: Calculator,
      title: "Deal Analysis",
      description: "Offer calculations & assumptions",
      metric: results ? formatCents(results.projectedInvestorProfitCents) : "Needs attention",
      metricTone: results ? (isProfitNegative ? "negative" : "positive") : "warning",
    },
    {
      key: "arvComparables",
      icon: BarChart3,
      title: "ARV & Comparable Sales",
      description: `${comparables.length} comparable propert${comparables.length === 1 ? "y" : "ies"}`,
      metric: `Expected ARV ${formatCents(arvCents)}`,
    },
    {
      key: "repairEstimate",
      icon: Hammer,
      title: "Repair Estimate",
      description: CONDITION_PRESETS[repairEstimate.conditionPreset].label,
      metric: `Estimated ${formatCents(repairCents)}`,
    },
    {
      key: "propertyDetails",
      icon: ClipboardList,
      title: "Property Details",
      description: propertyDetailsDescription,
      metric: isBedsBathsCorrected ? `${propertyDataSourceLabel} • Corrected` : propertyDataSourceLabel,
    },
    {
      key: "risks",
      icon: AlertTriangle,
      title: "Risks",
      description: risks.length > 0 ? `${risks.length} Issue${risks.length === 1 ? "" : "s"} Found` : "No issues found",
      metricTone: risks.length > 0 ? "warning" : "neutral",
    },
    {
      key: "contract",
      icon: FileSignature,
      title: "Contract",
      description: isSaved ? "Ready to Generate" : "Save this property first",
    },
  ];

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

      <PropertySummaryBar
        property={property}
        status={status}
        bedroomsOverride={bedroomsOverride}
        bathroomsOverride={bathroomsOverride}
        dealScore={dealScore}
        results={results}
        arvCents={arvCents}
        isSaved={isSaved}
        isSaving={isSaving}
        justSaved={justSaved}
        onSave={handleSave}
        isCreatingContract={isCreatingContract}
        onCreateContract={handleCreateContract}
      />

      <WorkspaceNavigationGrid cards={workspaceCards} activeSection={activeSection} onSelect={selectSection} />

      <WorkspaceSectionContent
        sectionKey={activeSection}
        title={workspaceCards.find((c) => c.key === activeSection)?.title ?? ""}
        description={SECTION_DESCRIPTIONS[activeSection]}
      >
        {activeSection === "dealAnalysis" ? (
          <DealAnalysisSection
            dealId={deal.id}
            property={effectiveProperty}
            comparables={comparables}
            repairEstimate={repairEstimate}
            repairCents={repairCents}
            arvCents={arvCents}
            assumptions={assumptions}
            onChangeAssumptions={setAssumptions}
            results={results}
            calculationError={calculationError}
            hasSufficientPropertyInfo={sufficientInfo}
            savedAnalysis={investmentAnalysis}
            onAnalysisChange={setInvestmentAnalysis}
            status={status}
            onChangeStatus={setStatus}
            notes={notes}
            onChangeNotes={setNotes}
          />
        ) : null}
        {activeSection === "arvComparables" ? (
          <ArvComparablesSection
            property={property}
            comparables={comparables}
            onChangeComparables={setComparables}
            arvOverrideCents={assumptions.arvOverrideCents}
            onChangeArvOverride={(cents) => setAssumptions({ ...assumptions, arvOverrideCents: cents })}
          />
        ) : null}
        {activeSection === "repairEstimate" ? (
          <RepairEstimator repairEstimate={repairEstimate} squareFootage={property.squareFootage} onChange={setRepairEstimate} />
        ) : null}
        {activeSection === "propertyDetails" ? (
          <PropertyDetailsSection
            property={property}
            bedroomsOverride={bedroomsOverride}
            bathroomsOverride={bathroomsOverride}
            onChangeBedroomsOverride={setBedroomsOverride}
            onChangeBathroomsOverride={setBathroomsOverride}
            isRefreshing={isRefreshing}
            refreshError={refreshError}
            onRefresh={handleRefreshPropertyData}
          />
        ) : null}
        {activeSection === "risks" ? <RisksSection risks={risks} calculationError={calculationError} /> : null}
        {activeSection === "contract" ? (
          <ContractSection isSaved={isSaved} isCreatingContract={isCreatingContract} onCreateContract={handleCreateContract} />
        ) : null}
      </WorkspaceSectionContent>

      <Disclaimers />

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
