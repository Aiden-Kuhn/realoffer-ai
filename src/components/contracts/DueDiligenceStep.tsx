"use client";

import { useEffect, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import Link from "next/link";
import { Check, AlertTriangle, Loader2, Save, Sparkles, RefreshCw, Info } from "lucide-react";
import { Field, inputClasses, selectClasses, textareaClasses } from "@/components/shared/Field";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { PROPERTY_CONDITIONS, type ContractFormData } from "@/lib/contracts/types";
import { calculateInspectionDeadline } from "@/lib/contracts/inspectionDeadline";
import type { DueDiligenceDefaults, DueDiligenceDefaultsValues } from "@/lib/contractDefaults/types";

const CONDITION_LABELS: Record<(typeof PROPERTY_CONDITIONS)[number], string> = {
  as_is: "As-is",
  seller_to_repair: "Seller to repair items",
  other: "Other (describe below)",
};

const DEFAULTS_FIELD_LABELS: Record<keyof DueDiligenceDefaultsValues, string> = {
  inspectionPeriodDays: "Inspection period",
  titleReviewPeriodDays: "Title review period",
  rightToTerminateDuringInspection: "Right to terminate during inspection",
  surveyRequired: "Survey required",
  propertyCondition: "Property condition",
  propertyAccessTerms: "Property access terms",
  dueDiligenceNotes: "Additional due-diligence notes",
};

function formatDefaultValue(key: keyof DueDiligenceDefaultsValues, value: unknown): string {
  if (value === null || value === "" || value === false) return "blank";
  if (key === "propertyCondition") return CONDITION_LABELS[value as (typeof PROPERTY_CONDITIONS)[number]] ?? String(value);
  if (typeof value === "boolean") return "yes";
  if (key === "inspectionPeriodDays" || key === "titleReviewPeriodDays") return `${value} days`;
  return String(value);
}

type MiniState = "idle" | "saving" | "saved" | "error";

/** "Save these terms as my defaults" — independent of contract autosave;
 * only fires on explicit click, mirrors PartiesStep's SaveToProfileControl. */
function SaveAsDefaultsControl({ onSave }: { onSave: (values: DueDiligenceDefaultsValues) => Promise<void> }) {
  const { getValues } = useFormContext<ContractFormData>();
  const [state, setState] = useState<MiniState>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (state === "saving") return; // guards against duplicate submits
    const dd = getValues("dueDiligence");
    setState("saving");
    setError(null);
    try {
      await onSave({
        inspectionPeriodDays: dd.inspectionPeriodDays,
        titleReviewPeriodDays: dd.titleReviewPeriodDays,
        rightToTerminateDuringInspection: dd.rightToTerminateDuringInspection,
        surveyRequired: dd.surveyRequired,
        propertyCondition: dd.propertyCondition,
        propertyAccessTerms: dd.propertyAccessTerms,
        dueDiligenceNotes: dd.dueDiligenceNotes,
      });
      setState("saved");
      window.setTimeout(() => setState((s) => (s === "saved" ? "idle" : s)), 2500);
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Couldn't save your defaults. Please try again.");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleSave}
        disabled={state === "saving"}
        className="inline-flex items-center gap-1.5 self-start h-9 rounded-full border border-border px-3.5 text-xs font-medium text-white/70 hover:text-white hover:border-border-strong active:scale-[0.98] transition-all duration-150 disabled:opacity-60"
      >
        {state === "saving" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : state === "saved" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Save className="h-3.5 w-3.5" />}
        {state === "saving" ? "Saving…" : state === "saved" ? "Saved as your defaults" : "Save these due-diligence terms as my defaults"}
      </button>
      {state === "error" && error ? (
        <p role="alert" className="flex items-start gap-1.5 text-xs text-red-400">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** "Apply my defaults" — explicit, confirmed action that overwrites the
 * current draft's due-diligence fields. Never fires automatically. */
function ApplyDefaultsControl({ defaults, contractCreatedAt }: { defaults: DueDiligenceDefaultsValues; contractCreatedAt: string }) {
  const { getValues, setValue } = useFormContext<ContractFormData>();
  const [open, setOpen] = useState(false);
  const [changedFields, setChangedFields] = useState<Array<keyof DueDiligenceDefaultsValues>>([]);

  function openConfirm() {
    const current = getValues("dueDiligence");
    const changed = (Object.keys(defaults) as Array<keyof DueDiligenceDefaultsValues>).filter((key) => current[key] !== defaults[key]);
    setChangedFields(changed);
    setOpen(true);
  }

  function apply() {
    setValue("dueDiligence.inspectionPeriodDays", defaults.inspectionPeriodDays, { shouldDirty: true });
    setValue("dueDiligence.titleReviewPeriodDays", defaults.titleReviewPeriodDays, { shouldDirty: true });
    setValue("dueDiligence.rightToTerminateDuringInspection", defaults.rightToTerminateDuringInspection, { shouldDirty: true });
    setValue("dueDiligence.surveyRequired", defaults.surveyRequired, { shouldDirty: true });
    setValue("dueDiligence.propertyCondition", defaults.propertyCondition, { shouldDirty: true });
    setValue("dueDiligence.propertyAccessTerms", defaults.propertyAccessTerms, { shouldDirty: true });
    setValue("dueDiligence.dueDiligenceNotes", defaults.dueDiligenceNotes, { shouldDirty: true });
    // Re-deriving the deadline from the (possibly new) period, as a fresh
    // automatic calculation rather than leaving a stale manual override.
    const recalculated = calculateInspectionDeadline(contractCreatedAt, defaults.inspectionPeriodDays);
    setValue("dueDiligence.inspectionDeadline", recalculated, { shouldDirty: true });
    setValue("dueDiligence.inspectionDeadlineManuallySet", false, { shouldDirty: true });
    setOpen(false);
  }

  const description =
    changedFields.length === 0
      ? "Your current values already match your saved defaults — nothing will change."
      : `This will replace: ${changedFields.map((key) => `${DEFAULTS_FIELD_LABELS[key]} (→ ${formatDefaultValue(key, defaults[key])})`).join(", ")}.`;

  return (
    <>
      <button
        type="button"
        onClick={openConfirm}
        className="inline-flex items-center gap-1.5 self-start h-9 rounded-full border border-border px-3.5 text-xs font-medium text-white/70 hover:text-white hover:border-border-strong active:scale-[0.98] transition-all duration-150"
      >
        <Sparkles className="h-3.5 w-3.5" />
        Apply my defaults
      </button>
      <ConfirmDialog
        open={open}
        title="Apply your Due Diligence defaults?"
        description={description}
        confirmLabel="Apply defaults"
        onConfirm={apply}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}

function InspectionDeadlineField({ contractCreatedAt }: { contractCreatedAt: string }) {
  const { register, control, setValue, getValues } = useFormContext<ContractFormData>();
  const periodDays = useWatch({ control, name: "dueDiligence.inspectionPeriodDays" });
  const manuallySet = useWatch({ control, name: "dueDiligence.inspectionDeadlineManuallySet" });

  useEffect(() => {
    if (manuallySet) return; // user has taken over — never silently overwrite
    const computed = calculateInspectionDeadline(contractCreatedAt, periodDays ?? null);
    if (computed !== getValues("dueDiligence.inspectionDeadline")) {
      setValue("dueDiligence.inspectionDeadline", computed, { shouldDirty: true });
    }
  }, [periodDays, manuallySet, contractCreatedAt, getValues, setValue]);

  const registeredDeadline = register("dueDiligence.inspectionDeadline");

  function recalculate() {
    const computed = calculateInspectionDeadline(contractCreatedAt, getValues("dueDiligence.inspectionPeriodDays"));
    setValue("dueDiligence.inspectionDeadline", computed, { shouldDirty: true });
    setValue("dueDiligence.inspectionDeadlineManuallySet", false, { shouldDirty: true });
  }

  return (
    <Field label="Inspection deadline" htmlFor="dueDiligence.inspectionDeadline">
      <div className="flex items-center gap-2">
        <input
          type="date"
          className={inputClasses}
          {...registeredDeadline}
          onChange={(e) => {
            registeredDeadline.onChange(e);
            setValue("dueDiligence.inspectionDeadlineManuallySet", true, { shouldDirty: true });
          }}
        />
        {manuallySet ? (
          <button
            type="button"
            onClick={recalculate}
            title="Recalculate from the inspection period"
            className="inline-flex shrink-0 items-center gap-1 h-11 rounded-lg border border-border px-3 text-xs font-medium text-white/70 hover:text-white hover:border-border-strong transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Recalculate
          </button>
        ) : null}
      </div>
      <p className="mt-1.5 text-[11px] text-muted">
        {periodDays === null || periodDays === undefined
          ? "Enter an inspection period above to calculate this automatically."
          : manuallySet
            ? "Manually entered — won't be recalculated automatically."
            : "Automatically calculated from the inspection period."}
      </p>
    </Field>
  );
}

export function DueDiligenceStep({
  dueDiligenceDefaults,
  onSaveDueDiligenceDefaults,
  contractCreatedAt,
}: {
  dueDiligenceDefaults: DueDiligenceDefaults | null;
  onSaveDueDiligenceDefaults: (values: DueDiligenceDefaultsValues) => Promise<void>;
  contractCreatedAt: string;
}) {
  const { register } = useFormContext<ContractFormData>();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-sm font-semibold text-white mb-1">Due Diligence</h2>
        <p className="text-xs text-muted">Inspection, title, and disclosure terms.</p>
      </div>

      {dueDiligenceDefaults ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface-2 px-4 py-3 text-xs text-muted">
          <Info className="h-4 w-4 shrink-0 text-accent-3" />
          <span>Prefilled from your contract defaults.</span>
          <Link href="/dashboard/settings" target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white underline underline-offset-2 transition-colors">
            Edit defaults
          </Link>
          <span className="basis-full sm:basis-auto sm:ml-auto">
            <ApplyDefaultsControl defaults={dueDiligenceDefaults.values} contractCreatedAt={contractCreatedAt} />
          </span>
        </div>
      ) : (
        <div className="rounded-xl border border-accent-3/25 bg-accent-3/[0.06] px-4 py-3 text-xs text-white/80 leading-relaxed">
          Save your commonly used terms to automatically fill future contracts — fill in the fields below, then save them as your defaults.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Inspection period (days)" htmlFor="dueDiligence.inspectionPeriodDays">
          <input
            type="number"
            min={0}
            className={inputClasses}
            {...register("dueDiligence.inspectionPeriodDays", { setValueAs: (v) => (v === "" ? null : Number(v)) })}
          />
        </Field>
        <InspectionDeadlineField contractCreatedAt={contractCreatedAt} />
        <Field label="Title review period (days)" htmlFor="dueDiligence.titleReviewPeriodDays">
          <input
            type="number"
            min={0}
            className={inputClasses}
            {...register("dueDiligence.titleReviewPeriodDays", { setValueAs: (v) => (v === "" ? null : Number(v)) })}
          />
        </Field>
        <Field label="Property condition" htmlFor="dueDiligence.propertyCondition">
          <select className={selectClasses} {...register("dueDiligence.propertyCondition")}>
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
          <input type="checkbox" className="h-4 w-4 rounded border-border" {...register("dueDiligence.rightToTerminateDuringInspection")} />
          Buyer has right to terminate during inspection
        </label>
        <label className="flex items-center gap-2.5 text-sm text-white/80">
          <input type="checkbox" className="h-4 w-4 rounded border-border" {...register("dueDiligence.surveyRequired")} />
          Survey required
        </label>
      </div>

      <Field label="Property access terms" htmlFor="dueDiligence.propertyAccessTerms" hint="When/how the buyer may access the property before closing">
        <textarea rows={2} className={textareaClasses} {...register("dueDiligence.propertyAccessTerms")} />
      </Field>
      <Field label="Required seller disclosures" htmlFor="dueDiligence.requiredSellerDisclosures" hint="Always specific to this deal — never saved as a default">
        <textarea rows={2} className={textareaClasses} {...register("dueDiligence.requiredSellerDisclosures")} />
      </Field>
      <Field label="Additional due-diligence notes" htmlFor="dueDiligence.dueDiligenceNotes" hint="Optional">
        <textarea rows={3} className={textareaClasses} {...register("dueDiligence.dueDiligenceNotes")} />
      </Field>

      <SaveAsDefaultsControl onSave={onSaveDueDiligenceDefaults} />
    </div>
  );
}
