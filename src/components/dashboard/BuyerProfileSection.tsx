"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, AlertTriangle, Loader2 } from "lucide-react";
import { buyerProfileRepository } from "@/lib/repositories/buyerProfileRepository";
import { emptyBuyerProfileFields } from "@/lib/buyerProfile/types";
import { buyerProfileSchema, type BuyerProfileFormInput, type BuyerProfileFormValues } from "@/lib/buyerProfile/schema";
import { Field, inputClasses } from "@/components/shared/Field";

type SaveState = "idle" | "saving" | "saved" | "error";

/**
 * Self-contained Settings section — its own form, validation, and
 * saving/saved/error state, entirely independent of the main Settings form
 * above it. Deliberately separate: buyer identity is a distinct concept
 * from app preferences (see lib/buyerProfile/types.ts), and keeping this
 * decoupled means a save failure here never touches the rest of Settings.
 */
export function BuyerProfileSection() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BuyerProfileFormInput, unknown, BuyerProfileFormValues>({
    resolver: zodResolver(buyerProfileSchema),
    defaultValues: emptyBuyerProfileFields(),
  });

  useEffect(() => {
    let cancelled = false;
    buyerProfileRepository
      .get()
      .then((profile) => {
        if (cancelled) return;
        reset(profile ?? emptyBuyerProfileFields());
      })
      .catch((error) => {
        if (cancelled) return;
        setLoadError(error instanceof Error ? error.message : "Couldn't load your Buyer Profile. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reset]);

  async function onSubmit(values: BuyerProfileFormValues) {
    if (saveState === "saving") return; // guards against duplicate submits
    setSaveState("saving");
    setSaveError(null);
    try {
      const saved = await buyerProfileRepository.save(values);
      // Reflect any normalization (uppercased state, trimmed fields) the
      // schema applied, without losing what the user just typed.
      reset(saved);
      setSaveState("saved");
      window.setTimeout(() => setSaveState((s) => (s === "saved" ? "idle" : s)), 2500);
    } catch (error) {
      // Deliberately no reset() here — the form keeps exactly what the
      // user entered so a failed save never loses their input.
      setSaveState("error");
      setSaveError(error instanceof Error ? error.message : "Couldn't save your Buyer Profile. Please try again.");
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-sm font-semibold text-white mb-1">Buyer Profile</h2>
      <p className="text-xs text-muted mb-4">
        Saved once, reused automatically to prefill the Buyer section of every future purchase agreement. Never used for seller information, which is
        always entered per-contract.
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
            <Field label="Legal name" htmlFor="buyerLegalName" required error={errors.legalName?.message}>
              <input id="buyerLegalName" className={inputClasses} {...register("legalName")} />
            </Field>
            <Field label="Entity name" htmlFor="buyerEntityName" hint="Optional — e.g. an LLC" error={errors.entityName?.message}>
              <input id="buyerEntityName" className={inputClasses} {...register("entityName")} />
            </Field>
            <Field label="Mailing address" htmlFor="buyerMailingAddressLine1" className="sm:col-span-2" error={errors.mailingAddressLine1?.message}>
              <input id="buyerMailingAddressLine1" className={inputClasses} {...register("mailingAddressLine1")} />
            </Field>
            <Field label="City" htmlFor="buyerMailingCity" error={errors.mailingCity?.message}>
              <input id="buyerMailingCity" className={inputClasses} {...register("mailingCity")} />
            </Field>
            <Field label="State" htmlFor="buyerMailingState" error={errors.mailingState?.message}>
              <input id="buyerMailingState" maxLength={2} className={inputClasses} {...register("mailingState")} />
            </Field>
            <Field label="ZIP code" htmlFor="buyerMailingZip" error={errors.mailingZip?.message}>
              <input id="buyerMailingZip" className={inputClasses} {...register("mailingZip")} />
            </Field>
            <Field label="Email" htmlFor="buyerEmail" error={errors.email?.message}>
              <input id="buyerEmail" type="email" className={inputClasses} {...register("email")} />
            </Field>
            <Field label="Phone" htmlFor="buyerPhone" error={errors.phone?.message}>
              <input id="buyerPhone" type="tel" className={inputClasses} {...register("phone")} />
            </Field>
          </div>

          {saveState === "error" && saveError ? (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3.5 text-sm text-red-300">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              {saveError}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={saveState === "saving"}
            className="inline-flex items-center justify-center gap-2 h-10 rounded-full bg-white px-5 text-sm font-medium text-black hover:bg-white/90 transition-colors self-start disabled:opacity-60"
          >
            {saveState === "saving" ? <Loader2 className="h-4 w-4 animate-spin" /> : saveState === "saved" ? <Check className="h-4 w-4" /> : null}
            {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : "Save Buyer Profile"}
          </button>
        </form>
      )}
    </section>
  );
}
