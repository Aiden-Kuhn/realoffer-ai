"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Search, FolderSearch } from "lucide-react";
import { useSetPageHeader } from "@/components/dashboard/PageHeaderContext";
import { useMounted } from "@/hooks/useMounted";
import { useDeals } from "@/hooks/useDeals";
import { dealRepository, type DealSortField, type SortDirection } from "@/lib/repositories/dealRepository";
import { DEAL_PIPELINE_STATUSES, DEAL_PIPELINE_STATUS_LABELS, type DealPipelineStatus } from "@/types/deal";
import { DealsTable } from "@/components/deals/DealsTable";
import { DealCard } from "@/components/deals/DealCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { inputClasses, selectClasses } from "@/components/shared/Field";

const SORT_OPTIONS: Array<{ value: DealSortField; label: string }> = [
  { value: "date", label: "Date" },
  { value: "arv", label: "ARV" },
  { value: "assignmentFee", label: "Assignment fee" },
  { value: "profit", label: "Projected profit" },
];

export function DealsListPage() {
  useSetPageHeader("Saved Deals");
  const mounted = useMounted();
  const { deals, isLoading: dealsLoading, deleteDeal } = useDeals();

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<DealPipelineStatus | "all">("all");
  const [sortBy, setSortBy] = useState<DealSortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleConfirmDelete() {
    if (!pendingDeleteId) return;
    setDeleteError(null);
    try {
      await deleteDeal(pendingDeleteId);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Couldn't delete this deal. Please try again.");
    } finally {
      setPendingDeleteId(null);
    }
  }

  const visibleDeals = useMemo(() => {
    let result = dealRepository.search(deals, query);
    result = dealRepository.filterByStatus(result, statusFilter);
    result = dealRepository.sort(result, sortBy, sortDirection);
    return result;
  }, [deals, query, statusFilter, sortBy, sortDirection]);

  if (!mounted || dealsLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <div className="h-7 w-40 rounded-md bg-white/5 animate-pulse" />
          <div className="mt-2 h-4 w-72 rounded-md bg-white/5 animate-pulse" />
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="h-11 flex-1 max-w-sm rounded-lg bg-white/5 animate-pulse" />
          <div className="h-11 sm:w-48 rounded-lg bg-white/5 animate-pulse" />
          <div className="h-11 sm:w-48 rounded-lg bg-white/5 animate-pulse" />
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4 flex flex-col gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Saved deals</h1>
        <p className="mt-1 text-sm text-muted">Saved to your account — available from any device you log in on.</p>
      </div>

      {deleteError ? (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3.5 text-sm text-red-300">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          {deleteError}
        </div>
      ) : null}

      {deals.length === 0 ? (
        <EmptyState
          icon={FolderSearch}
          title="No saved deals yet"
          description="Analyses you save from the workspace will show up here."
        />
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <input
                type="search"
                placeholder="Search saved deals..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search saved deals"
                className={`${inputClasses} pl-10`}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as DealPipelineStatus | "all")}
              aria-label="Filter by status"
              className={`${selectClasses} sm:w-48`}
            >
              <option value="all">All statuses</option>
              {DEAL_PIPELINE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {DEAL_PIPELINE_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as DealSortField)}
              aria-label="Sort by"
              className={`${selectClasses} sm:w-48`}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  Sort: {opt.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setSortDirection((d) => (d === "asc" ? "desc" : "asc"))}
              className="h-11 rounded-lg border border-border bg-surface px-3.5 text-sm text-white/70 hover:text-white hover:border-border-strong active:scale-[0.98] transition-all duration-150"
              aria-label="Toggle sort direction"
            >
              {sortDirection === "asc" ? "Asc" : "Desc"}
            </button>
          </div>

          {visibleDeals.length === 0 ? (
            <EmptyState icon={FolderSearch} title="No matching deals" description="Try a different search term or clear your filters." />
          ) : (
            <>
              <DealsTable deals={visibleDeals} onDeleteRequest={setPendingDeleteId} />
              <div className="md:hidden flex flex-col gap-3">
                {visibleDeals.map((deal) => (
                  <DealCard key={deal.id} deal={deal} onDeleteRequest={setPendingDeleteId} />
                ))}
              </div>
            </>
          )}
        </>
      )}

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Delete this deal?"
        description="This will permanently remove the saved analysis from your account. This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}
