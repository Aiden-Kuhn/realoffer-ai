"use client";

import { useFormContext } from "react-hook-form";
import { Field, textareaClasses } from "@/components/shared/Field";
import type { ContractFormData } from "@/lib/contracts/types";

export function AdditionalTermsStep() {
  const { register } = useFormContext<ContractFormData>();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-sm font-semibold text-white mb-1">Additional Terms</h2>
        <p className="text-xs text-muted">Structured, clearly-labeled text fields — not a single freeform legal-text box. Leave any of these blank if they don&apos;t apply.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Access before closing" htmlFor="additionalTerms.accessBeforeClosing">
          <textarea rows={2} className={textareaClasses} {...register("additionalTerms.accessBeforeClosing")} />
        </Field>
        <Field label="Existing tenant or lease information" htmlFor="additionalTerms.existingTenantOrLease">
          <textarea rows={2} className={textareaClasses} {...register("additionalTerms.existingTenantOrLease")} />
        </Field>
        <Field label="Utilities" htmlFor="additionalTerms.utilities">
          <textarea rows={2} className={textareaClasses} {...register("additionalTerms.utilities")} />
        </Field>
        <Field label="Repairs or credits" htmlFor="additionalTerms.repairsOrCredits">
          <textarea rows={2} className={textareaClasses} {...register("additionalTerms.repairsOrCredits")} />
        </Field>
        <Field label="Personal property notes" htmlFor="additionalTerms.personalPropertyNotes">
          <textarea rows={2} className={textareaClasses} {...register("additionalTerms.personalPropertyNotes")} />
        </Field>
        <Field label="Special stipulations" htmlFor="additionalTerms.specialStipulations">
          <textarea rows={2} className={textareaClasses} {...register("additionalTerms.specialStipulations")} />
        </Field>
      </div>

      <Field label="Other terms" htmlFor="additionalTerms.otherTerms" hint="Any other structured notes you want carried into the document">
        <textarea rows={3} className={textareaClasses} {...register("additionalTerms.otherTerms")} />
      </Field>
    </div>
  );
}
