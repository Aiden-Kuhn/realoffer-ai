"use client";

import { useFormContext } from "react-hook-form";
import { Field, inputClasses, selectClasses, textareaClasses } from "@/components/shared/Field";
import { PROPERTY_CONDITIONS, type ContractFormData } from "@/lib/contracts/types";

const CONDITION_LABELS: Record<(typeof PROPERTY_CONDITIONS)[number], string> = {
  as_is: "As-is",
  seller_to_repair: "Seller to repair items",
  other: "Other (describe below)",
};

export function DueDiligenceStep() {
  const { register } = useFormContext<ContractFormData>();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-sm font-semibold text-white mb-1">Due Diligence</h2>
        <p className="text-xs text-muted">Inspection, title, and disclosure terms.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Inspection period (days)" htmlFor="dueDiligence.inspectionPeriodDays">
          <input type="number" min={0} className={inputClasses} {...register("dueDiligence.inspectionPeriodDays", { setValueAs: (v) => (v === "" ? null : Number(v)) })} />
        </Field>
        <Field label="Inspection deadline" htmlFor="dueDiligence.inspectionDeadline">
          <input type="date" className={inputClasses} {...register("dueDiligence.inspectionDeadline")} />
        </Field>
        <Field label="Title review period (days)" htmlFor="dueDiligence.titleReviewPeriodDays">
          <input type="number" min={0} className={inputClasses} {...register("dueDiligence.titleReviewPeriodDays", { setValueAs: (v) => (v === "" ? null : Number(v)) })} />
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
      <Field label="Required seller disclosures" htmlFor="dueDiligence.requiredSellerDisclosures">
        <textarea rows={2} className={textareaClasses} {...register("dueDiligence.requiredSellerDisclosures")} />
      </Field>
      <Field label="Additional due-diligence notes" htmlFor="dueDiligence.dueDiligenceNotes" hint="Optional">
        <textarea rows={3} className={textareaClasses} {...register("dueDiligence.dueDiligenceNotes")} />
      </Field>
    </div>
  );
}
