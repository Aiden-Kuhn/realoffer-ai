"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link2, Loader2 } from "lucide-react";
import { Field, inputClasses } from "@/components/shared/Field";
import { listingLinkSchema, type ListingLinkFormValues } from "@/lib/validation/schemas";
import { isAllowedZillowUrl, parseZillowUrl } from "@/lib/property/zillowUrl";
import { normalizeSlugAddress } from "@/lib/property/normalizeAddress";
import type { NormalizedAddress } from "@/lib/property/types";

type ListingLinkFormProps = {
  onSubmitAddress: (address: NormalizedAddress) => void;
  isSubmitting: boolean;
  mode?: "rentcast" | "demo";
};

export function ListingLinkForm({ onSubmitAddress, isSubmitting, mode = "demo" }: ListingLinkFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ListingLinkFormValues>({ resolver: zodResolver(listingLinkSchema) });

  function onSubmit(values: ListingLinkFormValues) {
    if (!isAllowedZillowUrl(values.url)) {
      setError("url", {
        message:
          "Only Zillow property URLs are supported right now. Expected format: https://www.zillow.com/homedetails/123-Main-St-City-ST-12345/12345678_zpid/",
      });
      return;
    }

    const parsed = parseZillowUrl(values.url);
    if (!parsed) {
      setError("url", { message: "Couldn't read an address from that link. Try entering the property manually instead." });
      return;
    }

    const address = normalizeSlugAddress(parsed.addressSlug);
    onSubmitAddress(address);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      <Field label="Zillow listing URL" htmlFor="url" error={errors.url?.message} required>
        <div className="relative">
          <Link2 className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            id="url"
            type="url"
            placeholder="https://www.zillow.com/homedetails/123-Main-St-City-ST-12345/12345678_zpid/"
            className={`${inputClasses} pl-10`}
            {...register("url")}
          />
        </div>
      </Field>

      <div className="rounded-xl border border-border bg-surface-2 px-4 py-3 text-xs leading-relaxed text-muted">
        {mode === "rentcast"
          ? "This never fetches or scrapes the Zillow page. It only reads the address out of the URL you paste, then looks that address up through RentCast for real property, listing, and valuation data."
          : "This demo does not fetch or scrape Zillow. It only reads the address out of the URL you paste, then generates deterministic demo property data and comparable sales for that address so you can explore the analysis workflow."}
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
