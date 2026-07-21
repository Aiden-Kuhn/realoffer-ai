import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient, type MockSupabaseClient } from "@/tests/stubs/supabaseClientStub";
import { emptyDueDiligenceDefaultsValues } from "@/lib/contractDefaults/types";

let mockClient: MockSupabaseClient;

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => mockClient,
}));

const USER_A = "user-a";
const USER_B = "user-b";

describe("SupabaseContractDefaultsRepository — due diligence category", () => {
  beforeEach(() => {
    mockClient = createMockSupabaseClient({ session: { user: { id: USER_A } } });
    vi.resetModules();
  });

  it("getDueDiligenceDefaults() returns null for a first-time user with no saved defaults", async () => {
    const { contractDefaultsRepository } = await import("@/lib/repositories/contractDefaultsRepository");
    expect(await contractDefaultsRepository.getDueDiligenceDefaults()).toBeNull();
  });

  it("saveDueDiligenceDefaults() then getDueDiligenceDefaults() round-trips every field", async () => {
    const { contractDefaultsRepository } = await import("@/lib/repositories/contractDefaultsRepository");
    const values = {
      inspectionPeriodDays: 10,
      titleReviewPeriodDays: 14,
      rightToTerminateDuringInspection: true,
      surveyRequired: true,
      propertyCondition: "as_is" as const,
      propertyAccessTerms: "Business hours only, 24hr notice",
      dueDiligenceNotes: "Confirm HOA docs on file",
    };
    await contractDefaultsRepository.saveDueDiligenceDefaults(values);
    const loaded = await contractDefaultsRepository.getDueDiligenceDefaults();
    expect(loaded).not.toBeNull();
    expect(loaded!.values).toEqual(values);
    expect(loaded!.category).toBe("due_diligence");
    expect(loaded!.userId).toBe(USER_A);
  });

  it("loading after a refresh reflects the saved defaults (fresh read, no stale cache)", async () => {
    const { contractDefaultsRepository } = await import("@/lib/repositories/contractDefaultsRepository");
    await contractDefaultsRepository.saveDueDiligenceDefaults({ ...emptyDueDiligenceDefaultsValues(), inspectionPeriodDays: 7 });
    vi.resetModules(); // simulate a page reload: fresh module import
    const { contractDefaultsRepository: reloaded } = await import("@/lib/repositories/contractDefaultsRepository");
    const loaded = await reloaded.getDueDiligenceDefaults();
    expect(loaded?.values.inspectionPeriodDays).toBe(7);
  });

  it("saveDueDiligenceDefaults() upserts rather than creating a second row", async () => {
    const { contractDefaultsRepository } = await import("@/lib/repositories/contractDefaultsRepository");
    await contractDefaultsRepository.saveDueDiligenceDefaults({ ...emptyDueDiligenceDefaultsValues(), inspectionPeriodDays: 5 });
    await contractDefaultsRepository.saveDueDiligenceDefaults({ ...emptyDueDiligenceDefaultsValues(), inspectionPeriodDays: 10 });
    expect(mockClient.__tables.get("contract_defaults")).toHaveLength(1);
    expect((await contractDefaultsRepository.getDueDiligenceDefaults())!.values.inspectionPeriodDays).toBe(10);
  });

  it("preserves an incomplete draft — optional fields stay blank/null", async () => {
    const { contractDefaultsRepository } = await import("@/lib/repositories/contractDefaultsRepository");
    await contractDefaultsRepository.saveDueDiligenceDefaults({ ...emptyDueDiligenceDefaultsValues(), inspectionPeriodDays: 10 });
    const loaded = await contractDefaultsRepository.getDueDiligenceDefaults();
    expect(loaded!.values.titleReviewPeriodDays).toBeNull();
    expect(loaded!.values.propertyCondition).toBeNull();
    expect(loaded!.values.propertyAccessTerms).toBe("");
  });

  it("resetDueDiligenceDefaults() deletes the row — back to first-time-user state", async () => {
    const { contractDefaultsRepository } = await import("@/lib/repositories/contractDefaultsRepository");
    await contractDefaultsRepository.saveDueDiligenceDefaults({ ...emptyDueDiligenceDefaultsValues(), inspectionPeriodDays: 10 });
    expect(await contractDefaultsRepository.getDueDiligenceDefaults()).not.toBeNull();
    await contractDefaultsRepository.resetDueDiligenceDefaults();
    expect(await contractDefaultsRepository.getDueDiligenceDefaults()).toBeNull();
    expect(mockClient.__tables.get("contract_defaults")).toHaveLength(0);
  });

  it("cross-user isolation: one user's defaults are invisible to another, and don't collide on save", async () => {
    const { contractDefaultsRepository } = await import("@/lib/repositories/contractDefaultsRepository");
    await contractDefaultsRepository.saveDueDiligenceDefaults({ ...emptyDueDiligenceDefaultsValues(), inspectionPeriodDays: 10 });

    mockClient.__setSession({ user: { id: USER_B } });
    expect(await contractDefaultsRepository.getDueDiligenceDefaults()).toBeNull();

    await contractDefaultsRepository.saveDueDiligenceDefaults({ ...emptyDueDiligenceDefaultsValues(), inspectionPeriodDays: 20 });
    expect(mockClient.__tables.get("contract_defaults")).toHaveLength(2);

    mockClient.__setSession({ user: { id: USER_A } });
    expect((await contractDefaultsRepository.getDueDiligenceDefaults())!.values.inspectionPeriodDays).toBe(10);
  });

  it("throws ContractDefaultsStorageError when not signed in", async () => {
    mockClient = createMockSupabaseClient({ session: null });
    const { contractDefaultsRepository, ContractDefaultsStorageError } = await import("@/lib/repositories/contractDefaultsRepository");
    await expect(contractDefaultsRepository.saveDueDiligenceDefaults(emptyDueDiligenceDefaultsValues())).rejects.toThrow(ContractDefaultsStorageError);
    await expect(contractDefaultsRepository.getDueDiligenceDefaults()).rejects.toThrow(ContractDefaultsStorageError);
  });

  it("throws ContractDefaultsStorageError when the upsert fails", async () => {
    mockClient = createMockSupabaseClient({ session: { user: { id: USER_A } }, failures: [{ table: "contract_defaults", op: "upsert" }] });
    const { contractDefaultsRepository, ContractDefaultsStorageError } = await import("@/lib/repositories/contractDefaultsRepository");
    await expect(contractDefaultsRepository.saveDueDiligenceDefaults(emptyDueDiligenceDefaultsValues())).rejects.toThrow(ContractDefaultsStorageError);
  });

  it("throws ContractDefaultsStorageError when the read fails", async () => {
    mockClient = createMockSupabaseClient({ session: { user: { id: USER_A } }, failures: [{ table: "contract_defaults", op: "select" }] });
    const { contractDefaultsRepository, ContractDefaultsStorageError } = await import("@/lib/repositories/contractDefaultsRepository");
    await expect(contractDefaultsRepository.getDueDiligenceDefaults()).rejects.toThrow(ContractDefaultsStorageError);
  });

  it("throws ContractDefaultsStorageError when the delete fails", async () => {
    mockClient = createMockSupabaseClient({ session: { user: { id: USER_A } }, failures: [{ table: "contract_defaults", op: "delete" }] });
    const { contractDefaultsRepository, ContractDefaultsStorageError } = await import("@/lib/repositories/contractDefaultsRepository");
    await expect(contractDefaultsRepository.resetDueDiligenceDefaults()).rejects.toThrow(ContractDefaultsStorageError);
  });
});
