"use client";

import { useState } from "react";
import { useFieldArray, useFormContext, type Path } from "react-hook-form";
import Link from "next/link";
import { Plus, Trash2, Check, AlertTriangle, Loader2, Save, UserCircle2 } from "lucide-react";
import { Field, inputClasses } from "@/components/shared/Field";
import { emptyParty, type ContractFormData, type PartyInfo } from "@/lib/contracts/types";
import type { BuyerProfile } from "@/lib/buyerProfile/types";

function PartyFields({ prefix, legend }: { prefix: "buyer" | "seller" | `additionalBuyers.${number}` | `additionalSellers.${number}`; legend: string }) {
  const { register } = useFormContext<ContractFormData>();
  const field = (name: string) => `${prefix}.${name}` as Path<ContractFormData>;

  return (
    <fieldset className="rounded-xl border border-border bg-surface-2 p-4">
      <legend className="px-1 text-xs font-medium uppercase tracking-wide text-muted">{legend}</legend>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
        <Field label="Legal name" htmlFor={field("legalName")} required>
          <input id={field("legalName")} className={inputClasses} {...register(field("legalName"))} />
        </Field>
        <Field label="Entity name" htmlFor={field("entityName")} hint="Optional — e.g. an LLC">
          <input id={field("entityName")} className={inputClasses} {...register(field("entityName"))} />
        </Field>
        <Field label="Mailing address" htmlFor={field("mailingAddressLine1")} className="sm:col-span-2">
          <input id={field("mailingAddressLine1")} className={inputClasses} {...register(field("mailingAddressLine1"))} />
        </Field>
        <Field label="City" htmlFor={field("mailingCity")}>
          <input id={field("mailingCity")} className={inputClasses} {...register(field("mailingCity"))} />
        </Field>
        <Field label="State" htmlFor={field("mailingState")}>
          <input id={field("mailingState")} maxLength={2} className={inputClasses} {...register(field("mailingState"))} />
        </Field>
        <Field label="ZIP" htmlFor={field("mailingZip")}>
          <input id={field("mailingZip")} className={inputClasses} {...register(field("mailingZip"))} />
        </Field>
        <Field label="Email" htmlFor={field("email")}>
          <input id={field("email")} type="email" className={inputClasses} {...register(field("email"))} />
        </Field>
        <Field label="Phone" htmlFor={field("phone")}>
          <input id={field("phone")} type="tel" className={inputClasses} {...register(field("phone"))} />
        </Field>
      </div>
    </fieldset>
  );
}

function AdditionalParties({ name, label }: { name: "additionalBuyers" | "additionalSellers"; label: string }) {
  const { control } = useFormContext<ContractFormData>();
  const { fields, append, remove } = useFieldArray({ control, name });

  return (
    <div className="flex flex-col gap-3">
      {fields.map((f, i) => (
        <div key={f.id} className="relative">
          <PartyFields prefix={`${name}.${i}`} legend={`Additional ${label} ${i + 1}`} />
          <button
            type="button"
            onClick={() => remove(i)}
            aria-label={`Remove additional ${label.toLowerCase()} ${i + 1}`}
            className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-surface text-white/50 hover:text-red-300 hover:border-red-400/30 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => append(emptyParty())}
        disabled={fields.length >= 6}
        className="inline-flex items-center gap-1.5 self-start h-9 rounded-full border border-border px-3.5 text-xs font-medium text-white/70 hover:text-white hover:border-border-strong active:scale-[0.98] transition-all duration-150 disabled:opacity-40"
      >
        <Plus className="h-3.5 w-3.5" />
        Add another {label.toLowerCase()}
      </button>
    </div>
  );
}

type SaveProfileState = "idle" | "saving" | "saved" | "error";

function SaveToProfileControl({ onSaveBuyerProfile }: { onSaveBuyerProfile: (party: PartyInfo) => Promise<void> }) {
  const { getValues } = useFormContext<ContractFormData>();
  const [state, setState] = useState<SaveProfileState>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (state === "saving") return; // guards against duplicate submits
    const buyer = getValues("buyer");
    if (!buyer.legalName.trim()) {
      setState("error");
      setError("Enter a legal name before saving this as your Buyer Profile.");
      return;
    }
    setState("saving");
    setError(null);
    try {
      await onSaveBuyerProfile(buyer);
      setState("saved");
      window.setTimeout(() => setState((s) => (s === "saved" ? "idle" : s)), 2500);
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Couldn't save your Buyer Profile. Please try again.");
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
        {state === "saving" ? "Saving to profile…" : state === "saved" ? "Saved to your profile" : "Save these buyer details to my profile for future contracts"}
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

export function PartiesStep({
  buyerProfile,
  onSaveBuyerProfile,
}: {
  buyerProfile: BuyerProfile | null;
  onSaveBuyerProfile: (party: PartyInfo) => Promise<void>;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-sm font-semibold text-white mb-1">Parties</h2>
        <p className="text-xs text-muted">Buyer details are prefilled from your Buyer Profile where saved. Seller information is never guessed — enter it directly.</p>
      </div>

      {buyerProfile ? (
        <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-2 px-4 py-3 text-xs text-muted">
          <UserCircle2 className="h-4 w-4 shrink-0 text-accent-3" />
          <span>Prefilled from your Buyer Profile.</span>
          <Link href="/dashboard/settings" target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white underline underline-offset-2 transition-colors">
            Edit Buyer Profile
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-accent-3/25 bg-accent-3/[0.06] px-4 py-3 text-xs text-white/80 leading-relaxed">
          Complete your Buyer Profile once to automatically fill future purchase agreements — fill in the Buyer fields below, then save them to your
          profile.
        </div>
      )}

      <PartyFields prefix="buyer" legend="Buyer" />
      <AdditionalParties name="additionalBuyers" label="Buyer" />
      <SaveToProfileControl onSaveBuyerProfile={onSaveBuyerProfile} />

      <div className="h-px bg-border" />

      <PartyFields prefix="seller" legend="Seller" />
      <AdditionalParties name="additionalSellers" label="Seller" />
    </div>
  );
}
