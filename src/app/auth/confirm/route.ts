import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveSafeRedirect } from "@/lib/auth/redirectTarget";

/**
 * Server-side landing point for Supabase email links (currently only the
 * password-recovery template points here — see the Reset Password template
 * configured in the Supabase dashboard). Verifying the OTP here, in a Route
 * Handler, is what lets the resulting session cookie actually get written
 * (a Server Component's cookie writes are silently discarded — see the
 * comment in lib/supabase/server.ts) so the browser already has a valid
 * session by the time it lands on `next`.
 *
 * Deliberately uses `verifyOtp` with the email's `token_hash` rather than
 * following Supabase's default `.ConfirmationURL` (PKCE `?code=` link):
 * a code-exchange requires the same browser that *requested* the reset,
 * because the PKCE code_verifier lives in that browser's cookies — but
 * password reset links are routinely opened from a phone's mail app or a
 * different browser than the one that asked for the reset. `token_hash`
 * verification has no such same-browser requirement.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = resolveSafeRedirect(searchParams.get("next"), "/reset-password");

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/reset-password?error=invalid_link`);
}
