"use client";

import { Controller, useFormContext } from "react-hook-form";
import { Check } from "lucide-react";
import { Field, inputClasses, selectClasses } from "@/components/shared/Field";
import { formatCents } from "@/lib/calculations/money";
import { FINANCING_TYPES, type ContractFormData, type PurchasePriceSource } from "@/lib/contracts/types";
import type { OfferGuidance } from "@/lib/investmentAnalysis/types";

const FINANCING_LABELS: Record<(typeof FINANCING_TYPES)[number], string> = {
  cash: "Cash",
  conventional: "Conventional financing",
  fha: "FHA",
  va: "VA",
  seller_financing: "Seller financing",
  other: "Other",
};

const PRICE_SOURCE_LABELS: Record<PurchasePriceSource, string> = {
  proposed_contract_price: "Proposed contract price",
  suggested_opening_offer: "Suggested opening offer",
  maximum_recommended_offer: "Maximum recommended offer",
  custom: "Custom amount",
};

type PurchaseTermsStepProps = {
  assignmentEnabled: boolean;
  onToggleAssignment: (enabled: boolean) => void;
  proposedContractPriceCents: number | null;
  offerGuidance: OfferGuidance | null;
};

export function PurchaseTermsStep({ assignmentEnabled, onToggleAssignment, proposedContractPriceCents, offerGuidance }: PurchaseTermsStepProps) {
  const { register, control, watch, setValue } = useFormContext<ContractFormData>();
  const selectedSource = watch("purchaseTerms.purchasePriceSource");

  const priceOptions: Array<{ source: PurchasePriceSource; cents: number | null }> = [
    { source: "proposed_contract_price", cents: proposedContractPriceCents },
    { source: "suggested_opening_offer", cents: offerGuidance?.suggestedOpeningOfferCents ?? null },
    { source: "maximum_recommended_offer", cents: offerGuidance?.maximumRecommendedOfferCents ?? null },
  ];

  function choosePrice(source: PurchasePriceSource, cents: number | null) {
    setValue("purchaseTerms.purchasePriceSource", source, { shouldDirty: true });
    if (cents !== null) setValue("purchaseTerms.purchasePriceCents", cents, { shouldDirty: true });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-sm font-semibold text-white mb-1">Purchase Terms</h2>
        <p className="text-xs text-muted">Choose a starting price, then confirm the exact amount you want in the contract — nothing here is ever used as the binding price without your confirmation.</p>
      </div>

      <div>
        <p className="text-sm font-medium text-white/80 mb-2">Purchase price *</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
          {priceOptions.map((opt) => (
            <button
              key={opt.source}
              type="button"
              disabled={opt.cents === null}
              onClick={() => choosePrice(opt.source, opt.cents)}
              className={`flex items-center justify-between gap-2 rounded-xl border px-4 py-3 text-left transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${
                selectedSource === opt.source ? "border-accent-3/50 bg-accent-3/[0.08]" : "border-border bg-surface-2 hover:border-border-strong"
              }`}
            >
              <span>
                <span className="block text-xs text-muted">{PRICE_SOURCE_LABELS[opt.source]}</span>
                <span className="block text-sm font-semibold text-white tabular-nums">{opt.cents !== null ? formatCents(opt.cents) : "Not available"}</span>
              </span>
              {selectedSource === opt.source ? <Check className="h-4 w-4 shrink-0 text-accent-3" /> : null}
            </button>
          ))}
          <button
            type="button"
            onClick={() => choosePrice("custom", null)}
            className={`flex items-center justify-between gap-2 rounded-xl border px-4 py-3 text-left transition-colors duration-150 ${
              selectedSource === "custom" ? "border-accent-3/50 bg-accent-3/[0.08]" : "border-border bg-surface-2 hover:border-border-strong"
            }`}
          >
            <span className="text-sm font-medium text-white/80">{PRICE_SOURCE_LABELS.custom}</span>
            {selectedSource === "custom" ? <Check className="h-4 w-4 shrink-0 text-accent-3" /> : null}
          </button>
        </div>
        <Field label="Confirmed purchase price" htmlFor="purchaseTerms.purchasePriceCents" required hint={selectedSource ? `Selected: ${PRICE_SOURCE_LABELS[selectedSource]}` : "Select or enter a price above"}>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-white/35">$</span>
            <Controller
              control={control}
              name="purchaseTerms.purchasePriceCents"
              render={({ field }) => (
                <input
                  id="purchaseTerms.purchasePriceCents"
                  type="number"
                  min={0}
                  step={100}
                  className={`${inputClasses} pl-7`}
                  value={field.value !== null ? field.value / 100 : ""}
                  onChange={(e) => {
                    const dollars = e.target.value === "" ? null : Number(e.target.value);
                    field.onChange(dollars === null || Number.isNaN(dollars) ? null : Math.round(dollars * 100));
                    if (selectedSource !== "custom") setValue("purchaseTerms.purchasePriceSource", "custom", { shouldDirty: true });
                  }}
                />
              )}
            />
          </div>
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Earnest money deposit" htmlFor="purchaseTerms.earnestMoneyCents">
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-white/35">$</span>
            <Controller
              control={control}
              name="purchaseTerms.earnestMoneyCents"
              render={({ field }) => (
                <input
                  type="number"
                  min={0}
                  className={`${inputClasses} pl-7`}
                  value={field.value !== null ? field.value / 100 : ""}
                  onChange={(e) => {
                    const dollars = e.target.value === "" ? null : Number(e.target.value);
                    field.onChange(dollars === null || Number.isNaN(dollars) ? null : Math.round(dollars * 100));
                  }}
                />
              )}
            />
          </div>
        </Field>
        <Field label="Earnest money due date" htmlFor="purchaseTerms.earnestMoneyDueDate">
          <input type="date" className={inputClasses} {...register("purchaseTerms.earnestMoneyDueDate")} />
        </Field>
        <Field label="Financing type" htmlFor="purchaseTerms.financingType">
          <select id="purchaseTerms.financingType" className={selectClasses} {...register("purchaseTerms.financingType")}>
            <option value="">Select…</option>
            {FINANCING_TYPES.map((t) => (
              <option key={t} value={t}>
                {FINANCING_LABELS[t]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Closing date" htmlFor="purchaseTerms.closingDate" required>
          <input type="date" className={inputClasses} {...register("purchaseTerms.closingDate")} />
        </Field>
        <Field label="Possession date" htmlFor="purchaseTerms.possessionDate">
          <input type="date" className={inputClasses} {...register("purchaseTerms.possessionDate")} />
        </Field>
        <Field label="Closing company or attorney" htmlFor="purchaseTerms.closingCompanyOrAttorney" hint="Not sourced automatically">
          <input className={inputClasses} {...register("purchaseTerms.closingCompanyOrAttorney")} />
        </Field>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <label className="flex items-center gap-2.5 text-sm text-white/80">
          <input type="checkbox" className="h-4 w-4 rounded border-border" {...register("purchaseTerms.financingContingency")} />
          Financing contingency
        </label>
        <label className="flex items-center gap-2.5 text-sm text-white/80">
          <input type="checkbox" className="h-4 w-4 rounded border-border" {...register("purchaseTerms.appraisalContingency")} />
          Appraisal contingency
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Closing-cost allocation" htmlFor="purchaseTerms.closingCostAllocation" hint="Free text — e.g. who pays which fees">
          <input className={inputClasses} {...register("purchaseTerms.closingCostAllocation")} />
        </Field>
        <Field label="Proration settings" htmlFor="purchaseTerms.prorationSettings" hint="E.g. taxes/HOA prorated as of closing">
          <input className={inputClasses} {...register("purchaseTerms.prorationSettings")} />
        </Field>
      </div>

      <div className="h-px bg-border" />

      <div className="flex items-center justify-between rounded-xl border border-border bg-surface-2 px-4 py-3.5">
        <div>
          <p className="text-sm font-medium text-white">Wholesaling and assignment</p>
          <p className="text-xs text-muted mt-0.5">Only add this if you intentionally want assignment/wholesale language in this contract.</p>
        </div>
        <label className="inline-flex items-center gap-2 text-xs text-white/70 shrink-0">
          <input
            type="checkbox"
            checked={assignmentEnabled}
            onChange={(e) => onToggleAssignment(e.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
          Include section
        </label>
      </div>
    </div>
  );
}
