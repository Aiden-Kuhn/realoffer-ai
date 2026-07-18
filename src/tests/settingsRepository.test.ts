import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient, type MockSupabaseClient } from "@/tests/stubs/supabaseClientStub";
import { DEFAULT_SETTINGS } from "@/config/defaults";

let mockClient: MockSupabaseClient;

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => mockClient,
}));

const USER_ID = "user-1";

describe("SupabaseSettingsRepository", () => {
  beforeEach(() => {
    mockClient = createMockSupabaseClient({ session: { user: { id: USER_ID } } });
    vi.resetModules();
  });

  it("falls back to defaults when no settings row exists yet", async () => {
    const { settingsRepository } = await import("@/lib/repositories/settingsRepository");
    const settings = await settingsRepository.get();
    expect(settings).toEqual(DEFAULT_SETTINGS);
  });

  it("save() then get() round-trips every field", async () => {
    const { settingsRepository } = await import("@/lib/repositories/settingsRepository");
    const custom = {
      ...DEFAULT_SETTINGS,
      fullName: "Jamie Rivera",
      companyName: "Rivera Capital",
      defaultAssignmentFeeCents: 1_500_000,
      defaultInvestorArvPercentage: 0.65,
      defaultHoldingPeriodMonths: 6,
      defaultBuyerClosingCostPercentage: 0.03,
      defaultSellingCostPercentage: 0.07,
      defaultFinancingCostPercentage: 0.025,
    };
    await settingsRepository.save(custom);
    const roundTripped = await settingsRepository.get();
    expect(roundTripped).toEqual(custom);
  });

  it("save() upserts rather than creating a second row", async () => {
    const { settingsRepository } = await import("@/lib/repositories/settingsRepository");
    await settingsRepository.save({ ...DEFAULT_SETTINGS, fullName: "First" });
    await settingsRepository.save({ ...DEFAULT_SETTINGS, fullName: "Second" });
    expect(mockClient.__tables.get("user_settings")).toHaveLength(1);
    expect((await settingsRepository.get()).fullName).toBe("Second");
  });

  it("reset() saves back the default values", async () => {
    const { settingsRepository } = await import("@/lib/repositories/settingsRepository");
    await settingsRepository.save({ ...DEFAULT_SETTINGS, fullName: "Custom" });
    const reset = await settingsRepository.reset();
    expect(reset.fullName).toBe("");
    expect(await settingsRepository.get()).toEqual(DEFAULT_SETTINGS);
  });

  it("throws SettingsStorageError when not signed in", async () => {
    mockClient = createMockSupabaseClient({ session: null });
    const { settingsRepository, SettingsStorageError } = await import("@/lib/repositories/settingsRepository");
    await expect(settingsRepository.save(DEFAULT_SETTINGS)).rejects.toThrow(SettingsStorageError);
  });

  it("throws SettingsStorageError when the upsert fails", async () => {
    mockClient = createMockSupabaseClient({ session: { user: { id: USER_ID } }, failures: [{ table: "user_settings", op: "upsert" }] });
    const { settingsRepository, SettingsStorageError } = await import("@/lib/repositories/settingsRepository");
    await expect(settingsRepository.save(DEFAULT_SETTINGS)).rejects.toThrow(SettingsStorageError);
  });

  it("throws SettingsStorageError when the read fails", async () => {
    mockClient = createMockSupabaseClient({ session: { user: { id: USER_ID } }, failures: [{ table: "user_settings", op: "select" }] });
    const { settingsRepository, SettingsStorageError } = await import("@/lib/repositories/settingsRepository");
    await expect(settingsRepository.get()).rejects.toThrow(SettingsStorageError);
  });
});
