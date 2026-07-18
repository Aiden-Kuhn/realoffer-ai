"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

/**
 * Browser-side Supabase client. Safe to use directly from client components
 * — every table it can reach is protected by row-level security (see
 * supabase/migrations), so a user can only ever read or write their own
 * rows regardless of what queries this client issues.
 */
export function createClient() {
  return createBrowserClient<Database>(getSupabaseUrl(), getSupabaseAnonKey());
}
