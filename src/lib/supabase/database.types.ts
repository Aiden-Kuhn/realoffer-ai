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
          bedrooms_override: number | null;
          bathrooms_override: number | null;
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
          bedrooms_override?: number | null;
          bathrooms_override?: number | null;
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
          bedrooms_override?: number | null;
          bathrooms_override?: number | null;
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
          mailing_address_line1: string;
          mailing_city: string;
          mailing_state: string;
          mailing_zip: string;
          phone: string;
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
          mailing_address_line1?: string;
          mailing_city?: string;
          mailing_state?: string;
          mailing_zip?: string;
          phone?: string;
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
          mailing_address_line1?: string;
          mailing_city?: string;
          mailing_state?: string;
          mailing_zip?: string;
          phone?: string;
        };
      };
      contract_defaults: {
        Relationships: [];
        Row: {
          id: string;
          user_id: string;
          category: string;
          values: unknown;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category: string;
          values?: unknown;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category?: string;
          values?: unknown;
          created_at?: string;
          updated_at?: string;
        };
      };
      buyer_profiles: {
        Relationships: [];
        Row: {
          id: string;
          user_id: string;
          is_default: boolean;
          legal_name: string;
          entity_name: string;
          mailing_address_line1: string;
          mailing_city: string;
          mailing_state: string;
          mailing_zip: string;
          email: string;
          phone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          is_default?: boolean;
          legal_name?: string;
          entity_name?: string;
          mailing_address_line1?: string;
          mailing_city?: string;
          mailing_state?: string;
          mailing_zip?: string;
          email?: string;
          phone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          is_default?: boolean;
          legal_name?: string;
          entity_name?: string;
          mailing_address_line1?: string;
          mailing_city?: string;
          mailing_state?: string;
          mailing_zip?: string;
          email?: string;
          phone?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      contracts: {
        Relationships: [];
        Row: {
          id: string;
          user_id: string;
          deal_id: string;
          template_id: string;
          template_version: string;
          jurisdiction_state: string | null;
          status: string;
          form_data: unknown;
          document_snapshot: unknown | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          deal_id: string;
          template_id: string;
          template_version: string;
          jurisdiction_state?: string | null;
          status?: string;
          form_data?: unknown;
          document_snapshot?: unknown | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          deal_id?: string;
          template_id?: string;
          template_version?: string;
          jurisdiction_state?: string | null;
          status?: string;
          form_data?: unknown;
          document_snapshot?: unknown | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
