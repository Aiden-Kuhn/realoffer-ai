"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

type BrowserSupabaseClient = ReturnType<typeof createBrowserClient<Database>>;

let browserClient: BrowserSupabaseClient | undefined;

/**
 * Browser-side Supabase client. Safe to use directly from client components
 * — every table it can reach is protected by row-level security (see
 * supabase/migrations), so a user can only ever read or write their own
 * rows regardless of what queries this client issues.
 *
 * Memoized to a single module-level instance. Every caller (AuthProvider,
 * every repository) used to get its own fresh client from this function —
 * Supabase's own GoTrue client warns against that ("Multiple GoTrueClient
 * instances detected in the same browser context"), because each instance
 * runs its own token-refresh timer while reading/writing the *same* session
 * cookies, so competing instances can race and clobber each other's
 * refreshed token. One shared instance means one refresh timer and one
 * consistent view of the session everywhere in the app.
 */
export function createClient(): BrowserSupabaseClient {
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(getSupabaseUrl(), getSupabaseAnonKey());
  }
  return browserClient;
}
