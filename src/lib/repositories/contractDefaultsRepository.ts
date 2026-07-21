import { createClient } from "@/lib/supabase/client";
import type { DueDiligenceDefaults, DueDiligenceDefaultsValues } from "@/lib/contractDefaults/types";
import type { Database } from "@/lib/supabase/database.types";

const DUE_DILIGENCE_CATEGORY = "due_diligence" as const;

/** Thrown when a Supabase read/write fails (network error, RLS rejection,
 * not signed in, etc.). */
export class ContractDefaultsStorageError extends Error {
  constructor(message = "Couldn't save your defaults — check your connection and try again.") {
    super(message);
    this.name = "ContractDefaultsStorageError";
  }
}

type ContractDefaultsRow = Database["public"]["Tables"]["contract_defaults"]["Row"];

function rowToDueDiligenceDefaults(row: ContractDefaultsRow): DueDiligenceDefaults {
  const values = row.values as Partial<DueDiligenceDefaultsValues> | null;
  return {
    id: row.id,
    userId: row.user_id,
    category: DUE_DILIGENCE_CATEGORY,
    values: {
      inspectionPeriodDays: values?.inspectionPeriodDays ?? null,
      titleReviewPeriodDays: values?.titleReviewPeriodDays ?? null,
      rightToTerminateDuringInspection: values?.rightToTerminateDuringInspection ?? false,
      surveyRequired: values?.surveyRequired ?? false,
      propertyCondition: values?.propertyCondition ?? null,
      propertyAccessTerms: values?.propertyAccessTerms ?? "",
      dueDiligenceNotes: values?.dueDiligenceNotes ?? "",
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function requireUserId(): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new ContractDefaultsStorageError("You're not signed in — please log in again.");
  return session.user.id;
}

export interface ContractDefaultsRepository {
  /** Null means "no defaults saved yet" — the caller's first-time-user
   * state, not an error. */
  getDueDiligenceDefaults(): Promise<DueDiligenceDefaults | null>;
  saveDueDiligenceDefaults(values: DueDiligenceDefaultsValues): Promise<DueDiligenceDefaults>;
  /** Deletes the saved row entirely — back to "no defaults saved" rather
   * than saving blank values, so a reset user sees the same first-time
   * messaging as someone who never saved defaults at all. */
  resetDueDiligenceDefaults(): Promise<void>;
}

export class SupabaseContractDefaultsRepository implements ContractDefaultsRepository {
  async getDueDiligenceDefaults(): Promise<DueDiligenceDefaults | null> {
    const userId = await requireUserId();
    const supabase = createClient();
    const { data, error } = await supabase
      .from("contract_defaults")
      .select("*")
      .eq("user_id", userId)
      .eq("category", DUE_DILIGENCE_CATEGORY)
      .maybeSingle();
    if (error) throw new ContractDefaultsStorageError();
    return data ? rowToDueDiligenceDefaults(data) : null;
  }

  async saveDueDiligenceDefaults(values: DueDiligenceDefaultsValues): Promise<DueDiligenceDefaults> {
    const userId = await requireUserId();
    const supabase = createClient();
    const { data, error } = await supabase
      .from("contract_defaults")
      .upsert(
        {
          user_id: userId,
          category: DUE_DILIGENCE_CATEGORY,
          values,
        },
        { onConflict: "user_id,category" },
      )
      .select()
      .single();
    if (error || !data) throw new ContractDefaultsStorageError();
    return rowToDueDiligenceDefaults(data);
  }

  async resetDueDiligenceDefaults(): Promise<void> {
    const userId = await requireUserId();
    const supabase = createClient();
    const { error } = await supabase.from("contract_defaults").delete().eq("user_id", userId).eq("category", DUE_DILIGENCE_CATEGORY);
    if (error) throw new ContractDefaultsStorageError();
  }
}

export const contractDefaultsRepository: ContractDefaultsRepository = new SupabaseContractDefaultsRepository();
