import { describe, expect, it } from "vitest";
import { normalizeLegacyDeal } from "@/lib/repositories/dealMigration";
import { dealRepository, DealStorageError } from "@/lib/repositories/dealRepository";
import { settingsRepository, SettingsStorageError } from "@/lib/repositories/settingsRepository";
import { saveDraftDeal, DraftStorageError } from "@/lib/repositories/draftDealStore";
import { DEFAULT_SETTINGS } from "@/config/defaults";

/**
 * These repositories run in "node" test environment (no real `window`), so
 * each test installs a minimal fake `window` with a `localStorage`/
 * `sessionStorage` whose `setItem` can be made to throw, simulating a full
 * quota or a browser (e.g. Safari private mode) that disables storage.
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

describe("dealRepository storage failures", () => {
  it("throws a DealStorageError (not an uncaught error) when localStorage.setItem fails", () => {
    installFakeWindow({ throwOnSetItem: true });
    const deal = normalizeLegacyDeal({ id: "storage-test-1" });
    expect(() => dealRepository.save(deal)).toThrow(DealStorageError);
  });

  it("saves normally when localStorage is available", () => {
    installFakeWindow();
    const deal = normalizeLegacyDeal({ id: "storage-test-2" });
    expect(() => dealRepository.save(deal)).not.toThrow();
    expect(dealRepository.get("storage-test-2")).not.toBeNull();
  });
});

describe("settingsRepository storage failures", () => {
  it("throws a SettingsStorageError when localStorage.setItem fails", () => {
    installFakeWindow({ throwOnSetItem: true });
    expect(() => settingsRepository.save(DEFAULT_SETTINGS)).toThrow(SettingsStorageError);
  });

  it("saves normally when localStorage is available", () => {
    installFakeWindow();
    expect(() => settingsRepository.save(DEFAULT_SETTINGS)).not.toThrow();
  });
});

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
