"use client";

import { useEffect, useState } from "react";
import { contractDefaultsRepository } from "@/lib/repositories/contractDefaultsRepository";
import type { DueDiligenceDefaults } from "@/lib/contractDefaults/types";

export type DueDiligenceDefaultsLookup = {
  dueDiligenceDefaults: DueDiligenceDefaults | null;
  isLoading: boolean;
  /** Lets a caller reflect a just-completed save/reset immediately, without
   * a network round-trip — see DueDiligenceStep's "save as my defaults"
   * and Settings' reset action. */
  setDueDiligenceDefaults: (defaults: DueDiligenceDefaults | null) => void;
};

/** Fetches the signed-in user's saved Due Diligence defaults once. A `null`
 * result after loading is a legitimate, meaningful state — "no defaults
 * saved yet" — not an error. */
export function useDueDiligenceDefaults(): DueDiligenceDefaultsLookup {
  const [dueDiligenceDefaults, setDueDiligenceDefaults] = useState<DueDiligenceDefaults | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    contractDefaultsRepository
      .getDueDiligenceDefaults()
      .then((result) => {
        if (cancelled) return;
        setDueDiligenceDefaults(result);
      })
      .catch(() => {
        if (cancelled) return;
        setDueDiligenceDefaults(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { dueDiligenceDefaults, isLoading, setDueDiligenceDefaults };
}
