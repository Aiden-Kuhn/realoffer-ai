import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient, type MockSupabaseClient } from "@/tests/stubs/supabaseClientStub";
import { emptyContractFormData } from "@/lib/contracts/templates/generalPurchaseAgreement";
import { GENERAL_PURCHASE_AGREEMENT_TEMPLATE_ID, GENERAL_PURCHASE_AGREEMENT_TEMPLATE_VERSION } from "@/lib/contracts/templates/generalPurchaseAgreement";

let mockClient: MockSupabaseClient;

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => mockClient,
}));

const USER_A = "user-a";
const USER_B = "user-b";
const DEAL_OWNED_BY_A = "deal-owned-by-a";
const DEAL_OWNED_BY_B = "deal-owned-by-b";

function seedDeals(client: MockSupabaseClient) {
  client.__tables.set("deals", [
    { id: DEAL_OWNED_BY_A, user_id: USER_A },
    { id: DEAL_OWNED_BY_B, user_id: USER_B },
  ]);
}

describe("SupabaseContractRepository", () => {
  beforeEach(() => {
    mockClient = createMockSupabaseClient({ session: { user: { id: USER_A } } });
    seedDeals(mockClient);
    vi.resetModules();
  });

  it("creates a contract linked to a deal the user owns", async () => {
    const { contractRepository } = await import("@/lib/repositories/contractRepository");
    const contract = await contractRepository.create({
      dealId: DEAL_OWNED_BY_A,
      templateId: GENERAL_PURCHASE_AGREEMENT_TEMPLATE_ID,
      templateVersion: GENERAL_PURCHASE_AGREEMENT_TEMPLATE_VERSION,
      formData: emptyContractFormData(),
    });
    expect(contract.status).toBe("draft");
    expect(contract.dealId).toBe(DEAL_OWNED_BY_A);
    expect(contract.templateId).toBe(GENERAL_PURCHASE_AGREEMENT_TEMPLATE_ID);
  });

  it("refuses to create a contract linked to a deal owned by another user (RLS simulation)", async () => {
    const { contractRepository, ContractStorageError } = await import("@/lib/repositories/contractRepository");
    await expect(
      contractRepository.create({
        dealId: DEAL_OWNED_BY_B,
        templateId: GENERAL_PURCHASE_AGREEMENT_TEMPLATE_ID,
        templateVersion: GENERAL_PURCHASE_AGREEMENT_TEMPLATE_VERSION,
        formData: emptyContractFormData(),
      }),
    ).rejects.toThrow(ContractStorageError);
  });

  it("refuses to create a contract linked to a deal that doesn't exist", async () => {
    const { contractRepository, ContractStorageError } = await import("@/lib/repositories/contractRepository");
    await expect(
      contractRepository.create({
        dealId: "nonexistent-deal",
        templateId: GENERAL_PURCHASE_AGREEMENT_TEMPLATE_ID,
        templateVersion: GENERAL_PURCHASE_AGREEMENT_TEMPLATE_VERSION,
        formData: emptyContractFormData(),
      }),
    ).rejects.toThrow(ContractStorageError);
  });

  it("lists only the current session's contracts (mock has no cross-user rows to begin with, mirroring RLS-filtered reads)", async () => {
    const { contractRepository } = await import("@/lib/repositories/contractRepository");
    await contractRepository.create({
      dealId: DEAL_OWNED_BY_A,
      templateId: GENERAL_PURCHASE_AGREEMENT_TEMPLATE_ID,
      templateVersion: GENERAL_PURCHASE_AGREEMENT_TEMPLATE_VERSION,
      formData: emptyContractFormData(),
    });
    const list = await contractRepository.list();
    expect(list).toHaveLength(1);
  });

  it("get() returns null for a contract that doesn't exist", async () => {
    const { contractRepository } = await import("@/lib/repositories/contractRepository");
    expect(await contractRepository.get("nonexistent")).toBeNull();
  });

  it("save() updates form data and status", async () => {
    const { contractRepository } = await import("@/lib/repositories/contractRepository");
    const contract = await contractRepository.create({
      dealId: DEAL_OWNED_BY_A,
      templateId: GENERAL_PURCHASE_AGREEMENT_TEMPLATE_ID,
      templateVersion: GENERAL_PURCHASE_AGREEMENT_TEMPLATE_VERSION,
      formData: emptyContractFormData(),
    });
    const edited = { ...emptyContractFormData(), property: { ...emptyContractFormData().property, addressLine1: "123 Main St" } };
    const saved = await contractRepository.save(contract.id, { formData: edited, status: "ready_for_review" });
    expect(saved.formData.property.addressLine1).toBe("123 Main St");
    expect(saved.status).toBe("ready_for_review");
  });

  it("duplicate() creates a new draft with the same deal, form data, and jurisdiction", async () => {
    const { contractRepository } = await import("@/lib/repositories/contractRepository");
    const original = await contractRepository.create({
      dealId: DEAL_OWNED_BY_A,
      templateId: GENERAL_PURCHASE_AGREEMENT_TEMPLATE_ID,
      templateVersion: GENERAL_PURCHASE_AGREEMENT_TEMPLATE_VERSION,
      formData: { ...emptyContractFormData(), property: { ...emptyContractFormData().property, addressLine1: "456 Oak St" } },
    });
    await contractRepository.save(original.id, { status: "exported", jurisdictionState: "TX" });

    const copy = await contractRepository.duplicate(original.id);
    expect(copy).not.toBeNull();
    expect(copy!.id).not.toBe(original.id);
    expect(copy!.status).toBe("draft");
    expect(copy!.formData.property.addressLine1).toBe("456 Oak St");
    expect(copy!.jurisdictionState).toBe("TX");
  });

  it("duplicate() returns null when the source contract doesn't exist", async () => {
    const { contractRepository } = await import("@/lib/repositories/contractRepository");
    expect(await contractRepository.duplicate("nonexistent")).toBeNull();
  });

  it("archive() sets status to archived", async () => {
    const { contractRepository } = await import("@/lib/repositories/contractRepository");
    const contract = await contractRepository.create({
      dealId: DEAL_OWNED_BY_A,
      templateId: GENERAL_PURCHASE_AGREEMENT_TEMPLATE_ID,
      templateVersion: GENERAL_PURCHASE_AGREEMENT_TEMPLATE_VERSION,
      formData: emptyContractFormData(),
    });
    const archived = await contractRepository.archive(contract.id);
    expect(archived.status).toBe("archived");
  });

  it("delete() removes the contract", async () => {
    const { contractRepository } = await import("@/lib/repositories/contractRepository");
    const contract = await contractRepository.create({
      dealId: DEAL_OWNED_BY_A,
      templateId: GENERAL_PURCHASE_AGREEMENT_TEMPLATE_ID,
      templateVersion: GENERAL_PURCHASE_AGREEMENT_TEMPLATE_VERSION,
      formData: emptyContractFormData(),
    });
    await contractRepository.delete(contract.id);
    expect(await contractRepository.get(contract.id)).toBeNull();
  });

  it("create() throws when not signed in", async () => {
    mockClient = createMockSupabaseClient({ session: null });
    seedDeals(mockClient);
    const { contractRepository, ContractStorageError } = await import("@/lib/repositories/contractRepository");
    await expect(
      contractRepository.create({
        dealId: DEAL_OWNED_BY_A,
        templateId: GENERAL_PURCHASE_AGREEMENT_TEMPLATE_ID,
        templateVersion: GENERAL_PURCHASE_AGREEMENT_TEMPLATE_VERSION,
        formData: emptyContractFormData(),
      }),
    ).rejects.toThrow(ContractStorageError);
  });

  it("recovers to an empty form shape when stored form_data is malformed (never crashes)", async () => {
    const { contractRepository } = await import("@/lib/repositories/contractRepository");
    mockClient.__tables.set("contracts", [
      {
        id: "corrupt-1",
        user_id: USER_A,
        deal_id: DEAL_OWNED_BY_A,
        template_id: GENERAL_PURCHASE_AGREEMENT_TEMPLATE_ID,
        template_version: GENERAL_PURCHASE_AGREEMENT_TEMPLATE_VERSION,
        jurisdiction_state: null,
        status: "draft",
        form_data: { property: "not an object at all" },
        document_snapshot: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
    const contract = await contractRepository.get("corrupt-1");
    expect(contract).not.toBeNull();
    expect(contract!.formData.property.addressLine1).toBe("");
    expect(contract!.formData.buyer.legalName).toBe("");
  });

  it("falls back to draft status when a stored status value is invalid", async () => {
    const { contractRepository } = await import("@/lib/repositories/contractRepository");
    mockClient.__tables.set("contracts", [
      {
        id: "corrupt-2",
        user_id: USER_A,
        deal_id: DEAL_OWNED_BY_A,
        template_id: GENERAL_PURCHASE_AGREEMENT_TEMPLATE_ID,
        template_version: GENERAL_PURCHASE_AGREEMENT_TEMPLATE_VERSION,
        jurisdiction_state: null,
        status: "totally_not_a_status",
        form_data: {},
        document_snapshot: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
    const contract = await contractRepository.get("corrupt-2");
    expect(contract!.status).toBe("draft");
  });
});
