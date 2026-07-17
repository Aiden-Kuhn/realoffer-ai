import "server-only";
import type { InvestmentAnalysisResult } from "@/lib/investmentAnalysis/types";

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour — long enough to absorb re-renders/navigation, short enough not to serve indefinitely-stale AI text.

type CacheEntry = { result: InvestmentAnalysisResult; expiresAt: number };

/** Keyed by `${dealId}:${inputHash}` so unrelated deals with coincidentally
 * identical assumptions never collide, and in-flight requests for the same
 * key are shared instead of duplicated — mirrors rentcastProvider.ts's
 * cache + in-flight pattern. */
const cache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<InvestmentAnalysisResult>>();

export function cacheKey(dealId: string, inputHash: string): string {
  return `${dealId}:${inputHash}`;
}

export function getCached(key: string): InvestmentAnalysisResult | null {
  const entry = cache.get(key);
  if (!entry || entry.expiresAt <= Date.now()) return null;
  return entry.result;
}

export function getInFlight(key: string): Promise<InvestmentAnalysisResult> | null {
  return inFlight.get(key) ?? null;
}

/** Registers a promise as in-flight for `key`, stores its resolved value in
 * the cache, and clears the in-flight entry either way. */
export function trackInFlight(key: string, promise: Promise<InvestmentAnalysisResult>): Promise<InvestmentAnalysisResult> {
  const tracked = promise
    .then((result) => {
      cache.set(key, { result, expiresAt: Date.now() + CACHE_TTL_MS });
      return result;
    })
    .finally(() => {
      inFlight.delete(key);
    });
  inFlight.set(key, tracked);
  return tracked;
}

/** Test-only: clears all cached/in-flight entries between test cases. */
export function __resetInvestmentAnalysisCacheForTests(): void {
  cache.clear();
  inFlight.clear();
}
