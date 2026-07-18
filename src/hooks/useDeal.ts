"use client";

import { useEffect, useState } from "react";
import { dealRepository } from "@/lib/repositories/dealRepository";
import { getDraftDeal } from "@/lib/repositories/draftDealStore";
import type { Deal } from "@/types/deal";

export type DealLookup = {
  deal: Deal | null;
  isSaved: boolean;
  isLoading: boolean;
};

/** Looks up a deal by id: a saved deal from Supabase first, then an
 * unsaved sessionStorage draft, so the same workspace UI can render either.
 * Fetched once per id — DealWorkspace manages its own edit state from
 * there on and saves explicitly, so this never needs to re-fetch reactively.
 * `isLoading` is derived by comparing the id the current result was loaded
 * for against the requested id, rather than an imperative flag, so no
 * setState fires synchronously inside the effect. */
export function useDeal(id: string): DealLookup {
  const [deal, setDeal] = useState<Deal | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    dealRepository
      .get(id)
      .then((savedDeal) => {
        if (cancelled) return;
        if (savedDeal) {
          setDeal(savedDeal);
          setIsSaved(true);
        } else {
          setDeal(getDraftDeal(id));
          setIsSaved(false);
        }
        setLoadedFor(id);
      })
      .catch(() => {
        if (cancelled) return;
        // A failed lookup (e.g. transient network error) still falls back
        // to a local draft rather than reporting "not found."
        setDeal(getDraftDeal(id));
        setIsSaved(false);
        setLoadedFor(id);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  return { deal, isSaved, isLoading: loadedFor !== id };
}
