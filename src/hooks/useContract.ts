"use client";

import { useEffect, useState } from "react";
import { contractRepository } from "@/lib/repositories/contractRepository";
import type { Contract } from "@/lib/contracts/types";

export type ContractLookup = {
  contract: Contract | null;
  isLoading: boolean;
};

/** Fetches a single contract by id once per id. Unlike useDeal.ts there's
 * no draft/sessionStorage fallback — a contract always exists as a saved
 * row the moment it's created (see contractRepository.create()), so "not
 * found" here always means deleted, foreign, or a bad link. */
export function useContract(id: string): ContractLookup {
  const [contract, setContract] = useState<Contract | null>(null);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    contractRepository
      .get(id)
      .then((result) => {
        if (cancelled) return;
        setContract(result);
        setLoadedFor(id);
      })
      .catch(() => {
        if (cancelled) return;
        setContract(null);
        setLoadedFor(id);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return { contract, isLoading: loadedFor !== id };
}
