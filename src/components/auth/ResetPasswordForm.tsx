"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sparkles, AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { Field, inputClasses } from "@/components/shared/Field";
import { resetPasswordSchema, type ResetPasswordFormValues } from "@/lib/validation/schemas";
import { useAuth } from "@/lib/auth/AuthProvider";

const REDIRECT_DELAY_MS = 2000;

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

function PasswordInput({
  name,
  autoComplete,
  visible,
  onToggleVisible,
  register,
}: {
  name: "password" | "confirmPassword";
  autoComplete: string;
  visible: boolean;
  onToggleVisible: () => void;
  register: ReturnType<typeof useForm<ResetPasswordFormValues>>["register"];
}) {
  return (
    <div className="relative">
      <input
        id={name}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        placeholder="••••••••"
        className={`${inputClasses} pr-11`}
        {...register(name)}
      />
      <button
        type="button"
        onClick={onToggleVisible}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-md text-white/40 hover:text-white transition-colors"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading, updatePassword } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({ resolver: zodResolver(resetPasswordSchema) });

  useEffect(() => {
    if (!succeeded) return;
    const timer = setTimeout(() => {
      router.push(user ? "/dashboard" : "/login");
    }, REDIRECT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [succeeded, user, router]);

  async function onSubmit(values: ResetPasswordFormValues) {
    setFormError(null);
    setIsSubmitting(true);
    const { error } = await updatePassword(values.password);
    setIsSubmitting(false);
    if (error) {
      setFormError(error);
      return;
    }
    setSucceeded(true);
  }

  if (isLoading) {
    return (
      <Card>
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-accent/10">
          <Loader2 className="h-5 w-5 text-accent animate-spin" />
        </span>
        <h1 className="mt-4 text-xl font-semibold text-white">Verifying your link…</h1>
      </Card>
    );
  }

  if (succeeded) {
    return (
      <Card>
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-emerald-400/10">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
        </span>
        <h1 className="mt-4 text-xl font-semibold text-white">Password updated successfully.</h1>
        <p className="mt-1.5 text-sm text-muted leading-relaxed">Taking you to {user ? "your dashboard" : "login"}…</p>
      </Card>
    );
  }

  if (!user) {
    const invalidLink = searchParams.get("error") === "invalid_link";
    return (
      <Card>
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-red-400/10">
          <AlertCircle className="h-5 w-5 text-red-300" />
        </span>
        <h1 className="mt-4 text-xl font-semibold text-white">{invalidLink ? "This link is invalid or has expired" : "No active reset session"}</h1>
        <p className="mt-1.5 text-sm text-muted leading-relaxed">
          Password reset links expire after a while and can only be used once. Request a new one to continue.
        </p>
        <Link
          href="/forgot-password"
          className="mt-6 inline-flex items-center justify-center h-11 w-full rounded-full bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors"
        >
          Request a new link
        </Link>
        <Link href="/login" className="mt-3 inline-block text-sm text-muted hover:text-white transition-colors">
          Back to login
        </Link>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <BrandHeader />

      <div className="rounded-2xl border border-border bg-surface p-7">
        <h1 className="text-xl font-semibold text-white text-center">Set a new password</h1>
        <p className="mt-1.5 text-sm text-muted text-center leading-relaxed">Choose a new password for your account.</p>

        {formError ? (
          <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-red-400/25 bg-red-400/10 px-3.5 py-3 text-xs leading-relaxed text-red-300">
            <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            {formError}
          </div>
        ) : null}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 flex flex-col gap-4">
          <Field label="New password" htmlFor="password" error={errors.password?.message} hint="At least 8 characters" required>
            <PasswordInput name="password" autoComplete="new-password" visible={showPassword} onToggleVisible={() => setShowPassword((v) => !v)} register={register} />
          </Field>
          <Field label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword?.message} required>
            <PasswordInput
              name="confirmPassword"
              autoComplete="new-password"
              visible={showConfirmPassword}
              onToggleVisible={() => setShowConfirmPassword((v) => !v)}
              register={register}
            />
          </Field>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 inline-flex items-center justify-center h-11 rounded-full bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-60"
          >
            {isSubmitting ? "Updating…" : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}
