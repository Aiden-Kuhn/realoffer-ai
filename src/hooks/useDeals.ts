"use client";

import { useCallback, useSyncExternalStore } from "react";
import { dealRepository, subscribeToDeals, getDealsSnapshot, getServerDealsSnapshot } from "@/lib/repositories/dealRepository";
import type { Deal } from "@/types/deal";

/** Reactive view over the deal repository — re-renders automatically when
 * deals are saved, deleted, or duplicated, without any effect-based polling. */
export function useDeals() {
  const rawDeals = useSyncExternalStore(subscribeToDeals, getDealsSnapshot, getServerDealsSnapshot);
  const deals = [...rawDeals].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const saveDeal = useCallback((deal: Deal) => dealRepository.save(deal), []);
  const deleteDeal = useCallback((id: string) => dealRepository.delete(id), []);
  const duplicateDeal = useCallback((id: string) => dealRepository.duplicate(id), []);

  return { deals, saveDeal, deleteDeal, duplicateDeal };
}
