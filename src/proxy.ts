import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

/**
 * Refreshes the Supabase session cookie on every request. Without this,
 * sessions silently go stale — the access token expires and no one ever
 * calls the refresh, so a user who left a tab open eventually looks
 * "logged out" for no visible reason. (Renamed from `middleware.ts` to
 * `proxy.ts` — the middleware file convention is deprecated as of Next.js
 * 16; see node_modules/next/dist/docs/.../proxy.md.)
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Touching auth.getUser() is what actually triggers the refresh when the
  // access token is near/past expiry — a mere cookie read would not.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
