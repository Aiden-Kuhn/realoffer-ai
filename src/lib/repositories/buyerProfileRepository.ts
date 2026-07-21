import { createClient } from "@/lib/supabase/client";
import type { BuyerProfile } from "@/lib/buyerProfile/types";
import type { PartyInfo } from "@/lib/contracts/types";
import type { Database } from "@/lib/supabase/database.types";

/** Thrown when a Supabase read/write fails (network error, RLS rejection,
 * not signed in, etc.). */
export class BuyerProfileStorageError extends Error {
  constructor(message = "Couldn't save your Buyer Profile — check your connection and try again.") {
    super(message);
    this.name = "BuyerProfileStorageError";
  }
}

type BuyerProfileRow = Database["public"]["Tables"]["buyer_profiles"]["Row"];

function rowToBuyerProfile(row: BuyerProfileRow): BuyerProfile {
  return {
    id: row.id,
    userId: row.user_id,
    isDefault: row.is_default,
    legalName: row.legal_name,
    entityName: row.entity_name,
    mailingAddressLine1: row.mailing_address_line1,
    mailingCity: row.mailing_city,
    mailingState: row.mailing_state,
    mailingZip: row.mailing_zip,
    email: row.email,
    phone: row.phone,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function requireUserId(): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new BuyerProfileStorageError("You're not signed in — please log in again.");
  return session.user.id;
}

export interface BuyerProfileRepository {
  /** Null means "no profile saved yet" — the caller's first-time-user state,
   * not an error. */
  get(): Promise<BuyerProfile | null>;
  save(fields: PartyInfo): Promise<BuyerProfile>;
}

export class SupabaseBuyerProfileRepository implements BuyerProfileRepository {
  async get(): Promise<BuyerProfile | null> {
    const userId = await requireUserId();
    const supabase = createClient();
    // Only one profile exists per user this milestone (see the unique(user_id)
    // constraint in the migration), so filtering by user_id alone already
    // uniquely identifies it — is_default has nothing to disambiguate yet.
    const { data, error } = await supabase.from("buyer_profiles").select("*").eq("user_id", userId).maybeSingle();
    if (error) throw new BuyerProfileStorageError();
    return data ? rowToBuyerProfile(data) : null;
  }

  async save(fields: PartyInfo): Promise<BuyerProfile> {
    const userId = await requireUserId();
    const supabase = createClient();
    const { data, error } = await supabase
      .from("buyer_profiles")
      .upsert(
        {
          user_id: userId,
          is_default: true,
          legal_name: fields.legalName,
          entity_name: fields.entityName,
          mailing_address_line1: fields.mailingAddressLine1,
          mailing_city: fields.mailingCity,
          mailing_state: fields.mailingState,
          mailing_zip: fields.mailingZip,
          email: fields.email,
          phone: fields.phone,
        },
        { onConflict: "user_id" },
      )
      .select()
      .single();
    if (error || !data) throw new BuyerProfileStorageError();
    return rowToBuyerProfile(data);
  }
}

export const buyerProfileRepository: BuyerProfileRepository = new SupabaseBuyerProfileRepository();
