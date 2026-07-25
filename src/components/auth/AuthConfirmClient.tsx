"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { EmailOtpType } from "@supabase/supabase-js";
import { Sparkles, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Field, inputClasses } from "@/components/shared/Field";
import { useAuth } from "@/lib/auth/AuthProvider";

const BrandHeader = () => (
  <Link href="/" className="flex items-center gap-2 justify-center mb-8">
    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent via-accent-2 to-accent-3">
      <Sparkles className="h-4 w-4 text-white" strokeWidth={2.5} />
    </span>
    <span className="text-[15px] font-semibold tracking-tight text-white">
      RealOffer <span className="text-muted font-normal">AI</span>
    </span>
  </Link>
);

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-sm text-center">
      <BrandHeader />
      <div className="rounded-2xl border border-border bg-surface p-7">{children}</div>
    </div>
  );
}

type ResendState = "idle" | "sending" | "sent" | "error";

/**
 * Lands here from the Supabase "Confirm signup" email. Which query params
 * actually arrive depends on the project's email template / GoTrue
 * configuration, and both are valid, real Supabase behaviors — this
 * supports both rather than assuming one:
 *
 *   - `token_hash` + `type`: what GoTrue's *hosted* /verify endpoint (i.e.
 *     the default, unedited "Confirm signup" template's `.ConfirmationURL`)
 *     redirects here with after verifying the token itself server-side.
 *     Completed via `verifyOtp({ token_hash, type })`.
 *   - `code`: a PKCE authorization code, produced when the email template
 *     is customized to link directly at this route with `{{ .TokenHash }}`
 *     under PKCE-flow settings, or by other Supabase-initiated flows.
 *     Completed via `exchangeCodeForSession(code)`.
 *
 * token_hash+type is checked first (see AuthProvider.confirmEmail) — a
 * fresh, valid link that happens not to carry a `code` must not be treated
 * as invalid just because `code` is the param this route used to expect.
 *
 * Either way, the exchange happens client-side (not a Route Handler) via
 * the same browser Supabase client used everywhere else in the app, so the
 * resulting session cookies are written exactly like any other sign-in —
 * and so this can show a loading state while in flight, which a
 * redirect-only Route Handler couldn't render at all.
 */
export function AuthConfirmClient() {
  const searchParams = useSearchParams();
  const { confirmEmail, resendVerificationEmail } = useAuth();
  const [hasError, setHasError] = useState(false);
  // Guards the exchange itself against firing twice — a PKCE code is
  // single-use, so a second attempt (e.g. React Strict Mode's dev-only
  // double-invoke of effects) would always fail even though the first one
  // already succeeded, which would wrongly flip a genuinely successful
  // verification into an "invalid link" error.
  const attemptedRef = useRef(false);
  const mountedRef = useRef(true);

  const [resendEmail, setResendEmail] = useState("");
  const [resendState, setResendState] = useState<ResendState>("idle");
  const [resendError, setResendError] = useState<string | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (attemptedRef.current) return;
    attemptedRef.current = true;

    // Wrapped in an async function rather than setting state directly in
    // the effect body — even the "neither param present" branch goes
    // through this, so every setState call here happens from a resolved
    // microtask, not synchronously during the effect itself.
    async function verify() {
      // token_hash+type first: that's what the default, unedited "Confirm
      // signup" template actually produces (see the doc comment above) —
      // checking `code` first would wrongly show "invalid link" for every
      // genuinely fresh, valid link in that configuration.
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type") as EmailOtpType | null;
      const code = searchParams.get("code");

      const input = tokenHash && type ? { tokenHash, type } : code ? { code } : null;
      if (!input) {
        setHasError(true);
        return;
      }

      const { error } = await confirmEmail(input);
      if (error) {
        if (mountedRef.current) setHasError(true);
        return;
      }
      // Full navigation, not router.push: the session was just established
      // via cookies the browser Supabase client already wrote — a hard
      // navigation guarantees app/dashboard/layout.tsx's server-side guard
      // sees it on the very next request instead of racing a client-side
      // transition. Deliberately unguarded by mountedRef: this is a real
      // browser navigation, not a React state update, and skipping it would
      // strand a genuinely-verified user on this screen forever.
      window.location.href = "/dashboard";
    }

    verify();
  }, [searchParams, confirmEmail]);

  async function handleResend(event: FormEvent) {
    event.preventDefault();
    if (!resendEmail.trim() || resendState === "sending") return;
    setResendState("sending");
    setResendError(null);
    const { error } = await resendVerificationEmail(resendEmail);
    if (error) {
      setResendState("error");
      setResendError(error);
      return;
    }
    setResendState("sent");
  }

  if (!hasError) {
    return (
      <Card>
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-accent/10">
          <Loader2 className="h-5 w-5 text-accent animate-spin" />
        </span>
        <h1 className="mt-4 text-xl font-semibold text-white">Verifying your email and signing you in…</h1>
      </Card>
    );
  }

  return (
    <Card>
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-red-400/10">
        <AlertCircle className="h-5 w-5 text-red-300" />
      </span>
      <h1 className="mt-4 text-xl font-semibold text-white">This verification link is invalid or has expired</h1>
      <p className="mt-1.5 text-sm text-muted leading-relaxed">
        Links expire after a while and can only be used once. If you&apos;ve already verified your email, just log in — otherwise request a new link
        below.
      </p>

      <Link
        href="/login"
        className="mt-6 inline-flex items-center justify-center h-11 w-full rounded-full bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors"
      >
        Return to login
      </Link>

      <form onSubmit={handleResend} noValidate className="mt-5 text-left">
        <Field label="Email" htmlFor="resendEmail" required>
          <input
            id="resendEmail"
            type="email"
            autoComplete="email"
            placeholder="jamie@example.com"
            className={inputClasses}
            value={resendEmail}
            onChange={(e) => setResendEmail(e.target.value)}
          />
        </Field>

        {resendState === "error" && resendError ? <p className="mt-2 text-xs text-red-400">{resendError}</p> : null}

        {resendState === "sent" ? (
          <p className="mt-3 flex items-center justify-center gap-2 text-sm text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Verification email sent — check your inbox.
          </p>
        ) : (
          <button
            type="submit"
            disabled={resendState === "sending"}
            className="mt-3 inline-flex items-center justify-center h-10 w-full rounded-full border border-border text-sm font-medium text-white hover:border-border-strong transition-colors disabled:opacity-60"
          >
            {resendState === "sending" ? "Sending…" : "Resend verification email"}
          </button>
        )}
      </form>
    </Card>
  );
}
