"use client";

import { useEffect, useState } from "react";
import { buyerProfileRepository } from "@/lib/repositories/buyerProfileRepository";
import type { BuyerProfile } from "@/lib/buyerProfile/types";

export type BuyerProfileLookup = {
  buyerProfile: BuyerProfile | null;
  isLoading: boolean;
  /** Lets a caller reflect a just-completed save immediately, without a
   * network round-trip — see PartiesStep's "save to my profile" action. */
  setBuyerProfile: (profile: BuyerProfile) => void;
};

/** Fetches the signed-in user's default buyer profile once. A `null` result
 * after loading is a legitimate, meaningful state — "no profile saved yet"
 * — not an error, since not every user has completed one. */
export function useBuyerProfile(): BuyerProfileLookup {
  const [buyerProfile, setBuyerProfile] = useState<BuyerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    buyerProfileRepository
      .get()
      .then((result) => {
        if (cancelled) return;
        setBuyerProfile(result);
      })
      .catch(() => {
        if (cancelled) return;
        setBuyerProfile(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { buyerProfile, isLoading, setBuyerProfile };
}
