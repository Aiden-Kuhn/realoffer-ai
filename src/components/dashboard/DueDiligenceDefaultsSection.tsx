"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, AlertTriangle, Loader2, RotateCcw } from "lucide-react";
import { contractDefaultsRepository } from "@/lib/repositories/contractDefaultsRepository";
import { emptyDueDiligenceDefaultsValues } from "@/lib/contractDefaults/types";
import {
  dueDiligenceDefaultsValuesSchema,
  type DueDiligenceDefaultsFormInput,
  type DueDiligenceDefaultsFormValues,
} from "@/lib/contractDefaults/schema";
import { PROPERTY_CONDITIONS } from "@/lib/contracts/types";
import { Field, inputClasses, selectClasses, textareaClasses } from "@/components/shared/Field";

const CONDITION_LABELS: Record<(typeof PROPERTY_CONDITIONS)[number], string> = {
  as_is: "As-is",
  seller_to_repair: "Seller to repair items",
  other: "Other (describe below)",
};

type SaveState = "idle" | "saving" | "saved" | "error";

/**
 * Self-contained Settings section — its own form, validation, and
 * saving/saved/error state, independent of the main Settings form and of
 * BuyerProfileSection above it. Never includes required seller disclosures
 * (always deal-specific — see lib/contractDefaults/types.ts) and never
 * stores the inspection deadline itself (calculated per-contract, not a
 * preference).
 */
export function DueDiligenceDefaultsSection() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DueDiligenceDefaultsFormInput, unknown, DueDiligenceDefaultsFormValues>({
    resolver: zodResolver(dueDiligenceDefaultsValuesSchema),
    defaultValues: emptyDueDiligenceDefaultsValues(),
  });

  useEffect(() => {
    let cancelled = false;
    contractDefaultsRepository
      .getDueDiligenceDefaults()
      .then((defaults) => {
        if (cancelled) return;
        reset(defaults?.values ?? emptyDueDiligenceDefaultsValues());
      })
      .catch((error) => {
        if (cancelled) return;
        setLoadError(error instanceof Error ? error.message : "Couldn't load your Due Diligence defaults. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reset]);

  async function onSubmit(values: DueDiligenceDefaultsFormValues) {
    if (saveState === "saving") return; // guards against duplicate submits
    setSaveState("saving");
    setSaveError(null);
    try {
      const saved = await contractDefaultsRepository.saveDueDiligenceDefaults(values);
      reset(saved.values);
      setSaveState("saved");
      window.setTimeout(() => setSaveState((s) => (s === "saved" ? "idle" : s)), 2500);
    } catch (error) {
      // No reset() on failure — the form keeps exactly what was entered.
      setSaveState("error");
      setSaveError(error instanceof Error ? error.message : "Couldn't save your defaults. Please try again.");
    }
  }

  async function handleReset() {
    if (isResetting) return;
    setIsResetting(true);
    setSaveError(null);
    try {
      await contractDefaultsRepository.resetDueDiligenceDefaults();
      reset(emptyDueDiligenceDefaultsValues());
      setSaveState("idle");
    } catch (error) {
      setSaveState("error");
      setSaveError(error instanceof Error ? error.message : "Couldn't reset your defaults. Please try again.");
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-sm font-semibold text-white mb-1">Due Diligence Defaults</h2>
      <p className="text-xs text-muted mb-4">
        Saved once, reused to prefill the Due Diligence section of every new purchase agreement — every field stays editable per contract. Seller
        disclosures are never included; they always vary by property and are entered per-contract.
      </p>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/15 border-t-accent-3" />
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          {loadError ? (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3.5 text-sm text-red-300">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              {loadError}
            </div>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Inspection period (days)" htmlFor="ddInspectionPeriodDays" error={errors.inspectionPeriodDays?.message}>
              <input
                id="ddInspectionPeriodDays"
                type="number"
                min={0}
                className={inputClasses}
                {...register("inspectionPeriodDays", { setValueAs: (v) => (v === "" ? null : Number(v)) })}
              />
            </Field>
            <Field label="Title review period (days)" htmlFor="ddTitleReviewPeriodDays" error={errors.titleReviewPeriodDays?.message}>
              <input
                id="ddTitleReviewPeriodDays"
                type="number"
                min={0}
                className={inputClasses}
                {...register("titleReviewPeriodDays", { setValueAs: (v) => (v === "" ? null : Number(v)) })}
              />
            </Field>
            <Field label="Property condition" htmlFor="ddPropertyCondition" error={errors.propertyCondition?.message}>
              <select id="ddPropertyCondition" className={selectClasses} {...register("propertyCondition")}>
                <option value="">Select…</option>
                {PROPERTY_CONDITIONS.map((c) => (
                  <option key={c} value={c}>
                    {CONDITION_LABELS[c]}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <label className="flex items-center gap-2.5 text-sm text-white/80">
              <input type="checkbox" className="h-4 w-4 rounded border-border" {...register("rightToTerminateDuringInspection")} />
              Buyer has right to terminate during inspection
            </label>
            <label className="flex items-center gap-2.5 text-sm text-white/80">
              <input type="checkbox" className="h-4 w-4 rounded border-border" {...register("surveyRequired")} />
              Survey required
            </label>
          </div>

          <Field label="Property access terms" htmlFor="ddPropertyAccessTerms" hint="When/how the buyer may access the property before closing" error={errors.propertyAccessTerms?.message}>
            <textarea id="ddPropertyAccessTerms" rows={2} className={textareaClasses} {...register("propertyAccessTerms")} />
          </Field>
          <Field label="Additional due-diligence notes" htmlFor="ddDueDiligenceNotes" hint="Optional" error={errors.dueDiligenceNotes?.message}>
            <textarea id="ddDueDiligenceNotes" rows={3} className={textareaClasses} {...register("dueDiligenceNotes")} />
          </Field>

          {saveState === "error" && saveError ? (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3.5 text-sm text-red-300">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              {saveError}
            </div>
          ) : null}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              type="submit"
              disabled={saveState === "saving"}
              className="inline-flex items-center justify-center gap-2 h-10 rounded-full bg-white px-5 text-sm font-medium text-black hover:bg-white/90 transition-colors disabled:opacity-60 whitespace-nowrap"
            >
              {saveState === "saving" ? <Loader2 className="h-4 w-4 animate-spin" /> : saveState === "saved" ? <Check className="h-4 w-4" /> : null}
              {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : "Save Due Diligence Defaults"}
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={isResetting}
              className="inline-flex items-center justify-center gap-1.5 h-10 rounded-full border border-border px-4 text-sm font-medium text-white/70 hover:text-white hover:border-border-strong transition-colors disabled:opacity-60 whitespace-nowrap"
            >
              {isResetting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
              Reset to empty
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
