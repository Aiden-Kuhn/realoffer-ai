"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, FileText, Copy, Archive, Search } from "lucide-react";
import { useSetPageHeader } from "@/components/dashboard/PageHeaderContext";
import { useContracts } from "@/hooks/useContracts";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { inputClasses, selectClasses } from "@/components/shared/Field";
import { CONTRACT_STATUSES, CONTRACT_STATUS_LABELS, type ContractStatus } from "@/lib/contracts/types";
import { getTemplateMeta } from "@/lib/contracts/templates/index";

export function ContractsListPage() {
  useSetPageHeader("Contracts");
  const { contracts, isLoading, error, duplicateContract, archiveContract } = useContracts();

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ContractStatus | "all">("all");
  const [pendingArchiveId, setPendingArchiveId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return contracts
      .filter((c) => statusFilter === "all" || c.status === statusFilter)
      .filter((c) => !q || c.formData.property.addressLine1.toLowerCase().includes(q) || c.formData.buyer.legalName.toLowerCase().includes(q) || c.formData.seller.legalName.toLowerCase().includes(q));
  }, [contracts, query, statusFilter]);

  async function handleDuplicate(id: string) {
    setDuplicatingId(id);
    setActionError(null);
    try {
      await duplicateContract(id);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Couldn't duplicate this contract. Please try again.");
    } finally {
      setDuplicatingId(null);
    }
  }

  async function handleConfirmArchive() {
    if (!pendingArchiveId) return;
    setActionError(null);
    try {
      await archiveContract(pendingArchiveId);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Couldn't archive this contract. Please try again.");
    } finally {
      setPendingArchiveId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <div className="h-7 w-40 rounded-md bg-white/5 animate-pulse" />
          <div className="mt-2 h-4 w-72 rounded-md bg-white/5 animate-pulse" />
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4 flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Contracts</h1>
        <p className="mt-1 text-sm text-muted">Purchase agreement drafts, saved to your account and linked to their source property.</p>
      </div>

      {(error || actionError) ? (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3.5 text-sm text-red-300">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          {actionError ?? error}
        </div>
      ) : null}

      {contracts.length === 0 ? (
        <EmptyState icon={FileText} title="No contract drafts yet" description="Open a saved deal and click “Create Purchase Agreement” to start one." />
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <input
                type="search"
                placeholder="Search contracts..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search contracts"
                className={`${inputClasses} pl-10`}
              />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as ContractStatus | "all")} aria-label="Filter by status" className={`${selectClasses} sm:w-48`}>
              <option value="all">All statuses</option>
              {CONTRACT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {CONTRACT_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>

          {visible.length === 0 ? (
            <EmptyState icon={FileText} title="No matching contracts" description="Try a different search term or clear your filters." />
          ) : (
            <div className="rounded-2xl border border-border bg-surface divide-y divide-border">
              {visible.map((contract) => {
                const template = getTemplateMeta(contract.templateId);
                const address = contract.formData.property.addressLine1 || "Untitled contract";
                return (
                  <div key={contract.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <Link href={`/dashboard/contracts/${contract.id}`} className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white hover:text-accent-3 transition-colors">{address}</p>
                      <p className="text-xs text-muted mt-0.5">
                        {template?.label ?? contract.templateId} · Updated {new Date(contract.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </Link>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-white/70">
                        {CONTRACT_STATUS_LABELS[contract.status]}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDuplicate(contract.id)}
                        disabled={duplicatingId === contract.id}
                        aria-label="Duplicate contract"
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-white/60 hover:text-white hover:border-border-strong transition-colors disabled:opacity-50"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      {contract.status !== "archived" ? (
                        <button
                          type="button"
                          onClick={() => setPendingArchiveId(contract.id)}
                          aria-label="Archive contract"
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-white/60 hover:text-red-300 hover:border-red-400/30 transition-colors"
                        >
                          <Archive className="h-3.5 w-3.5" />
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={pendingArchiveId !== null}
        title="Archive this contract draft?"
        description="Archived drafts stay in your account and can still be viewed, but are moved out of your active contracts list."
        confirmLabel="Archive"
        onConfirm={handleConfirmArchive}
        onCancel={() => setPendingArchiveId(null)}
      />
    </div>
  );
}
