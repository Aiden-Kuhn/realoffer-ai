/**
 * Both values here are meant to be public — the URL and anon/publishable
 * key are safe to ship to the browser by design; every table they can reach
 * is protected by row-level security (see supabase/migrations). Never add
 * the service_role/secret key to this file or any NEXT_PUBLIC_ variable.
 */
export function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set — see .env.example.");
  return url;
}

export function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set — see .env.example.");
  return key;
}
