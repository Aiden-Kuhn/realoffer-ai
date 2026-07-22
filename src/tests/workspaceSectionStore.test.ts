import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getStoredWorkspaceSection, saveWorkspaceSection } from "@/lib/repositories/workspaceSectionStore";

/** This test suite runs under vitest's "node" environment (no DOM), same as
 * every other test in this project — so `window` doesn't exist globally.
 * A minimal in-memory Storage stand-in lets the module's real
 * `typeof window !== "undefined"` / `window.sessionStorage` calls exercise
 * their real logic without adding a jsdom dependency. */
function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  } as Storage;
}

describe("workspaceSectionStore", () => {
  beforeEach(() => {
    vi.stubGlobal("window", { sessionStorage: createMemoryStorage() });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns null when nothing has been stored for a deal", () => {
    expect(getStoredWorkspaceSection("deal-1")).toBeNull();
  });

  it("round-trips a saved section", () => {
    saveWorkspaceSection("deal-1", "arvComparables");
    expect(getStoredWorkspaceSection("deal-1")).toBe("arvComparables");
  });

  it("keeps sections separate per deal id", () => {
    saveWorkspaceSection("deal-1", "risks");
    saveWorkspaceSection("deal-2", "contract");
    expect(getStoredWorkspaceSection("deal-1")).toBe("risks");
    expect(getStoredWorkspaceSection("deal-2")).toBe("contract");
  });

  it("falls back to null for a corrupted or unrecognized stored value", () => {
    window.sessionStorage.setItem("realoffer_workspace_section_deal-1", "not_a_real_section");
    expect(getStoredWorkspaceSection("deal-1")).toBeNull();
  });

  it("overwrites a previously stored section for the same deal", () => {
    saveWorkspaceSection("deal-1", "dealAnalysis");
    saveWorkspaceSection("deal-1", "propertyDetails");
    expect(getStoredWorkspaceSection("deal-1")).toBe("propertyDetails");
  });

  it("returns null when window is unavailable (server-side)", () => {
    vi.unstubAllGlobals();
    expect(getStoredWorkspaceSection("deal-1")).toBeNull();
  });

  it("does not throw when saving while window is unavailable (server-side)", () => {
    vi.unstubAllGlobals();
    expect(() => saveWorkspaceSection("deal-1", "risks")).not.toThrow();
  });

  it("does not throw when sessionStorage.getItem fails", () => {
    vi.stubGlobal("window", {
      sessionStorage: {
        getItem: () => {
          throw new Error("blocked");
        },
      },
    });
    expect(getStoredWorkspaceSection("deal-1")).toBeNull();
  });

  it("does not throw when sessionStorage.setItem fails (quota exceeded, private browsing)", () => {
    vi.stubGlobal("window", {
      sessionStorage: {
        setItem: () => {
          throw new Error("quota exceeded");
        },
      },
    });
    expect(() => saveWorkspaceSection("deal-1", "risks")).not.toThrow();
  });
});
