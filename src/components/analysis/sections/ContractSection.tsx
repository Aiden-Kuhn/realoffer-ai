"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Circle, FileSignature, Loader2 } from "lucide-react";
import { buyerProfileRepository } from "@/lib/repositories/buyerProfileRepository";
import { contractDefaultsRepository } from "@/lib/repositories/contractDefaultsRepository";

type StatusState = "loading" | "set" | "not_set" | "error";

type ContractSectionProps = {
  isSaved: boolean;
  isCreatingContract: boolean;
  onCreateContract: () => void;
};

/** Fetches buyer-profile / due-diligence-defaults status lazily, only once
 * this section is actually opened — same repository calls
 * `handleCreateContract` already makes today, just surfaced here as a
 * read-only preview instead of only at contract-creation time. Editing
 * either one still only happens on the Settings page (no duplicated
 * editing surface). */
export function ContractSection({ isSaved, isCreatingContract, onCreateContract }: ContractSectionProps) {
  const [buyerProfileStatus, setBuyerProfileStatus] = useState<StatusState>("loading");
  const [dueDiligenceStatus, setDueDiligenceStatus] = useState<StatusState>("loading");

  useEffect(() => {
    let cancelled = false;

    buyerProfileRepository
      .get()
      .then((profile) => {
        if (!cancelled) setBuyerProfileStatus(profile ? "set" : "not_set");
      })
      .catch(() => {
        if (!cancelled) setBuyerProfileStatus("error");
      });

    contractDefaultsRepository
      .getDueDiligenceDefaults()
      .then((defaults) => {
        if (!cancelled) setDueDiligenceStatus(defaults ? "set" : "not_set");
      })
      .catch(() => {
        if (!cancelled) setDueDiligenceStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="text-sm font-semibold text-white mb-1">Purchase agreement</h2>
        <p className="text-xs text-muted mb-5">
          Generates a draft general purchase agreement prefilled from this deal&apos;s property details, proposed price, and any saved buyer
          profile or due diligence defaults.
        </p>
        {isSaved ? (
          <button
            type="button"
            onClick={onCreateContract}
            disabled={isCreatingContract}
            className="inline-flex items-center gap-2 h-11 rounded-full bg-white px-5 text-sm font-medium text-black hover:bg-white/90 active:scale-[0.98] transition-all duration-150 disabled:opacity-60"
          >
            {isCreatingContract ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSignature className="h-4 w-4" />}
            {isCreatingContract ? "Starting…" : "Create Purchase Agreement"}
          </button>
        ) : (
          <p className="text-xs text-amber-300/80">Save this property before generating a contract.</p>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="text-sm font-semibold text-white mb-4">Saved defaults used to prefill</h2>
        <div className="flex flex-col gap-3">
          <StatusRow label="Buyer profile" status={buyerProfileStatus} />
          <StatusRow label="Due diligence defaults" status={dueDiligenceStatus} />
        </div>
        <Link href="/dashboard/settings" className="mt-4 inline-block text-xs font-medium text-accent-3 hover:text-accent-3/80 transition-colors">
          Edit in Settings →
        </Link>
      </section>
    </div>
  );
}

function StatusRow({ label, status }: { label: string; status: StatusState }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-white/70">{label}</span>
      {status === "loading" ? <Loader2 className="h-3.5 w-3.5 animate-spin text-white/30" /> : null}
      {status === "set" ? (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-300">
          <Check className="h-3.5 w-3.5" />
          Saved
        </span>
      ) : null}
      {status === "not_set" ? (
        <span className="inline-flex items-center gap-1 text-xs text-white/40">
          <Circle className="h-3 w-3" />
          Not set
        </span>
      ) : null}
      {status === "error" ? <span className="text-xs text-red-400">Couldn&apos;t load</span> : null}
    </div>
  );
}
