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
  // In local development, 127.0.0.1 and localhost resolve to the same
  // machine but are different cookie origins to the browser — a session
  // established on one is invisible on the other, which looks exactly like
  // "getting logged out" the moment a link, bookmark, or browser autofill
  // happens to use the other host. Canonicalize to localhost so a session
  // never silently splits across the two.
  //
  // A LAN IP (e.g. 192.168.x.x) is deliberately left alone here — that's
  // the documented way to test this dev server from a second device (a
  // phone/tablet) on the same network, and that device's "localhost" is
  // itself, not this machine, so redirecting it would break that flow.
  //
  // Reads the raw Host header rather than `request.nextUrl.hostname` —
  // Next's NextURL silently normalizes "127.0.0.1" to "localhost" on that
  // property, so a check against `nextUrl.hostname` would never match.
  if (process.env.NODE_ENV !== "production") {
    const rawHostname = request.headers.get("host")?.split(":")[0];
    if (rawHostname === "127.0.0.1") {
      const canonicalUrl = new URL(request.nextUrl);
      canonicalUrl.hostname = "localhost";
      return NextResponse.redirect(canonicalUrl);
    }
  }

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
