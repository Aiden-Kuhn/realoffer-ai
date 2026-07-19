"use client";

import { useFormContext } from "react-hook-form";
import { Field, inputClasses, textareaClasses } from "@/components/shared/Field";
import type { ContractFormData } from "@/lib/contracts/types";

export function PropertyStep() {
  const { register } = useFormContext<ContractFormData>();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-sm font-semibold text-white mb-1">Property</h2>
        <p className="text-xs text-muted">Prefilled from the analyzed property where available. Fields RealOffer AI has no trusted source for are left blank for you to complete.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Street address" htmlFor="property.addressLine1" required className="sm:col-span-2">
          <input id="property.addressLine1" className={inputClasses} {...register("property.addressLine1")} />
        </Field>
        <Field label="City" htmlFor="property.city" required>
          <input id="property.city" className={inputClasses} {...register("property.city")} />
        </Field>
        <Field label="State" htmlFor="property.state" required>
          <input id="property.state" maxLength={2} className={inputClasses} {...register("property.state")} />
        </Field>
        <Field label="ZIP code" htmlFor="property.zip" required>
          <input id="property.zip" className={inputClasses} {...register("property.zip")} />
        </Field>
        <Field label="County" htmlFor="property.county" hint="Not sourced automatically — enter if known">
          <input id="property.county" className={inputClasses} {...register("property.county")} />
        </Field>
        <Field label="Parcel / APN number" htmlFor="property.parcelNumber" hint="Not available from any connected data provider — enter manually if known">
          <input id="property.parcelNumber" className={inputClasses} {...register("property.parcelNumber")} />
        </Field>
        <Field label="Property type" htmlFor="property.propertyType">
          <input id="property.propertyType" className={inputClasses} {...register("property.propertyType")} />
        </Field>
      </div>

      <Field
        label="Legal description"
        htmlFor="property.legalDescription"
        hint="Only entered when you or a trusted source explicitly supply it — RealOffer AI never invents this. Many jurisdictions expect a formal legal description; check with a title company or attorney."
      >
        <textarea id="property.legalDescription" rows={2} className={textareaClasses} {...register("property.legalDescription")} />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Included personal property" htmlFor="property.includedPersonalProperty" hint="E.g. appliances, window treatments">
          <textarea id="property.includedPersonalProperty" rows={3} className={textareaClasses} {...register("property.includedPersonalProperty")} />
        </Field>
        <Field label="Excluded items" htmlFor="property.excludedItems" hint="Items the seller is keeping">
          <textarea id="property.excludedItems" rows={3} className={textareaClasses} {...register("property.excludedItems")} />
        </Field>
      </div>
    </div>
  );
}
