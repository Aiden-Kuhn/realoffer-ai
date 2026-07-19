import { createClient } from "@/lib/supabase/client";
import { rowToContract } from "@/lib/contracts/mapRow";
import type { Contract, ContractFormData, ContractStatus } from "@/lib/contracts/types";
import type { Database } from "@/lib/supabase/database.types";

/** Thrown when a Supabase read/write fails (network error, RLS rejection,
 * not signed in, etc.). */
export class ContractStorageError extends Error {
  constructor(message = "Couldn't reach your contracts — check your connection and try again.") {
    super(message);
    this.name = "ContractStorageError";
  }
}

async function requireUserId(): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new ContractStorageError("You're not signed in — please log in again.");
  return session.user.id;
}

export type NewContractInput = {
  dealId: string;
  templateId: string;
  templateVersion: string;
  formData: ContractFormData;
};

export interface ContractRepository {
  list(): Promise<Contract[]>;
  get(id: string): Promise<Contract | null>;
  create(input: NewContractInput): Promise<Contract>;
  save(id: string, patch: { formData?: ContractFormData; status?: ContractStatus; jurisdictionState?: string | null; documentSnapshot?: ContractFormData }): Promise<Contract>;
  duplicate(id: string): Promise<Contract | null>;
  archive(id: string): Promise<Contract>;
  delete(id: string): Promise<void>;
}

export class SupabaseContractRepository implements ContractRepository {
  async list(): Promise<Contract[]> {
    const supabase = createClient();
    const { data, error } = await supabase.from("contracts").select("*").order("updated_at", { ascending: false });
    if (error) throw new ContractStorageError();
    return (data ?? []).map(rowToContract);
  }

  async get(id: string): Promise<Contract | null> {
    const supabase = createClient();
    const { data, error } = await supabase.from("contracts").select("*").eq("id", id).maybeSingle();
    if (error) throw new ContractStorageError();
    return data ? rowToContract(data) : null;
  }

  async create(input: NewContractInput): Promise<Contract> {
    const userId = await requireUserId();
    const supabase = createClient();
    const { data, error } = await supabase
      .from("contracts")
      .insert({
        user_id: userId,
        deal_id: input.dealId,
        template_id: input.templateId,
        template_version: input.templateVersion,
        status: "draft",
        form_data: input.formData,
      })
      .select()
      .single();
    // RLS's "insert own contracts" policy checks both auth.uid() = user_id
    // AND that deal_id belongs to a deal owned by the same user (see the
    // migration) — so this rejects even a client that tries to point a
    // contract at a deal it doesn't own.
    if (error || !data) throw new ContractStorageError();
    return rowToContract(data);
  }

  async save(
    id: string,
    patch: { formData?: ContractFormData; status?: ContractStatus; jurisdictionState?: string | null; documentSnapshot?: ContractFormData },
  ): Promise<Contract> {
    const supabase = createClient();
    const update: Database["public"]["Tables"]["contracts"]["Update"] = {};
    if (patch.formData !== undefined) update.form_data = patch.formData;
    if (patch.status !== undefined) update.status = patch.status;
    if (patch.jurisdictionState !== undefined) update.jurisdiction_state = patch.jurisdictionState;
    if (patch.documentSnapshot !== undefined) update.document_snapshot = patch.documentSnapshot;

    const { data, error } = await supabase.from("contracts").update(update).eq("id", id).select().single();
    if (error || !data) throw new ContractStorageError();
    return rowToContract(data);
  }

  async duplicate(id: string): Promise<Contract | null> {
    const original = await this.get(id);
    if (!original) return null;
    const created = await this.create({
      dealId: original.dealId,
      templateId: original.templateId,
      templateVersion: original.templateVersion,
      formData: original.formData,
    });
    if (original.jurisdictionState === null) return created;
    return this.save(created.id, { jurisdictionState: original.jurisdictionState });
  }

  async archive(id: string): Promise<Contract> {
    return this.save(id, { status: "archived" });
  }

  async delete(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from("contracts").delete().eq("id", id);
    if (error) throw new ContractStorageError();
  }
}

export const contractRepository: ContractRepository = new SupabaseContractRepository();
