"use client";

import { useCallback, useEffect, useState } from "react";
import { dealRepository } from "@/lib/repositories/dealRepository";
import type { Deal } from "@/types/deal";

/** Fetches the current user's deals from Supabase and re-fetches after any
 * mutation, so every consumer of this hook always reflects the latest
 * saved state without needing its own cache-invalidation logic. `isLoading`
 * only reflects the initial fetch — a post-mutation refresh updates `deals`
 * in place without flashing a loading state. */
export function useDeals() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const list = await dealRepository.list();
      setDeals(list);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load your deals.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Inlined rather than calling refresh() directly: the lint rule for
  // effects can't see through a useCallback reference to know it only
  // sets state after an await, so it flags "refresh()" as a synchronous
  // setState call. Fetching inline here (with the same cancellation guard)
  // satisfies it while keeping identical behavior.
  useEffect(() => {
    let cancelled = false;
    dealRepository
      .list()
      .then((list) => {
        if (cancelled) return;
        setDeals(list);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Couldn't load your deals.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const saveDeal = useCallback(
    async (deal: Deal) => {
      const saved = await dealRepository.save(deal);
      await refresh();
      return saved;
    },
    [refresh],
  );

  const deleteDeal = useCallback(
    async (id: string) => {
      await dealRepository.delete(id);
      await refresh();
    },
    [refresh],
  );

  const duplicateDeal = useCallback(
    async (id: string) => {
      const copy = await dealRepository.duplicate(id);
      await refresh();
      return copy;
    },
    [refresh],
  );

  return { deals, isLoading, error, saveDeal, deleteDeal, duplicateDeal, refresh };
}
