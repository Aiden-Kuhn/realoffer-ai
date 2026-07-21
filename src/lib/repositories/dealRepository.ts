import { normalizeLegacyDeal } from "@/lib/repositories/dealMigration";
import { createClient } from "@/lib/supabase/client";
import type { Deal, DealPipelineStatus } from "@/types/deal";
import type { Database } from "@/lib/supabase/database.types";

export type DealSortField = "date" | "arv" | "assignmentFee" | "profit";
export type SortDirection = "asc" | "desc";

/** Thrown when a Supabase read/write fails (network error, RLS rejection,
 * not signed in, etc.) — callers should catch this and show the user a
 * clear message rather than letting it crash the UI. */
export class DealStorageError extends Error {
  constructor(message = "Couldn't reach your saved deals — check your connection and try again.") {
    super(message);
    this.name = "DealStorageError";
  }
}

type DealRow = Database["public"]["Tables"]["deals"]["Row"];

function rowToDeal(row: DealRow): Deal {
  return normalizeLegacyDeal({
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    status: row.status,
    notes: row.notes,
    isSample: row.is_sample,
    dataMode: row.data_mode,
    property: row.property,
    comparables: row.comparables,
    assumptions: row.assumptions,
    repairEstimate: row.repair_estimate,
    results: row.results,
    investmentAnalysis: row.investment_analysis ?? undefined,
    bedroomsOverride: row.bedrooms_override,
    bathroomsOverride: row.bathrooms_override,
  });
}

async function requireUserId(): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new DealStorageError("You're not signed in — please log in again.");
  return session.user.id;
}

export interface DealRepository {
  list(): Promise<Deal[]>;
  get(id: string): Promise<Deal | null>;
  save(deal: Deal): Promise<Deal>;
  delete(id: string): Promise<void>;
  duplicate(id: string): Promise<Deal | null>;
  search(deals: Deal[], query: string): Deal[];
  filterByStatus(deals: Deal[], status: DealPipelineStatus | "all"): Deal[];
  sort(deals: Deal[], by: DealSortField, direction: SortDirection): Deal[];
}

export class SupabaseDealRepository implements DealRepository {
  async list(): Promise<Deal[]> {
    const supabase = createClient();
    const { data, error } = await supabase.from("deals").select("*").order("created_at", { ascending: false });
    if (error) throw new DealStorageError();
    return (data ?? []).map(rowToDeal);
  }

  async get(id: string): Promise<Deal | null> {
    const supabase = createClient();
    const { data, error } = await supabase.from("deals").select("*").eq("id", id).maybeSingle();
    if (error) throw new DealStorageError();
    return data ? rowToDeal(data) : null;
  }

  async save(deal: Deal): Promise<Deal> {
    const userId = await requireUserId();
    const supabase = createClient();
    const { data, error } = await supabase
      .from("deals")
      .upsert(
        {
          id: deal.id,
          user_id: userId,
          status: deal.status,
          notes: deal.notes,
          is_sample: deal.isSample ?? false,
          data_mode: deal.dataMode,
          property: deal.property,
          comparables: deal.comparables,
          assumptions: deal.assumptions,
          repair_estimate: deal.repairEstimate,
          results: deal.results,
          investment_analysis: deal.investmentAnalysis ?? null,
          bedrooms_override: deal.bedroomsOverride ?? null,
          bathrooms_override: deal.bathroomsOverride ?? null,
        },
        { onConflict: "id" },
      )
      .select()
      .single();
    if (error || !data) throw new DealStorageError();
    return rowToDeal(data);
  }

  async delete(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from("deals").delete().eq("id", id);
    if (error) throw new DealStorageError();
  }

  async duplicate(id: string): Promise<Deal | null> {
    const original = await this.get(id);
    if (!original) return null;

    const copy: Deal = {
      ...original,
      id: crypto.randomUUID(),
      status: "draft",
      notes: original.notes,
      property: { ...original.property, address: { ...original.property.address } },
    };
    return this.save(copy);
  }

  search(deals: Deal[], query: string): Deal[] {
    const q = query.trim().toLowerCase();
    if (!q) return deals;
    return deals.filter((d) => d.property.address.formatted.toLowerCase().includes(q) || d.notes.toLowerCase().includes(q));
  }

  filterByStatus(deals: Deal[], status: DealPipelineStatus | "all"): Deal[] {
    if (status === "all") return deals;
    return deals.filter((d) => d.status === status);
  }

  sort(deals: Deal[], by: DealSortField, direction: SortDirection): Deal[] {
    const factor = direction === "asc" ? 1 : -1;
    const sorted = [...deals].sort((a, b) => {
      switch (by) {
        case "date":
          return factor * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        case "arv":
          return factor * (resolveArv(a) - resolveArv(b));
        case "assignmentFee":
          return factor * (a.assumptions.desiredAssignmentFeeCents - b.assumptions.desiredAssignmentFeeCents);
        case "profit":
          return factor * (a.results.projectedInvestorProfitCents - b.results.projectedInvestorProfitCents);
        default:
          return 0;
      }
    });
    return sorted;
  }
}

function resolveArv(deal: Deal): number {
  return deal.assumptions.arvOverrideCents ?? deal.property.arvExpectedCents;
}

export const dealRepository: DealRepository = new SupabaseDealRepository();
