import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient, type MockSupabaseClient } from "@/tests/stubs/supabaseClientStub";
import { emptyBuyerProfileFields } from "@/lib/buyerProfile/types";

let mockClient: MockSupabaseClient;

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => mockClient,
}));

const USER_A = "user-a";
const USER_B = "user-b";

describe("SupabaseBuyerProfileRepository", () => {
  beforeEach(() => {
    mockClient = createMockSupabaseClient({ session: { user: { id: USER_A } } });
    vi.resetModules();
  });

  it("get() returns null for a first-time user with no saved profile", async () => {
    const { buyerProfileRepository } = await import("@/lib/repositories/buyerProfileRepository");
    expect(await buyerProfileRepository.get()).toBeNull();
  });

  it("save() then get() round-trips every field", async () => {
    const { buyerProfileRepository } = await import("@/lib/repositories/buyerProfileRepository");
    const fields = {
      legalName: "Jamie Rivera",
      entityName: "Rivera Capital LLC",
      mailingAddressLine1: "123 Main St",
      mailingCity: "Austin",
      mailingState: "TX",
      mailingZip: "78701",
      email: "jamie@example.com",
      phone: "512-555-0100",
    };
    await buyerProfileRepository.save(fields);
    const loaded = await buyerProfileRepository.get();
    expect(loaded).not.toBeNull();
    expect(loaded).toMatchObject(fields);
    expect(loaded!.isDefault).toBe(true);
    expect(loaded!.userId).toBe(USER_A);
  });

  it("loading after a refresh reflects the saved profile (get() is a fresh read, no stale cache)", async () => {
    const { buyerProfileRepository } = await import("@/lib/repositories/buyerProfileRepository");
    await buyerProfileRepository.save({ ...emptyBuyerProfileFields(), legalName: "Jamie Rivera" });
    // Simulate a page reload: fresh module import, fresh repository instance.
    vi.resetModules();
    const { buyerProfileRepository: reloaded } = await import("@/lib/repositories/buyerProfileRepository");
    const loaded = await reloaded.get();
    expect(loaded?.legalName).toBe("Jamie Rivera");
  });

  it("save() upserts rather than creating a second row", async () => {
    const { buyerProfileRepository } = await import("@/lib/repositories/buyerProfileRepository");
    await buyerProfileRepository.save({ ...emptyBuyerProfileFields(), legalName: "First Name" });
    await buyerProfileRepository.save({ ...emptyBuyerProfileFields(), legalName: "Second Name" });
    expect(mockClient.__tables.get("buyer_profiles")).toHaveLength(1);
    expect((await buyerProfileRepository.get())!.legalName).toBe("Second Name");
  });

  it("preserves an incomplete profile as a draft — optional fields stay blank", async () => {
    const { buyerProfileRepository } = await import("@/lib/repositories/buyerProfileRepository");
    await buyerProfileRepository.save({ ...emptyBuyerProfileFields(), legalName: "Jamie Rivera" });
    const loaded = await buyerProfileRepository.get();
    expect(loaded!.email).toBe("");
    expect(loaded!.phone).toBe("");
    expect(loaded!.mailingAddressLine1).toBe("");
  });

  it("cross-user isolation: one user's profile is invisible to another", async () => {
    const { buyerProfileRepository } = await import("@/lib/repositories/buyerProfileRepository");
    await buyerProfileRepository.save({ ...emptyBuyerProfileFields(), legalName: "User A's Name" });

    mockClient.__setSession({ user: { id: USER_B } });
    expect(await buyerProfileRepository.get()).toBeNull();

    await buyerProfileRepository.save({ ...emptyBuyerProfileFields(), legalName: "User B's Name" });
    expect(mockClient.__tables.get("buyer_profiles")).toHaveLength(2);

    mockClient.__setSession({ user: { id: USER_A } });
    expect((await buyerProfileRepository.get())!.legalName).toBe("User A's Name");
  });

  it("throws BuyerProfileStorageError when not signed in", async () => {
    mockClient = createMockSupabaseClient({ session: null });
    const { buyerProfileRepository, BuyerProfileStorageError } = await import("@/lib/repositories/buyerProfileRepository");
    await expect(buyerProfileRepository.save(emptyBuyerProfileFields())).rejects.toThrow(BuyerProfileStorageError);
    await expect(buyerProfileRepository.get()).rejects.toThrow(BuyerProfileStorageError);
  });

  it("throws BuyerProfileStorageError when the upsert fails", async () => {
    mockClient = createMockSupabaseClient({ session: { user: { id: USER_A } }, failures: [{ table: "buyer_profiles", op: "upsert" }] });
    const { buyerProfileRepository, BuyerProfileStorageError } = await import("@/lib/repositories/buyerProfileRepository");
    await expect(buyerProfileRepository.save(emptyBuyerProfileFields())).rejects.toThrow(BuyerProfileStorageError);
  });

  it("throws BuyerProfileStorageError when the read fails", async () => {
    mockClient = createMockSupabaseClient({ session: { user: { id: USER_A } }, failures: [{ table: "buyer_profiles", op: "select" }] });
    const { buyerProfileRepository, BuyerProfileStorageError } = await import("@/lib/repositories/buyerProfileRepository");
    await expect(buyerProfileRepository.get()).rejects.toThrow(BuyerProfileStorageError);
  });
});
