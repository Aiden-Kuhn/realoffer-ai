import { normalizeLegacyDeal } from "@/lib/repositories/dealMigration";
import type { Deal } from "@/types/deal";

/**
 * Holds a single unsaved analysis in sessionStorage, keyed by deal id, so
 * the analysis workspace can be reloaded after a full page refresh before
 * the user explicitly saves it. Cleared once the deal is saved.
 *
 * Reads are cached by id so repeated lookups during render return a stable
 * object reference (drafts are never mutated externally mid-session).
 */

const KEY_PREFIX = "realoffer_draft_deal_";
const cache = new Map<string, Deal | null>();

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/** Thrown when a write to sessionStorage fails (quota exceeded, private
 * browsing with storage disabled, etc.). */
export class DraftStorageError extends Error {
  constructor(message = "Couldn't start this analysis — your browser's local storage might be full or unavailable (e.g. private browsing).") {
    super(message);
    this.name = "DraftStorageError";
  }
}

export function saveDraftDeal(deal: Deal): void {
  if (!isBrowser()) return;
  try {
    window.sessionStorage.setItem(`${KEY_PREFIX}${deal.id}`, JSON.stringify(deal));
  } catch {
    throw new DraftStorageError();
  }
  cache.set(deal.id, deal);
}

export function getDraftDeal(id: string): Deal | null {
  if (!isBrowser()) return null;
  if (cache.has(id)) return cache.get(id) ?? null;

  let result: Deal | null = null;
  try {
    const raw = window.sessionStorage.getItem(`${KEY_PREFIX}${id}`);
    result = raw ? normalizeLegacyDeal(JSON.parse(raw)) : null;
  } catch {
    result = null;
  }
  cache.set(id, result);
  return result;
}

export function clearDraftDeal(id: string): void {
  if (!isBrowser()) return;
  window.sessionStorage.removeItem(`${KEY_PREFIX}${id}`);
  cache.delete(id);
}
