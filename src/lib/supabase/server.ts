import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

/**
 * Server-side Supabase client for Server Components and Server Actions.
 * Reads/writes the session via the request's cookies so auth state stays in
 * sync between client and server. `setAll` can be called from a Server
 * Component (where cookie writes are a no-op) as well as a Server Action
 * (where they take effect) — see the try/catch note below.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component during render, where cookies()
          // is read-only — safe to ignore because the proxy (src/proxy.ts)
          // refreshes the session on every request anyway.
        }
      },
    },
  });
}
