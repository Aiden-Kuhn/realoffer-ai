"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, MapPinned, RotateCcw, Sparkles } from "lucide-react";
import { useSetPageHeader } from "@/components/dashboard/PageHeaderContext";
import { Tabs } from "@/components/shared/Tabs";
import { ListingLinkForm } from "@/components/forms/ListingLinkForm";
import { ManualPropertyForm, type ManualPropertyOverrides } from "@/components/forms/ManualPropertyForm";
import { propertyDataProvider } from "@/lib/property/mockPropertyDataProvider";
import { analyzePropertyAddress } from "@/lib/property/providerSelection";
import { usePropertyDataMode } from "@/hooks/usePropertyDataMode";
import { createDealFromProperty } from "@/lib/calculations/createDeal";
import { settingsRepository } from "@/lib/repositories/settingsRepository";
import { saveDraftDeal } from "@/lib/repositories/draftDealStore";
import { describeProviderErrorCode } from "@/lib/property/errorMessages";
import { parseFormattedAddressForPrefill, type ManualAddressInput } from "@/lib/property/normalizeAddress";
import type { AddressMatchCandidate, NormalizedAddress, ProviderErrorCode, PropertyRecord } from "@/lib/property/types";

const TAB_ITEMS = [
  { value: "link", label: "Paste Listing Link" },
  { value: "manual", label: "Enter Property Manually" },
];

const LINK_STEPS = [
  "Validating listing link",
  "Extracting address",
  "Looking up property record",
  "Looking for an active listing",
  "Retrieving valuation and comparable sales",
  "Preparing calculation workspace",
];

const MANUAL_STEPS = [
  "Normalizing address",
  "Looking up property record",
  "Looking for an active listing",
  "Retrieving valuation and comparable sales",
  "Preparing calculation workspace",
];

const STEP_INTERVAL_MS = 650;

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

type Phase = "idle" | "loading" | "ambiguous" | "error";

