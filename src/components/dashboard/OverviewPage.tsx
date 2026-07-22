"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Target, DollarSign, TrendingUp, FolderSearch, Sparkles, Gauge, Handshake, History } from "lucide-react";
import { useSetPageHeader } from "@/components/dashboard/PageHeaderContext";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useDeals } from "@/hooks/useDeals";
import { useMounted } from "@/hooks/useMounted";
import { dealRepository } from "@/lib/repositories/dealRepository";
import { computeDashboardStats } from "@/lib/dashboardStats";
import { formatCents } from "@/lib/calculations/money";
import { StatCard } from "@/components/dashboard/StatCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DEAL_PIPELINE_STATUS_LABELS } from "@/types/deal";
import { generateSampleDeals } from "@/lib/sampleDeals";

export function OverviewPage() {
  useSetPageHeader("Overview");
  const mounted = useMounted();
  const { user } = useAuth();
  const { deals, isLoading: dealsLoading, refresh } = useDeals();
  const [loadingSamples, setLoadingSamples] = useState(false);
  const [samplesError, setSamplesError] = useState<string | null>(null);

  const stats = computeDashboardStats(deals);
  const recentDeals = deals.slice(0, 5);
  const firstName = user?.fullName?.split(" ")[0] || "there";

  async function handleLoadSamples() {
    setLoadingSamples(true);
    setSamplesError(null);
    try {
      const samples = await generateSampleDeals();
      // Save in parallel and refresh once at the end, rather than
      // refetching the whole deal list after each individual save.
      await Promise.all(samples.map((deal) => dealRepository.save(deal)));
      await refresh();
    } catch (error) {
      setSamplesError(error instanceof Error ? error.message : "Couldn't load sample deals. Please try again.");
    } finally {
      setLoadingSamples(false);
    }
  }

  if (!mounted || dealsLoading) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="h-8 w-64 rounded-md bg-white/5 animate-pulse" />
            <div className="mt-2 h-4 w-56 rounded-md bg-white/5 animate-pulse" />
          </div>
          <div className="h-11 w-44 rounded-full bg-white/5 animate-pulse shrink-0" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-[124px] rounded-2xl border border-border bg-surface p-5">
              <div className="h-4 w-24 rounded bg-white/5 animate-pulse" />
              <div className="mt-6 h-7 w-20 rounded bg-white/5 animate-pulse" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={`ai-${i}`} className="h-[124px] rounded-2xl border border-border bg-surface p-5">
              <div className="h-4 w-24 rounded bg-white/5 animate-pulse" />
              <div className="mt-6 h-7 w-20 rounded bg-white/5 animate-pulse" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 rounded-2xl border border-border bg-surface animate-pulse" />
          <div className="h-72 rounded-2xl border border-border bg-surface animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Welcome back, {firstName}</h1>
          <p className="mt-1 text-sm text-muted">Here&apos;s what&apos;s happening across your deal pipeline.</p>
        </div>
        <Link
          href="/analyze"
          className="inline-flex items-center justify-center gap-2 h-11 rounded-full bg-white px-5 text-sm font-medium text-black hover:bg-white/90 active:scale-[0.98] transition-all duration-150 shrink-0"
        >
          <Plus className="h-4 w-4" />
          Analyze New Deal
        </Link>
      </div>

      {deals.length === 0 ? (
        <EmptyState
          icon={FolderSearch}
          title="No deals yet"
          description="Analyze your first property to see it here, or load a set of sample deals to explore the dashboard with realistic demo data."
          action={
            <div className="flex flex-col items-center gap-3">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <Link
                  href="/analyze"
                  className="inline-flex items-center gap-2 h-10 rounded-full bg-white px-4 text-sm font-medium text-black hover:bg-white/90 active:scale-[0.98] transition-all duration-150"
                >
                  Analyze a property
                </Link>
                <button
                  type="button"
                  onClick={handleLoadSamples}
                  disabled={loadingSamples}
                  className="inline-flex items-center gap-2 h-10 rounded-full border border-border px-4 text-sm font-medium text-white/80 hover:text-white hover:border-border-strong active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:active:scale-100"
                >
                  <Sparkles className="h-4 w-4" />
                  {loadingSamples ? "Loading sample deals..." : "Load sample deals"}
                </button>
              </div>
              {samplesError ? <p className="text-xs text-red-400">{samplesError}</p> : null}
            </div>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={FolderSearch} label="Total deals analyzed" value={String(stats.totalDeals)} />
            <StatCard icon={Target} label="Potential deals" value={String(stats.potentialDeals)} hint="Strong margin or potential deal" />
            <StatCard
              icon={DollarSign}
              label="Avg. projected assignment fee"
              value={formatCents(stats.averageAssignmentFeeCents)}
            />
            <StatCard
              icon={TrendingUp}
              label="Avg. projected investor profit"
              value={formatCents(stats.averageProjectedProfitCents)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Gauge} label="Avg. RealOffer Deal Score" value={`${stats.averageDealScore}/100`} hint="Deterministic — never AI-influenced" />
            <StatCard icon={Sparkles} label="Strong candidates" value={String(stats.strongCandidateDeals)} hint="Score 85+" />
            <StatCard icon={Handshake} label="Negotiation required" value={String(stats.negotiationRequiredDeals)} />
            <StatCard icon={History} label="Stale analyses" value={String(stats.staleAnalysisDeals)} hint="Assumptions changed since last generated" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-2xl border border-border bg-surface">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h2 className="text-sm font-semibold text-white">Recent deals</h2>
                <Link href="/dashboard/deals" className="text-xs font-medium text-accent-3 hover:text-accent-3/80">
                  View all
                </Link>
              </div>
              <ul className="divide-y divide-border">
                {recentDeals.map((deal) => (
                  <li key={deal.id}>
                    <Link
                      href={`/dashboard/deals/${deal.id}`}
                      className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">{deal.property.address.formatted}</p>
                        <p className="text-xs text-muted mt-0.5">
                          {new Date(deal.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="hidden sm:block text-sm text-white/70 tabular-nums">
                          {formatCents(deal.results.projectedInvestorProfitCents)}
                        </span>
                        <StatusBadge status={deal.status} />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5">
              <h2 className="text-sm font-semibold text-white mb-4">Deal status breakdown</h2>
              <div className="flex flex-col gap-3">
                {Object.entries(stats.statusBreakdown)
                  .filter(([, count]) => count > 0)
                  .map(([status, count]) => (
                    <div key={status}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-white/70">{DEAL_PIPELINE_STATUS_LABELS[status as keyof typeof DEAL_PIPELINE_STATUS_LABELS]}</span>
                        <span className="text-muted tabular-nums">{count}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-accent to-accent-3 transition-[width] duration-500 ease-out"
                          style={{ width: `${Math.round((count / stats.totalDeals) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
