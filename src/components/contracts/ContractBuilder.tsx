"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Check, ChevronLeft, ChevronRight, Cloud, CloudOff, Copy, Archive, FileDown, Loader2 } from "lucide-react";
import { useContract } from "@/hooks/useContract";
import { useDeal } from "@/hooks/useDeal";
import { useAutosave } from "@/hooks/useAutosave";
import { useBuyerProfile } from "@/hooks/useBuyerProfile";
import { useDueDiligenceDefaults } from "@/hooks/useDueDiligenceDefaults";
import { contractFormDataSchema, collectReadyForReviewIssues, collectAdvisoryWarnings, type ContractFormDataInput } from "@/lib/contracts/schema";
import { contractRepository } from "@/lib/repositories/contractRepository";
import { buyerProfileRepository } from "@/lib/repositories/buyerProfileRepository";
import { contractDefaultsRepository } from "@/lib/repositories/contractDefaultsRepository";
import { getTemplateMeta } from "@/lib/contracts/templates/index";
import { US_STATES, stateNameForCode } from "@/lib/contracts/usStates";
import { buildInvestmentAnalysisContext } from "@/lib/investmentAnalysis/buildContext";
import { computeOfferGuidance } from "@/lib/investmentAnalysis/offerGuidance";
import { withEffectiveBedsBaths } from "@/lib/property/bedsBathsOverride";
import type { ContractFormData, PartyInfo, AssignmentSection as AssignmentSectionData } from "@/lib/contracts/types";
import type { DueDiligenceDefaultsValues } from "@/lib/contractDefaults/types";
import { PropertyStep } from "@/components/contracts/PropertyStep";
import { PartiesStep } from "@/components/contracts/PartiesStep";
import { PurchaseTermsStep } from "@/components/contracts/PurchaseTermsStep";
import { DueDiligenceStep } from "@/components/contracts/DueDiligenceStep";
import { AssignmentStep } from "@/components/contracts/AssignmentStep";
import { AdditionalTermsStep } from "@/components/contracts/AdditionalTermsStep";
import { ReviewStep } from "@/components/contracts/ReviewStep";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import Link from "next/link";
import { FileQuestion } from "lucide-react";

const DEFAULT_ASSIGNMENT: AssignmentSectionData = {
  includeAssignmentClause: false,
  assignable: null,
  buyerMayNominate: false,
  assignmentFeeExcludedFromContract: false,
  includeDoubleClosingNote: false,
};

type StepKey = "property" | "parties" | "purchaseTerms" | "dueDiligence" | "assignment" | "additionalTerms" | "review";

export function ContractBuilder({ id }: { id: string }) {
  const { contract, isLoading } = useContract(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-accent-3" />
      </div>
    );
  }

  if (!contract) {
    return (
      <EmptyState
        icon={FileQuestion}
        title="Contract not found"
        description="This draft doesn't exist, was deleted, or belongs to a different account."
        action={
          <Link href="/dashboard/contracts" className="inline-flex items-center gap-2 h-10 rounded-full bg-white px-4 text-sm font-medium text-black hover:bg-white/90 transition-colors">
            Back to contracts
          </Link>
        }
      />
    );
  }

  return <ContractBuilderContent key={contract.id} contract={contract} />;
}

