"use client";

import { useCallback, useEffect, useState } from "react";
import { contractRepository, type NewContractInput } from "@/lib/repositories/contractRepository";
import type { Contract } from "@/lib/contracts/types";

/** Fetches the current user's contracts from Supabase and re-fetches after
 * any mutation. Mirrors useDeals.ts's pattern exactly. */
export function useContracts() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const list = await contractRepository.list();
      setContracts(list);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load your contracts.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    contractRepository
      .list()
      .then((list) => {
        if (cancelled) return;
        setContracts(list);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Couldn't load your contracts.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const createContract = useCallback(
    async (input: NewContractInput) => {
      const created = await contractRepository.create(input);
      await refresh();
      return created;
    },
    [refresh],
  );

  const duplicateContract = useCallback(
    async (id: string) => {
      const copy = await contractRepository.duplicate(id);
      await refresh();
      return copy;
    },
    [refresh],
  );

  const archiveContract = useCallback(
    async (id: string) => {
      await contractRepository.archive(id);
      await refresh();
    },
    [refresh],
  );

  const deleteContract = useCallback(
    async (id: string) => {
      await contractRepository.delete(id);
      await refresh();
    },
    [refresh],
  );

  return { contracts, isLoading, error, createContract, duplicateContract, archiveContract, deleteContract, refresh };
}
