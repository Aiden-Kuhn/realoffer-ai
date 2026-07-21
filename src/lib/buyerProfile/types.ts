import { emptyParty, type PartyInfo } from "@/lib/contracts/types";

/**
 * A user's saved buyer identity — reuses the exact same field shape as a
 * contract's PartyInfo (see lib/contracts/types.ts) so prefilling a
 * contract's Buyer section from this is a straight field copy, no mapping
 * layer to keep in sync.
 *
 * `isDefault` is always true today (one profile per user this milestone) —
 * present so a future multiple-profiles UI can add non-default rows
 * without a schema change. See supabase/migrations/0003_buyer_profiles.sql.
 */
export type BuyerProfile = PartyInfo & {
  id: string;
  userId: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export function emptyBuyerProfileFields(): PartyInfo {
  return emptyParty();
}
