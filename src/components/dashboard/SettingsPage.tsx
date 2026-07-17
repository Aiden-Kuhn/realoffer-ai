"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Lock, AlertTriangle } from "lucide-react";
import { useSetPageHeader } from "@/components/dashboard/PageHeaderContext";
import { useAuth } from "@/lib/auth/AuthProvider";
import { usePropertyDataMode } from "@/hooks/usePropertyDataMode";
import { useMounted } from "@/hooks/useMounted";
import { settingsRepository } from "@/lib/repositories/settingsRepository";
import { settingsSchema, type SettingsFormInput, type SettingsFormValues } from "@/lib/validation/schemas";
import { Field, inputClasses } from "@/components/shared/Field";
import { dollarsToCents, centsToDollars } from "@/lib/calculations/money";

export function SettingsPage() {
  useSetPageHeader("Settings");
  const mounted = useMounted();

  if (!mounted) return null;

  return <SettingsForm />;
}

function SettingsForm() {
  const { user, signOut } = useAuth();
  const propertyDataMode = usePropertyDataMode();
  const [justSaved, setJustSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const settings = settingsRepository.get();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SettingsFormInput, unknown, SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      fullName: settings.fullName || user?.name || "",
      companyName: settings.companyName || user?.companyName || "",
      defaultAssignmentFee: centsToDollars(settings.defaultAssignmentFeeCents),
      defaultInvestorArvPercentage: Math.round(settings.defaultInvestorArvPercentage * 1000) / 10,
      defaultHoldingPeriodMonths: settings.defaultHoldingPeriodMonths,
      defaultBuyerClosingCostPercentage: Math.round(settings.defaultBuyerClosingCostPercentage * 1000) / 10,
      defaultSellingCostPercentage: Math.round(settings.defaultSellingCostPercentage * 1000) / 10,
      defaultFinancingCostPercentage: Math.round(settings.defaultFinancingCostPercentage * 1000) / 10,
    },
  });

  function onSubmit(values: SettingsFormValues) {
    setSaveError(null);
    try {
      const current = settingsRepository.get();
      settingsRepository.save({
        ...current,
        fullName: values.fullName ?? "",
        companyName: values.companyName ?? "",
        defaultAssignmentFeeCents: dollarsToCents(values.defaultAssignmentFee),
        defaultInvestorArvPercentage: values.defaultInvestorArvPercentage / 100,
        defaultHoldingPeriodMonths: values.defaultHoldingPeriodMonths,
        defaultBuyerClosingCostPercentage: values.defaultBuyerClosingCostPercentage / 100,
        defaultSellingCostPercentage: values.defaultSellingCostPercentage / 100,
        defaultFinancingCostPercentage: values.defaultFinancingCostPercentage / 100,
      });
      setJustSaved(true);
      window.setTimeout(() => setJustSaved(false), 2000);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Couldn't save settings. Please try again.");
    }
  }

  function handleExitDemo() {
    signOut();
    // Full navigation, not router.push: the dashboard's own auth guard would
    // otherwise race this client-side transition and redirect to /login
    // before it lands on the marketing page.
    window.location.href = "/";
  }

  return (
    <div className="max-w-3xl flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Settings</h1>
        <p className="mt-1 text-sm text-muted">Preferences and default assumptions are saved locally to this browser.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
        <section className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Profile</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full name" htmlFor="fullName" error={errors.fullName?.message}>
              <input id="fullName" type="text" className={inputClasses} {...register("fullName")} />
            </Field>
            <Field label="Company name" htmlFor="companyName" error={errors.companyName?.message}>
              <input id="companyName" type="text" className={inputClasses} {...register("companyName")} />
            </Field>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="text-sm font-semibold text-white mb-1">Default deal assumptions</h2>
          <p className="text-xs text-muted mb-4">Used to seed new analyses. Every value can still be edited per deal.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Default assignment fee" htmlFor="defaultAssignmentFee" error={errors.defaultAssignmentFee?.message}>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-white/35">$</span>
                <input id="defaultAssignmentFee" type="number" min={0} className={`${inputClasses} pl-7`} {...register("defaultAssignmentFee")} />
              </div>
            </Field>
            <Field
              label="Default investor ARV percentage"
              htmlFor="defaultInvestorArvPercentage"
              error={errors.defaultInvestorArvPercentage?.message}
              hint="Rule of thumb — 70% is common but not universal"
            >
              <div className="relative">
                <input
                  id="defaultInvestorArvPercentage"
                  type="number"
                  min={0}
                  max={200}
                  step={0.5}
                  className={`${inputClasses} pr-9`}
                  {...register("defaultInvestorArvPercentage")}
                />
                <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-white/35">%</span>
              </div>
            </Field>
            <Field label="Default holding period (months)" htmlFor="defaultHoldingPeriodMonths" error={errors.defaultHoldingPeriodMonths?.message}>
              <input
                id="defaultHoldingPeriodMonths"
                type="number"
                min={0}
                max={60}
                className={inputClasses}
                {...register("defaultHoldingPeriodMonths")}
              />
            </Field>
            <Field
              label="Default buyer closing cost %"
              htmlFor="defaultBuyerClosingCostPercentage"
              error={errors.defaultBuyerClosingCostPercentage?.message}
            >
              <div className="relative">
                <input
                  id="defaultBuyerClosingCostPercentage"
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  className={`${inputClasses} pr-9`}
                  {...register("defaultBuyerClosingCostPercentage")}
                />
                <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-white/35">%</span>
              </div>
            </Field>
            <Field label="Default selling cost %" htmlFor="defaultSellingCostPercentage" error={errors.defaultSellingCostPercentage?.message}>
              <div className="relative">
                <input
                  id="defaultSellingCostPercentage"
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  className={`${inputClasses} pr-9`}
                  {...register("defaultSellingCostPercentage")}
                />
                <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-white/35">%</span>
              </div>
            </Field>
            <Field
              label="Default financing cost %"
              htmlFor="defaultFinancingCostPercentage"
              error={errors.defaultFinancingCostPercentage?.message}
            >
              <div className="relative">
                <input
                  id="defaultFinancingCostPercentage"
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  className={`${inputClasses} pr-9`}
                  {...register("defaultFinancingCostPercentage")}
                />
                <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-white/35">%</span>
              </div>
            </Field>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="text-sm font-semibold text-white mb-1">Application</h2>
          <p className="text-xs text-muted mb-4">
            Currency display is fixed to USD for this demo. Density and additional preferences will expand in a future milestone.
          </p>
          <div className="rounded-xl border border-border bg-surface-2 px-4 py-3 text-xs text-muted leading-relaxed">
            This is a demo build of RealOffer AI. Your saved deals, notes, and settings are stored only in this
            browser — never on a server.{" "}
            {propertyDataMode === "rentcast"
              ? "Property lookups are sent server-side to RentCast to retrieve real property, listing, and valuation data for the address you enter."
              : "Property data mode is currently set to demo, so property details and comparables are generated locally and never sent to a third-party data provider."}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Account</h2>
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs text-muted">Demo email</p>
              <p className="text-sm text-white mt-0.5">{user?.email || "demo@realoffer.ai"}</p>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl border border-border bg-surface-2 px-4 py-3 text-xs text-muted">
              <Lock className="h-3.5 w-3.5 shrink-0" />
              Password reset isn&apos;t available in this demo — production authentication is not yet connected.
            </div>
            <button
              type="button"
              onClick={handleExitDemo}
              className="self-start h-10 rounded-full border border-border px-4 text-sm font-medium text-white/70 hover:text-white hover:border-border-strong transition-colors"
            >
              Exit demo
            </button>
          </div>
        </section>

        {saveError ? (
          <div className="flex items-start gap-2.5 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3.5 text-sm text-red-300">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            {saveError}
          </div>
        ) : null}

        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 h-11 rounded-full bg-white px-6 text-sm font-medium text-black hover:bg-white/90 transition-colors self-start"
        >
          {justSaved ? <Check className="h-4 w-4" /> : null}
          {justSaved ? "Saved" : "Save settings"}
        </button>
      </form>
    </div>
  );
}
