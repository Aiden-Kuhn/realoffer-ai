import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const originalEnv = { ...process.env };

async function importFresh() {
  vi.resetModules();
  return import("@/lib/property/providerSelection");
}

describe("provider selection", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("uses demo mode when PROPERTY_DATA_MODE is unset", async () => {
    delete process.env.PROPERTY_DATA_MODE;
    delete process.env.RENTCAST_API_KEY;
    const { getCurrentPropertyDataMode } = await importFresh();
    await expect(getCurrentPropertyDataMode()).resolves.toBe("demo");
  });

  it("uses demo mode when PROPERTY_DATA_MODE is an unrecognized value", async () => {
    process.env.PROPERTY_DATA_MODE = "something-else";
    const { getCurrentPropertyDataMode } = await importFresh();
    await expect(getCurrentPropertyDataMode()).resolves.toBe("demo");
  });

  it("reports the configured mode (rentcast) even without an API key, so page copy matches what a submission will attempt", async () => {
    process.env.PROPERTY_DATA_MODE = "rentcast";
    delete process.env.RENTCAST_API_KEY;
    const { getCurrentPropertyDataMode } = await importFresh();
    await expect(getCurrentPropertyDataMode()).resolves.toBe("rentcast");
  });

  it("reports rentcast mode when both PROPERTY_DATA_MODE and the key are set", async () => {
    process.env.PROPERTY_DATA_MODE = "rentcast";
    process.env.RENTCAST_API_KEY = "test-key";
    const { getCurrentPropertyDataMode } = await importFresh();
    await expect(getCurrentPropertyDataMode()).resolves.toBe("rentcast");
  });

  it("falls back to the demo provider (never a real HTTP call) when mode is demo", async () => {
    delete process.env.PROPERTY_DATA_MODE;
    const { analyzePropertyAddress } = await importFresh();
    const { normalizeManualAddress } = await import("@/lib/property/normalizeAddress");

    const result = await analyzePropertyAddress(
      normalizeManualAddress({ line1: "1 Demo St", city: "Austin", state: "TX", zip: "78701" }),
    );
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.property.source).toBe("simulated");
    }
  });

  it("returns a clear missing_api_key error instead of silently using demo data when rentcast mode has no key", async () => {
    process.env.PROPERTY_DATA_MODE = "rentcast";
    delete process.env.RENTCAST_API_KEY;
    const { analyzePropertyAddress } = await importFresh();
    const { normalizeManualAddress } = await import("@/lib/property/normalizeAddress");

    const result = await analyzePropertyAddress(
      normalizeManualAddress({ line1: "1 Real St", city: "Austin", state: "TX", zip: "78701" }),
    );
    expect(result).toMatchObject({ status: "error", error: { code: "missing_api_key" } });
  });
});
