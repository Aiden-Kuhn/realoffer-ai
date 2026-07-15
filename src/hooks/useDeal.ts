"use client";

import { useSyncExternalStore } from "react";
import { subscribeToDeals, getDealsSnapshot, getServerDealsSnapshot } from "@/lib/repositories/dealRepository";
import { getDraftDeal } from "@/lib/repositories/draftDealStore";
import type { Deal } from "@/types/deal";

export type DealLookup = {
  deal: Deal | null;
  isSaved: boolean;
};

/** Derived (effect-free) lookup of a deal by id: saved deals first, then an
 * unsaved draft, so the same workspace UI can render either. */
export function useDeal(id: string): DealLookup {
  const savedDeals = useSyncExternalStore(subscribeToDeals, getDealsSnapshot, getServerDealsSnapshot);
  const savedDeal = savedDeals.find((d) => d.id === id) ?? null;

  if (savedDeal) {
    return { deal: savedDeal, isSaved: true };
  }

  const draftDeal = getDraftDeal(id);
  return { deal: draftDeal, isSaved: false };
}
