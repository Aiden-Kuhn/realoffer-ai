import { DEFAULT_SETTINGS } from "@/config/defaults";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";

export type AppSettings = typeof DEFAULT_SETTINGS;

/** Thrown when a Supabase read/write fails (network error, RLS rejection,
 * not signed in, etc.). */
export class SettingsStorageError extends Error {
  constructor(message = "Couldn't save settings — check your connection and try again.") {
    super(message);
    this.name = "SettingsStorageError";
  }
}

type SettingsRow = Database["public"]["Tables"]["user_settings"]["Row"];

function rowToSettings(row: SettingsRow): AppSettings {
  return {
    fullName: row.full_name,
    companyName: row.company_name,
    defaultAssignmentFeeCents: row.default_assignment_fee_cents,
    defaultInvestorArvPercentage: row.default_investor_arv_percentage,
    defaultHoldingPeriodMonths: row.default_holding_period_months,
    defaultBuyerClosingCostPercentage: row.default_buyer_closing_cost_percentage,
    defaultSellingCostPercentage: row.default_selling_cost_percentage,
    defaultFinancingCostPercentage: row.default_financing_cost_percentage,
    currency: DEFAULT_SETTINGS.currency,
    density: DEFAULT_SETTINGS.density,
  };
}

async function requireUserId(): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new SettingsStorageError("You're not signed in — please log in again.");
  return session.user.id;
}

export interface SettingsRepository {
  get(): Promise<AppSettings>;
  save(settings: AppSettings): Promise<AppSettings>;
  reset(): Promise<AppSettings>;
}

export class SupabaseSettingsRepository implements SettingsRepository {
  async get(): Promise<AppSettings> {
    const userId = await requireUserId();
    const supabase = createClient();
    const { data, error } = await supabase.from("user_settings").select("*").eq("user_id", userId).maybeSingle();
    if (error) throw new SettingsStorageError();
    // A missing row is expected for an account created before the
    // auto-provisioning trigger existed — fall back to defaults rather
    // than erroring, and the next save() will create the row.
    return data ? rowToSettings(data) : DEFAULT_SETTINGS;
  }

  async save(settings: AppSettings): Promise<AppSettings> {
    const userId = await requireUserId();
    const supabase = createClient();
    const { data, error } = await supabase
      .from("user_settings")
      .upsert(
        {
          user_id: userId,
          full_name: settings.fullName,
          company_name: settings.companyName,
          default_assignment_fee_cents: settings.defaultAssignmentFeeCents,
          default_investor_arv_percentage: settings.defaultInvestorArvPercentage,
          default_holding_period_months: settings.defaultHoldingPeriodMonths,
          default_buyer_closing_cost_percentage: settings.defaultBuyerClosingCostPercentage,
          default_selling_cost_percentage: settings.defaultSellingCostPercentage,
          default_financing_cost_percentage: settings.defaultFinancingCostPercentage,
        },
        { onConflict: "user_id" },
      )
      .select()
      .single();
    if (error || !data) throw new SettingsStorageError();
    return rowToSettings(data);
  }

  async reset(): Promise<AppSettings> {
    return this.save(DEFAULT_SETTINGS);
  }
}

export const settingsRepository: SettingsRepository = new SupabaseSettingsRepository();
