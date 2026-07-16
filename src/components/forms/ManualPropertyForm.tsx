"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Field, inputClasses, selectClasses } from "@/components/shared/Field";
import { manualPropertySchema, type ManualPropertyFormInput, type ManualPropertyFormValues } from "@/lib/validation/schemas";
import { normalizeManualAddress } from "@/lib/property/normalizeAddress";
import type { NormalizedAddress, PropertyType } from "@/lib/property/types";

export type ManualPropertyOverrides = {
  listPriceCents?: number;
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
  yearBuilt?: number;
  propertyType?: PropertyType;
};

type ManualPropertyFormProps = {
  onSubmitAddress: (address: NormalizedAddress, overrides: ManualPropertyOverrides) => void;
  isSubmitting: boolean;
  initialValues?: Partial<{ line1: string; city: string; state: string; zip: string }>;
  mode?: "rentcast" | "demo";
};

const PROPERTY_TYPE_OPTIONS: Array<{ value: ManualPropertyFormValues["propertyType"]; label: string }> = [
  { value: "single_family", label: "Single Family" },
  { value: "condo", label: "Condo" },
  { value: "townhouse", label: "Townhouse" },
  { value: "multi_family", label: "Multi-Family" },
  { value: "manufactured", label: "Manufactured" },
  { value: "land", label: "Land" },
];

export function ManualPropertyForm({ onSubmitAddress, isSubmitting, initialValues, mode = "demo" }: ManualPropertyFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ManualPropertyFormInput, unknown, ManualPropertyFormValues>({
    resolver: zodResolver(manualPropertySchema),
    defaultValues: {
      propertyType: "single_family",
      line1: initialValues?.line1 ?? "",
      city: initialValues?.city ?? "",
      state: initialValues?.state ?? "",
      zip: initialValues?.zip ?? "",
    },
  });

  function onSubmit(values: ManualPropertyFormValues) {
    const address = normalizeManualAddress({
      line1: values.line1,
      city: values.city,
      state: values.state,
      zip: values.zip,
    });

    const overrides: ManualPropertyOverrides = {
      propertyType: values.propertyType,
    };
    if (values.listPrice !== "" && values.listPrice !== undefined) overrides.listPriceCents = Math.round(values.listPrice * 100);
    if (values.bedrooms !== "" && values.bedrooms !== undefined) overrides.bedrooms = values.bedrooms;
    if (values.bathrooms !== "" && values.bathrooms !== undefined) overrides.bathrooms = values.bathrooms;
    if (values.squareFootage !== "" && values.squareFootage !== undefined) overrides.squareFootage = values.squareFootage;
    if (values.yearBuilt !== "" && values.yearBuilt !== undefined) overrides.yearBuilt = values.yearBuilt;

    onSubmitAddress(address, overrides);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Street address" htmlFor="line1" error={errors.line1?.message} required className="sm:col-span-2">
          <input id="line1" type="text" placeholder="123 Main St" className={inputClasses} {...register("line1")} />
        </Field>
        <Field label="City" htmlFor="city" error={errors.city?.message} required>
          <input id="city" type="text" placeholder="Austin" className={inputClasses} {...register("city")} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="State" htmlFor="state" error={errors.state?.message} required>
            <input id="state" type="text" placeholder="TX" maxLength={2} className={inputClasses} {...register("state")} />
          </Field>
          <Field label="ZIP code" htmlFor="zip" error={errors.zip?.message} required>
            <input id="zip" type="text" placeholder="78701" maxLength={5} className={inputClasses} {...register("zip")} />
          </Field>
        </div>
      </div>

      <div className="h-px bg-border" />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Field label="List price" htmlFor="listPrice" error={errors.listPrice?.message} hint="Optional">
          <input id="listPrice" type="number" min={0} placeholder="350000" className={inputClasses} {...register("listPrice")} />
        </Field>
        <Field label="Bedrooms" htmlFor="bedrooms" error={errors.bedrooms?.message} hint="Optional">
          <input id="bedrooms" type="number" min={0} placeholder="3" className={inputClasses} {...register("bedrooms")} />
        </Field>
        <Field label="Bathrooms" htmlFor="bathrooms" error={errors.bathrooms?.message} hint="Optional">
          <input id="bathrooms" type="number" min={0} step={0.5} placeholder="2" className={inputClasses} {...register("bathrooms")} />
        </Field>
        <Field label="Square footage" htmlFor="squareFootage" error={errors.squareFootage?.message} hint="Optional">
          <input id="squareFootage" type="number" min={0} placeholder="1840" className={inputClasses} {...register("squareFootage")} />
        </Field>
        <Field label="Year built" htmlFor="yearBuilt" error={errors.yearBuilt?.message} hint="Optional">
          <input id="yearBuilt" type="number" min={1800} placeholder="1998" className={inputClasses} {...register("yearBuilt")} />
        </Field>
        <Field label="Property type" htmlFor="propertyType" error={errors.propertyType?.message}>
          <select id="propertyType" className={selectClasses} {...register("propertyType")}>
            {PROPERTY_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="rounded-xl border border-border bg-surface-2 px-4 py-3 text-xs leading-relaxed text-muted">
        {mode === "rentcast"
          ? "Any fields you leave blank will be looked up through RentCast when available. Fields we still can't find will show as \"Not available\" rather than a guess."
          : "Any fields you leave blank will be filled in with deterministic demo data so you can still explore the full analysis — the workspace will flag which values are simulated."}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center justify-center gap-2 h-11 rounded-full bg-white px-6 text-sm font-medium text-black hover:bg-white/90 transition-colors disabled:opacity-60 self-start"
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {isSubmitting ? "Analyzing..." : "Analyze Property"}
      </button>
    </form>
  );
}
