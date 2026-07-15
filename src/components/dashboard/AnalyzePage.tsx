"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { useSetPageHeader } from "@/components/dashboard/PageHeaderContext";
import { Tabs } from "@/components/shared/Tabs";
import { ListingLinkForm } from "@/components/forms/ListingLinkForm";
import { ManualPropertyForm, type ManualPropertyOverrides } from "@/components/forms/ManualPropertyForm";
import { propertyDataProvider } from "@/lib/property/mockPropertyDataProvider";
import { createDealFromProperty } from "@/lib/calculations/createDeal";
import { settingsRepository } from "@/lib/repositories/settingsRepository";
import { saveDraftDeal } from "@/lib/repositories/draftDealStore";
import type { NormalizedAddress, PropertyRecord } from "@/lib/property/types";

const TAB_ITEMS = [
  { value: "link", label: "Paste Listing Link" },
  { value: "manual", label: "Enter Property Manually" },
];

function applyOverrides(property: PropertyRecord, overrides: ManualPropertyOverrides): PropertyRecord {
  return {
    ...property,
    listPriceCents: overrides.listPriceCents ?? property.listPriceCents,
    bedrooms: overrides.bedrooms ?? property.bedrooms,
    bathrooms: overrides.bathrooms ?? property.bathrooms,
    squareFootage: overrides.squareFootage ?? property.squareFootage,
    yearBuilt: overrides.yearBuilt ?? property.yearBuilt,
    propertyType: overrides.propertyType ?? property.propertyType,
  };
}

export function AnalyzePage() {
  useSetPageHeader("Analyze Deal");
  const router = useRouter();
  const [tab, setTab] = useState("link");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runAnalysis(address: NormalizedAddress, overrides?: ManualPropertyOverrides) {
    setError(null);
    setIsSubmitting(true);
    try {
      const property = await propertyDataProvider.getPropertyByAddress(address);
      const finalProperty = overrides ? applyOverrides(property, overrides) : property;
      const settings = settingsRepository.get();
      const deal = createDealFromProperty(finalProperty, settings);
      deal.status = "analyzing";
      saveDraftDeal(deal);
      router.push(`/dashboard/deals/${deal.id}`);
    } catch {
      setError("Something went wrong generating this analysis. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Analyze a deal</h1>
        <p className="mt-1.5 text-sm text-muted leading-relaxed">
          Paste a Zillow listing link or enter a property manually to generate an instant, editable investment
          analysis using deterministic demo data.
        </p>
      </div>

      <Tabs items={TAB_ITEMS} value={tab} onChange={setTab} className="mb-6" />

      {error ? (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          {error}
        </div>
      ) : null}

      <div className="rounded-2xl border border-border bg-surface p-6">
        {tab === "link" ? (
          <ListingLinkForm onSubmitAddress={(address) => runAnalysis(address)} isSubmitting={isSubmitting} />
        ) : (
          <ManualPropertyForm onSubmitAddress={(address, overrides) => runAnalysis(address, overrides)} isSubmitting={isSubmitting} />
        )}
      </div>
    </div>
  );
}
