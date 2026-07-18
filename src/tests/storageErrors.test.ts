import { describe, expect, it } from "vitest";
import { normalizeLegacyDeal } from "@/lib/repositories/dealMigration";
import { saveDraftDeal, DraftStorageError } from "@/lib/repositories/draftDealStore";

/**
 * draftDealStore is the one repository that's still genuinely
 * browser-local (an unsaved analysis, not yet committed to the user's
 * account — see draftDealStore.ts). It runs in "node" test environment (no
 * real `window`), so each test installs a minimal fake `window` with a
 * `sessionStorage` whose `setItem` can be made to throw, simulating a full
 * quota or a browser (e.g. Safari private mode) that disables storage.
 * dealRepository/settingsRepository are now Supabase-backed — see
 * dealRepository.test.ts and settingsRepository.test.ts.
 */
function installFakeWindow(options?: { throwOnSetItem?: boolean }) {
  const store = new Map<string, string>();
  function makeStorage() {
    return {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        if (options?.throwOnSetItem) {
          throw new DOMException("The quota has been exceeded.", "QuotaExceededError");
        }
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    };
  }

  (globalThis as unknown as { window: unknown }).window = {
    localStorage: makeStorage(),
    sessionStorage: makeStorage(),
    addEventListener: () => {},
    removeEventListener: () => {},
  };
}

describe("draftDealStore storage failures", () => {
  it("throws a DraftStorageError when sessionStorage.setItem fails", () => {
    installFakeWindow({ throwOnSetItem: true });
    const deal = normalizeLegacyDeal({ id: "storage-test-3" });
    expect(() => saveDraftDeal(deal)).toThrow(DraftStorageError);
  });

  it("saves normally when sessionStorage is available", () => {
    installFakeWindow();
    const deal = normalizeLegacyDeal({ id: "storage-test-4" });
    expect(() => saveDraftDeal(deal)).not.toThrow();
  });
});
