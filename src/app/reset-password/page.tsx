import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = { title: "Reset Password — RealOffer AI" };

/**
 * Deliberately has no server-side "already authenticated → redirect to
 * dashboard" guard (unlike app/login/page.tsx and app/signup/page.tsx) —
 * a visitor who legitimately reaches this page via the email link *does*
 * already have a valid (recovery) session by the time they land here, and
 * that guard would bounce them straight to the dashboard before they could
 * ever set a new password.
 *
 * The Suspense boundary is required because ResetPasswordForm reads
 * useSearchParams() (to detect a Supabase error redirect, e.g.
 * ?error=access_denied&error_code=otp_expired) and this route has no
 * server-side data fetch of its own — without it, Next can't statically
 * prerender the page at build time.
 *
 * The recovery session itself is never handled here or in a route handler:
 * clicking the (default, unedited) Supabase recovery email link lands the
 * browser directly on this page with a PKCE `?code=` param, and the
 * Supabase browser client (see lib/supabase/client.ts, detectSessionInUrl
 * defaults to true) detects and exchanges it automatically on load, before
 * ResetPasswordForm's useAuth() session check ever runs.
 */
export default function ResetPasswordPage() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-background px-4 py-12">
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
