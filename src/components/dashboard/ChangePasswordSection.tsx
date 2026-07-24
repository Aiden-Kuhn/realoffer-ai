"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, CheckCircle2, Lock } from "lucide-react";
import { Field } from "@/components/shared/Field";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { changePasswordSchema, type ChangePasswordFormValues } from "@/lib/validation/schemas";
import { useAuth } from "@/lib/auth/AuthProvider";

const SIGN_OUT_DELAY_MS = 2000;

/**
 * Self-contained Settings section — its own form, independent of the main
 * Settings form above it (same convention as BuyerProfileSection /
 * DueDiligenceDefaultsSection: forms can't nest, and a change here should
 * never touch the rest of Settings' save state).
 *
 * Security model (see AuthProvider.changePassword): the account updated is
 * always the current session's own user — there is no email/user-id field
 * anywhere in this form, and the current-password field exists specifically
 * to prove the person submitting this form actually knows the existing
 * password, not just that a session cookie happens to be present.
 */
export function ChangePasswordSection() {
  const { changePassword } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({ resolver: zodResolver(changePasswordSchema) });

  useEffect(() => {
    if (!succeeded) return;
    const timer = setTimeout(() => {
      // Full navigation, not router.push: the password change already
      // signed out every session server-side (scope: "global") — a hard
      // reload is what makes app/dashboard/layout.tsx's guard see that on
      // the very next request instead of leaving stale client state around.
      window.location.href = "/login";
    }, SIGN_OUT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [succeeded]);

  async function onSubmit(values: ChangePasswordFormValues) {
    setFormError(null);
    setIsSubmitting(true);
    const { error } = await changePassword(values.currentPassword, values.newPassword);
    setIsSubmitting(false);
    if (error) {
      setFormError(error);
      return;
    }
    setSucceeded(true);
  }

  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-sm font-semibold text-white mb-1">Change password</h2>
      <p className="text-xs text-muted mb-4">Requires your current password. You&apos;ll be signed out everywhere and asked to log in again.</p>

      {succeeded ? (
        <div className="flex items-start gap-2.5 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3.5 text-sm text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
          Password updated successfully. Signing you out…
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          {formError ? (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3.5 text-sm text-red-300">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              {formError}
            </div>
          ) : null}

          <Field label="Current password" htmlFor="currentPassword" error={errors.currentPassword?.message} required>
            <PasswordInput id="currentPassword" autoComplete="current-password" registration={register("currentPassword")} />
          </Field>
          <Field label="New password" htmlFor="newPassword" error={errors.newPassword?.message} hint="At least 8 characters" required>
            <PasswordInput id="newPassword" autoComplete="new-password" registration={register("newPassword")} />
          </Field>
          <Field label="Confirm new password" htmlFor="confirmNewPassword" error={errors.confirmNewPassword?.message} required>
            <PasswordInput id="confirmNewPassword" autoComplete="new-password" registration={register("confirmNewPassword")} />
          </Field>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 h-10 rounded-full bg-white px-5 text-sm font-medium text-black hover:bg-white/90 transition-colors self-start disabled:opacity-60"
          >
            <Lock className="h-3.5 w-3.5" />
            {isSubmitting ? "Updating…" : "Update password"}
          </button>
        </form>
      )}
    </section>
  );
}