function ContractBuilderContent({ contract }: { contract: NonNullable<ReturnType<typeof useContract>["contract"]> }) {
  const router = useRouter();
  const [step, setStep] = useState<StepKey>("property");
  const [assignmentEnabled, setAssignmentEnabled] = useState(contract.formData.assignment !== null);
  const [status, setStatus] = useState(contract.status);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  // useForm is typed against the schema's *input* shape (fields with a zod
  // .default() are optional on input, required on output) — every
  // consumer below needs the fully-defaulted output shape instead, so
  // watched values are re-parsed through the schema once here rather than
  // trusting react-hook-form's raw (possibly transiently-undefined) state.
  const methods = useForm<ContractFormDataInput>({
    resolver: zodResolver(contractFormDataSchema),
    defaultValues: contract.formData,
    mode: "onBlur",
  });

  const watched = useWatch({ control: methods.control });
  const parsedWatched = contractFormDataSchema.safeParse(watched);
  const formData: ContractFormData = parsedWatched.success ? parsedWatched.data : contract.formData;

  const save = useMemo(
    () => async (data: ContractFormData) => {
      const saved = await contractRepository.save(contract.id, { formData: data });
      setStatus(saved.status);
    },
    [contract.id],
  );

  const autosave = useAutosave(formData, save, { delayMs: 900 });

  const templateMeta = getTemplateMeta(contract.templateId);

  const { deal } = useDeal(contract.dealId);
  const { buyerProfile, setBuyerProfile } = useBuyerProfile();
  const { dueDiligenceDefaults, setDueDiligenceDefaults } = useDueDiligenceDefaults();

  // Independent of contract autosave: only fires when the user explicitly
  // clicks "save to my profile" in PartiesStep — never as a side effect of
  // editing this contract's buyer fields.
  async function handleSaveBuyerProfile(party: PartyInfo) {
    const saved = await buyerProfileRepository.save(party);
    setBuyerProfile(saved);
  }

  // Independent of contract autosave: only fires when the user explicitly
  // clicks "save these as my defaults" in DueDiligenceStep — never as a
  // side effect of editing this contract's due-diligence fields.
  async function handleSaveDueDiligenceDefaults(values: DueDiligenceDefaultsValues) {
    const saved = await contractDefaultsRepository.saveDueDiligenceDefaults(values);
    setDueDiligenceDefaults(saved);
  }

  const offerGuidance = useMemo(() => {
    if (!deal) return null;
    try {
      const property = withEffectiveBedsBaths(deal.property, deal.bedroomsOverride, deal.bathroomsOverride);
      const context = buildInvestmentAnalysisContext(property, deal.comparables, deal.repairEstimate, deal.assumptions, deal.results);
      return computeOfferGuidance(context);
    } catch {
      // Deal data doesn't currently support a valid calculation (e.g. an
      // out-of-range assumption) — the price selector just falls back to
      // "proposed" and "custom" only, it never blocks the contract builder.
      return null;
    }
  }, [deal]);

  const steps: Array<{ key: StepKey; label: string }> = [
    { key: "property", label: "Property" },
    { key: "parties", label: "Parties" },
    { key: "purchaseTerms", label: "Purchase Terms" },
    { key: "dueDiligence", label: "Due Diligence" },
    ...(assignmentEnabled ? [{ key: "assignment" as const, label: "Assignment" }] : []),
    { key: "additionalTerms", label: "Additional Terms" },
    { key: "review", label: "Review" },
  ];
  const stepIndex = steps.findIndex((s) => s.key === step);

  function toggleAssignmentSection(enabled: boolean) {
    setAssignmentEnabled(enabled);
    methods.setValue("assignment", enabled ? DEFAULT_ASSIGNMENT : null, { shouldDirty: true });
    if (!enabled && step === "assignment") setStep("purchaseTerms");
  }

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  async function goToReadyForReview() {
    if (isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    try {
      await autosave.saveNow();
      const parsed = contractFormDataSchema.safeParse(methods.getValues());
      if (!parsed.success) return;
      const issues = collectReadyForReviewIssues(parsed.data, contract.createdAt);
      if (issues.length > 0) {
        setStep("review");
        return;
      }
      setStatusError(null);
      const saved = await contractRepository.save(contract.id, { status: "ready_for_review" });
      setStatus(saved.status);
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : "Couldn't update status. Please try again.");
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  const [jurisdictionState, setJurisdictionState] = useState(contract.jurisdictionState);
  const [savingJurisdiction, setSavingJurisdiction] = useState(false);

  async function handleJurisdictionChange(next: string) {
    const normalized = next === "" ? null : next;
    setJurisdictionState(normalized);
    setSavingJurisdiction(true);
    try {
      await contractRepository.save(contract.id, { jurisdictionState: normalized });
    } catch {
      // Non-critical — the selector is informational only in this
      // milestone (it never changes which template renders), so a failed
      // save here doesn't need to block or roll back the UI.
    } finally {
      setSavingJurisdiction(false);
    }
  }

  async function handleDuplicate() {
    setIsDuplicating(true);
    setStatusError(null);
    try {
      const copy = await contractRepository.duplicate(contract.id);
      if (copy) router.push(`/dashboard/contracts/${copy.id}`);
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : "Couldn't duplicate this contract. Please try again.");
    } finally {
      setIsDuplicating(false);
    }
  }

  async function handleArchive() {
    setIsArchiving(true);
    setStatusError(null);
    try {
      await contractRepository.archive(contract.id);
      router.push("/dashboard/contracts");
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : "Couldn't archive this contract. Please try again.");
      setIsArchiving(false);
    }
  }

  const parsedForIssues = contractFormDataSchema.safeParse(formData);
  const readyIssues = parsedForIssues.success ? collectReadyForReviewIssues(parsedForIssues.data, contract.createdAt) : ["Some fields couldn't be validated."];
  const warnings = parsedForIssues.success ? collectAdvisoryWarnings(parsedForIssues.data) : [];

  return (
    <FormProvider {...methods}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href={`/dashboard/deals/${contract.dealId}`} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-white transition-colors">
              <ChevronLeft className="h-4 w-4" />
              Back to property
            </Link>
            <span className="text-white/20">•</span>
            <AutosaveIndicator status={autosave.status} error={autosave.error} />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDuplicate}
              disabled={isDuplicating}
              className="inline-flex items-center gap-1.5 h-9 rounded-full border border-border px-3.5 text-xs font-medium text-white/70 hover:text-white hover:border-border-strong active:scale-[0.98] transition-all duration-150 disabled:opacity-50"
            >
              <Copy className="h-3.5 w-3.5" />
              Duplicate
            </button>
            <button
              type="button"
              onClick={() => setArchiveOpen(true)}
              className="inline-flex items-center gap-1.5 h-9 rounded-full border border-border px-3.5 text-xs font-medium text-white/70 hover:text-white hover:border-border-strong active:scale-[0.98] transition-all duration-150"
            >
              <Archive className="h-3.5 w-3.5" />
              Archive
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-white/70 shrink-0">
            Jurisdiction:
            <select
              value={jurisdictionState ?? ""}
              onChange={(e) => handleJurisdictionChange(e.target.value)}
              disabled={savingJurisdiction}
              className="h-9 rounded-lg border border-border bg-surface px-3 text-xs text-white outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 disabled:opacity-60"
            >
              <option value="">No state selected</option>
              {US_STATES.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-xs text-amber-100 leading-relaxed">
          {jurisdictionState
            ? `No attorney-reviewed template exists for ${stateNameForCode(jurisdictionState) ?? jurisdictionState} yet — this is the same general draft template used for every state. `
            : ""}
          {templateMeta?.disclaimer ?? "This is a draft template, not legal advice. Have a licensed attorney review this before use."}
        </div>

        {statusError ? (
          <div className="flex items-start gap-2.5 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3.5 text-sm text-red-300">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            {statusError}
          </div>
        ) : null}

        <StepProgress steps={steps} currentKey={step} onSelect={setStep} statusLabel={status} />

        <div className="rounded-2xl border border-border bg-surface p-6">
          {step === "property" ? <PropertyStep /> : null}
          {step === "parties" ? <PartiesStep buyerProfile={buyerProfile} onSaveBuyerProfile={handleSaveBuyerProfile} /> : null}
          {step === "purchaseTerms" ? (
            <PurchaseTermsStep
              assignmentEnabled={assignmentEnabled}
              onToggleAssignment={toggleAssignmentSection}
              proposedContractPriceCents={deal?.assumptions.contractPriceCents ?? null}
              offerGuidance={offerGuidance}
            />
          ) : null}
          {step === "dueDiligence" ? (
            <DueDiligenceStep
              dueDiligenceDefaults={dueDiligenceDefaults}
              onSaveDueDiligenceDefaults={handleSaveDueDiligenceDefaults}
              contractCreatedAt={contract.createdAt}
            />
          ) : null}
          {step === "assignment" && assignmentEnabled ? <AssignmentStep /> : null}
          {step === "additionalTerms" ? <AdditionalTermsStep /> : null}
          {step === "review" ? (
            <ReviewStep
              formData={formData}
              contractId={contract.id}
              contractStatus={status}
              issues={readyIssues}
              warnings={warnings}
              templateLabel={templateMeta?.label ?? contract.templateId}
              templateVersion={contract.templateVersion}
            />
          ) : null}
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => stepIndex > 0 && setStep(steps[stepIndex - 1].key)}
            disabled={stepIndex === 0}
            className="inline-flex items-center gap-1.5 h-10 rounded-full border border-border px-4 text-sm font-medium text-white/70 hover:text-white hover:border-border-strong active:scale-[0.98] transition-all duration-150 disabled:opacity-40 disabled:hover:text-white/70"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
          {step === "review" ? (
            <button
              type="button"
              onClick={goToReadyForReview}
              disabled={readyIssues.length > 0 || status === "archived" || isUpdatingStatus}
              className="inline-flex items-center gap-2 h-10 rounded-full bg-white px-5 text-sm font-medium text-black hover:bg-white/90 active:scale-[0.98] transition-all duration-150 disabled:opacity-40"
            >
              {isUpdatingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
              Mark Ready for Review
            </button>
          ) : (
            <button
              type="button"
              onClick={() => stepIndex < steps.length - 1 && setStep(steps[stepIndex + 1].key)}
              className="inline-flex items-center gap-1.5 h-10 rounded-full bg-white px-4 text-sm font-medium text-black hover:bg-white/90 active:scale-[0.98] transition-all duration-150"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={archiveOpen}
        title="Archive this contract draft?"
        description="Archived drafts stay in your account and can still be viewed, but are moved out of your active contracts list."
        confirmLabel={isArchiving ? "Archiving…" : "Archive"}
        onConfirm={handleArchive}
        onCancel={() => setArchiveOpen(false)}
      />
    </FormProvider>
  );
}

function AutosaveIndicator({ status, error }: { status: ReturnType<typeof useAutosave>["status"]; error: string | null }) {
  if (status === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Saving…
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-red-400" title={error ?? undefined}>
        <CloudOff className="h-3.5 w-3.5" />
        Couldn&apos;t save — retrying
      </span>
    );
  }
  if (status === "saved") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
        <Check className="h-3.5 w-3.5" />
        Saved
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
      <Cloud className="h-3.5 w-3.5" />
      Up to date
    </span>
  );
}

function StepProgress({
  steps,
  currentKey,
  onSelect,
  statusLabel,
}: {
  steps: Array<{ key: StepKey; label: string }>;
  currentKey: StepKey;
  onSelect: (key: StepKey) => void;
  statusLabel: string;
}) {
  const currentIndex = steps.findIndex((s) => s.key === currentKey);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {steps.map((s, i) => (
            <button
              key={s.key}
              type="button"
              onClick={() => onSelect(s.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
                i === currentIndex
                  ? "bg-white text-black"
                  : i < currentIndex
                    ? "bg-white/10 text-white/80 hover:bg-white/15"
                    : "bg-white/[0.04] text-white/45 hover:bg-white/[0.07]"
              }`}
            >
              {i + 1}. {s.label}
            </button>
          ))}
        </div>
        <span className="shrink-0 text-[11px] font-medium uppercase tracking-wide text-muted">{statusLabel.replace(/_/g, " ")}</span>
      </div>
      <div className="h-1 w-full rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent to-accent-3 transition-[width] duration-300 ease-out"
          style={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
