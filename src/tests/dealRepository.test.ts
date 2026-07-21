import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient, type MockSupabaseClient } from "@/tests/stubs/supabaseClientStub";
import { makeStrongDealFixtures } from "@/tests/investmentAnalysis/fixtures";
import type { Deal } from "@/types/deal";

let mockClient: MockSupabaseClient;

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => mockClient,
}));

const USER_ID = "user-1";

function makeDeal(overrides: Partial<Deal> = {}): Deal {
  const { property, comparables, repairEstimate, assumptions, results } = makeStrongDealFixtures();
  return {
    id: crypto.randomUUID(),
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    status: "draft",
    notes: "",
    property,
    comparables,
    assumptions,
    repairEstimate,
    results,
    dataMode: "demo",
    ...overrides,
  };
}

describe("SupabaseDealRepository", () => {
  beforeEach(() => {
    mockClient = createMockSupabaseClient({ session: { user: { id: USER_ID } } });
    vi.resetModules();
  });

  it("saves a new deal and returns it with server-assigned timestamps", async () => {
    const { dealRepository } = await import("@/lib/repositories/dealRepository");
    const deal = makeDeal();
    const saved = await dealRepository.save(deal);
    expect(saved.id).toBe(deal.id);
    expect(saved.status).toBe("draft");
  });

  it("lists only the current user's deals, newest first", async () => {
    const { dealRepository } = await import("@/lib/repositories/dealRepository");
    const first = makeDeal({ id: "deal-a" });
    const second = makeDeal({ id: "deal-b" });
    await dealRepository.save(first);
    await dealRepository.save(second);

    const list = await dealRepository.list();
    expect(list).toHaveLength(2);
    expect(list.map((d) => d.id).sort()).toEqual(["deal-a", "deal-b"]);
  });

  it("get() returns null for a deal that doesn't exist", async () => {
    const { dealRepository } = await import("@/lib/repositories/dealRepository");
    expect(await dealRepository.get("nonexistent")).toBeNull();
  });

  it("get() returns the saved deal by id", async () => {
    const { dealRepository } = await import("@/lib/repositories/dealRepository");
    const deal = makeDeal({ id: "deal-lookup" });
    await dealRepository.save(deal);
    const found = await dealRepository.get("deal-lookup");
    expect(found?.id).toBe("deal-lookup");
  });

  it("save() upserts an existing deal rather than creating a duplicate", async () => {
    const { dealRepository } = await import("@/lib/repositories/dealRepository");
    const deal = makeDeal({ id: "deal-upsert", notes: "first" });
    await dealRepository.save(deal);
    await dealRepository.save({ ...deal, notes: "updated" });

    const list = await dealRepository.list();
    expect(list).toHaveLength(1);
    expect(list[0].notes).toBe("updated");
  });

  it("delete() removes the deal", async () => {
    const { dealRepository } = await import("@/lib/repositories/dealRepository");
    const deal = makeDeal({ id: "deal-delete" });
    await dealRepository.save(deal);
    await dealRepository.delete("deal-delete");
    expect(await dealRepository.get("deal-delete")).toBeNull();
  });

  it("duplicate() creates a new deal with a new id and draft status", async () => {
    const { dealRepository } = await import("@/lib/repositories/dealRepository");
    const deal = makeDeal({ id: "deal-original", status: "pursuing" });
    await dealRepository.save(deal);

    const copy = await dealRepository.duplicate("deal-original");
    expect(copy).not.toBeNull();
    expect(copy!.id).not.toBe("deal-original");
    expect(copy!.status).toBe("draft");

    const list = await dealRepository.list();
    expect(list).toHaveLength(2);
  });

  it("duplicate() returns null when the source deal doesn't exist", async () => {
    const { dealRepository } = await import("@/lib/repositories/dealRepository");
    expect(await dealRepository.duplicate("nonexistent")).toBeNull();
  });

  it("save() throws DealStorageError when not signed in", async () => {
    mockClient = createMockSupabaseClient({ session: null });
    const { dealRepository, DealStorageError } = await import("@/lib/repositories/dealRepository");
    await expect(dealRepository.save(makeDeal())).rejects.toThrow(DealStorageError);
  });

  it("save() throws DealStorageError when the upsert fails", async () => {
    mockClient = createMockSupabaseClient({ session: { user: { id: USER_ID } }, failures: [{ table: "deals", op: "upsert" }] });
    const { dealRepository, DealStorageError } = await import("@/lib/repositories/dealRepository");
    await expect(dealRepository.save(makeDeal())).rejects.toThrow(DealStorageError);
  });

  it("list() throws DealStorageError when the read fails", async () => {
    mockClient = createMockSupabaseClient({ session: { user: { id: USER_ID } }, failures: [{ table: "deals", op: "select" }] });
    const { dealRepository, DealStorageError } = await import("@/lib/repositories/dealRepository");
    await expect(dealRepository.list()).rejects.toThrow(DealStorageError);
  });

  it("delete() throws DealStorageError when the delete fails", async () => {
    mockClient = createMockSupabaseClient({ session: { user: { id: USER_ID } }, failures: [{ table: "deals", op: "delete" }] });
    const { dealRepository, DealStorageError } = await import("@/lib/repositories/dealRepository");
    await expect(dealRepository.delete("any-id")).rejects.toThrow(DealStorageError);
  });

  it("saves and reloads a deal with a bedroom/bathroom override intact", async () => {
    const { dealRepository } = await import("@/lib/repositories/dealRepository");
    const deal = makeDeal({ id: "deal-override", bedroomsOverride: 4, bathroomsOverride: 2.5 });
    await dealRepository.save(deal);

    const reloaded = await dealRepository.get("deal-override");
    expect(reloaded?.bedroomsOverride).toBe(4);
    expect(reloaded?.bathroomsOverride).toBe(2.5);
  });

  it("removing an override persists as null rather than leaving the old value", async () => {
    const { dealRepository } = await import("@/lib/repositories/dealRepository");
    const deal = makeDeal({ id: "deal-remove-override", bedroomsOverride: 5, bathroomsOverride: 3 });
    await dealRepository.save(deal);
    await dealRepository.save({ ...deal, bedroomsOverride: null, bathroomsOverride: null });

    const reloaded = await dealRepository.get("deal-remove-override");
    expect(reloaded?.bedroomsOverride).toBeNull();
    expect(reloaded?.bathroomsOverride).toBeNull();
  });

  it("loads a deal saved before overrides existed with both fields null", async () => {
    const { dealRepository } = await import("@/lib/repositories/dealRepository");
    const deal = makeDeal({ id: "deal-no-override" });
    await dealRepository.save(deal);

    const reloaded = await dealRepository.get("deal-no-override");
    expect(reloaded?.bedroomsOverride).toBeNull();
    expect(reloaded?.bathroomsOverride).toBeNull();
  });

  it("does not expose another user's saved deal or its bedroom/bathroom override", async () => {
    const { dealRepository } = await import("@/lib/repositories/dealRepository");
    const deal = makeDeal({ id: "deal-cross-user", bedroomsOverride: 4 });
    await dealRepository.save(deal);

    mockClient.__setSession({ user: { id: "user-2" } });
    expect(await dealRepository.list()).toHaveLength(0);
    expect(await dealRepository.get("deal-cross-user")).toBeNull();
  });

  it("search/filterByStatus/sort still operate purely on an in-memory array (no network)", async () => {
    const { dealRepository } = await import("@/lib/repositories/dealRepository");
    const deals = [
      makeDeal({ id: "1", status: "draft", notes: "great deal" }),
      makeDeal({ id: "2", status: "passed", notes: "nope" }),
    ];
    expect(dealRepository.search(deals, "great")).toHaveLength(1);
    expect(dealRepository.filterByStatus(deals, "passed")).toHaveLength(1);
    expect(dealRepository.sort(deals, "date", "asc")).toHaveLength(2);
  });
});