export function AnalyzePage() {
  useSetPageHeader("Analyze Deal");
  const router = useRouter();
  const [tab, setTab] = useState("link");
  const [phase, setPhase] = useState<Phase>("idle");
  const [stepLabel, setStepLabel] = useState("");
  const [candidates, setCandidates] = useState<AddressMatchCandidate[]>([]);
  const [errorCode, setErrorCode] = useState<ProviderErrorCode | null>(null);
  const mode = usePropertyDataMode();
  const [manualPrefill, setManualPrefill] = useState<ManualAddressInput | null>(null);

  const pendingRef = useRef<{ address: NormalizedAddress; overrides?: ManualPropertyOverrides } | null>(null);
  const stepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (stepTimerRef.current) clearInterval(stepTimerRef.current);
    };
  }, []);

  function startSteps(steps: string[]) {
    let i = 0;
    setStepLabel(steps[0]);
    if (stepTimerRef.current) clearInterval(stepTimerRef.current);
    stepTimerRef.current = setInterval(() => {
      i = Math.min(i + 1, steps.length - 1);
      setStepLabel(steps[i]);
    }, STEP_INTERVAL_MS);
  }

  function stopSteps() {
    if (stepTimerRef.current) {
      clearInterval(stepTimerRef.current);
      stepTimerRef.current = null;
    }
  }

  function finalizeAndNavigate(property: PropertyRecord, overrides?: ManualPropertyOverrides) {
    const finalProperty = overrides ? applyOverrides(property, overrides) : property;
    const settings = settingsRepository.get();
    const deal = createDealFromProperty(finalProperty, settings);
    deal.status = "analyzing";
    saveDraftDeal(deal);
    router.push(`/dashboard/deals/${deal.id}`);
  }

  async function runAnalysis(address: NormalizedAddress, overrides?: ManualPropertyOverrides, forceRefresh = false) {
    pendingRef.current = { address, overrides };
    setPhase("loading");
    setErrorCode(null);
    startSteps(tab === "link" ? LINK_STEPS : MANUAL_STEPS);

    try {
      const result = await analyzePropertyAddress(address, { forceRefresh });
      stopSteps();

      if (result.status === "ok") {
        finalizeAndNavigate(result.property, overrides);
        return;
      }
      if (result.status === "ambiguous") {
        setCandidates(result.candidates);
        setPhase("ambiguous");
        return;
      }
      setErrorCode(result.error.code);
      setPhase("error");
    } catch {
      stopSteps();
      setErrorCode("unknown");
      setPhase("error");
    }
  }

  function retry() {
    if (!pendingRef.current) return;
    runAnalysis(pendingRef.current.address, pendingRef.current.overrides, true);
  }

  async function continueWithDemo() {
    if (!pendingRef.current) return;
    setPhase("loading");
    setStepLabel("Generating demo property data");
    const result = await propertyDataProvider.getPropertyByAddress(pendingRef.current.address);
    if (result.status === "ok") {
      finalizeAndNavigate(result.property, pendingRef.current.overrides);
    } else {
      setErrorCode("unknown");
      setPhase("error");
    }
  }

  function enterManually() {
    setPhase("idle");
    setTab("manual");
  }

  function chooseCandidate(candidate: AddressMatchCandidate) {
    setManualPrefill(parseFormattedAddressForPrefill(candidate.formattedAddress));
    setPhase("idle");
    setTab("manual");
  }

  const isSubmitting = phase === "loading";

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Analyze a deal</h1>
        <p className="mt-1.5 text-sm text-muted leading-relaxed">
          {mode === "rentcast"
            ? "Paste a Zillow listing link or enter a property manually to pull real property data from RentCast and generate an editable investment analysis."
            : "Paste a Zillow listing link or enter a property manually to generate an instant, editable investment analysis using deterministic demo data."}
        </p>
      </div>

      <Tabs items={TAB_ITEMS} value={tab} onChange={setTab} className="mb-6" />

      {phase === "loading" ? (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-accent-3/25 bg-accent-3/[0.06] px-4 py-3.5 text-sm text-white/80">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-accent-3" />
          {stepLabel}
        </div>
      ) : null}

      {phase === "ambiguous" ? (
        <div className="mb-5 rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-4 text-sm">
          <p className="font-medium text-white mb-2 flex items-center gap-2">
            <MapPinned className="h-4 w-4 text-amber-300" />
            Multiple matching properties found
          </p>
          <p className="text-white/60 mb-3">
            Select the address you meant to pre-fill the manual entry form, then confirm the details.
          </p>
          <ul className="flex flex-col gap-2">
            {candidates.map((c) => (
              <li key={c.providerId}>
                <button
                  type="button"
                  onClick={() => chooseCandidate(c)}
                  className="w-full text-left rounded-lg border border-border bg-surface px-3.5 py-2.5 text-white/80 hover:text-white hover:border-border-strong hover:bg-white/[0.02] transition-colors duration-150"
                >
                  {c.formattedAddress}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {phase === "error" && errorCode ? (
        <div className="mb-5 flex flex-col gap-3 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-4 text-sm">
          <div className="flex items-start gap-2.5 text-red-200">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            {describeProviderErrorCode(errorCode)}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={retry}
              className="inline-flex items-center gap-1.5 h-9 rounded-full border border-red-400/30 px-3.5 text-xs font-medium text-red-100 hover:bg-red-400/10 active:scale-[0.98] transition-all duration-150"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Retry
            </button>
            <button
              type="button"
              onClick={enterManually}
              className="inline-flex items-center h-9 rounded-full border border-border px-3.5 text-xs font-medium text-white/70 hover:text-white hover:border-border-strong active:scale-[0.98] transition-all duration-150"
            >
              Enter property manually
            </button>
            <button
              type="button"
              onClick={continueWithDemo}
              className="inline-flex items-center gap-1.5 h-9 rounded-full border border-border px-3.5 text-xs font-medium text-white/70 hover:text-white hover:border-border-strong active:scale-[0.98] transition-all duration-150"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Continue with demo data
            </button>
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-border bg-surface p-6">
        {tab === "link" ? (
          <ListingLinkForm onSubmitAddress={(address) => runAnalysis(address)} isSubmitting={isSubmitting} mode={mode} />
        ) : (
          <ManualPropertyForm
            onSubmitAddress={(address, overrides) => runAnalysis(address, overrides)}
            isSubmitting={isSubmitting}
            initialValues={manualPrefill ?? undefined}
            mode={mode}
          />
        )}
      </div>
    </div>
  );
}
