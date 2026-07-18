/**
 * Hand-written to match supabase/migrations/0001_init.sql exactly. If the
 * schema changes, update this file and the migration together — there's no
 * Supabase CLI in this environment to auto-generate it from the live DB.
 */
export type Database = {
  public: {
    Tables: {
      deals: {
        Relationships: [];
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          updated_at: string;
          status: string;
          notes: string;
          is_sample: boolean;
          data_mode: string;
          property: unknown;
          comparables: unknown;
          assumptions: unknown;
          repair_estimate: unknown;
          results: unknown;
          investment_analysis: unknown | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
          updated_at?: string;
          status: string;
          notes?: string;
          is_sample?: boolean;
          data_mode: string;
          property: unknown;
          comparables?: unknown;
          assumptions: unknown;
          repair_estimate: unknown;
          results: unknown;
          investment_analysis?: unknown | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
          status?: string;
          notes?: string;
          is_sample?: boolean;
          data_mode?: string;
          property?: unknown;
          comparables?: unknown;
          assumptions?: unknown;
          repair_estimate?: unknown;
          results?: unknown;
          investment_analysis?: unknown | null;
        };
      };
      user_settings: {
        Relationships: [];
        Row: {
          user_id: string;
          full_name: string;
          company_name: string;
          default_assignment_fee_cents: number;
          default_investor_arv_percentage: number;
          default_holding_period_months: number;
          default_buyer_closing_cost_percentage: number;
          default_selling_cost_percentage: number;
          default_financing_cost_percentage: number;
          currency: string;
          density: string;
        };
        Insert: {
          user_id: string;
          full_name?: string;
          company_name?: string;
          default_assignment_fee_cents?: number;
          default_investor_arv_percentage?: number;
          default_holding_period_months?: number;
          default_buyer_closing_cost_percentage?: number;
          default_selling_cost_percentage?: number;
          default_financing_cost_percentage?: number;
          currency?: string;
          density?: string;
        };
        Update: {
          user_id?: string;
          full_name?: string;
          company_name?: string;
          default_assignment_fee_cents?: number;
          default_investor_arv_percentage?: number;
          default_holding_period_months?: number;
          default_buyer_closing_cost_percentage?: number;
          default_selling_cost_percentage?: number;
          default_financing_cost_percentage?: number;
          currency?: string;
          density?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
