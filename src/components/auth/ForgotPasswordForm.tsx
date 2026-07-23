"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sparkles, AlertCircle, MailCheck, ArrowLeft } from "lucide-react";
import { Field, inputClasses } from "@/components/shared/Field";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@/lib/validation/schemas";
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

export function ForgotPasswordForm() {
  const { sendPasswordResetEmail } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(values: ForgotPasswordFormValues) {
    setFormError(null);
    setIsSubmitting(true);
    const { error } = await sendPasswordResetEmail(values.email);
    setIsSubmitting(false);
    if (error) {
      setFormError(error);
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="w-full max-w-sm text-center">
        <BrandHeader />
        <div className="rounded-2xl border border-border bg-surface p-7">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-accent-3/10">
            <MailCheck className="h-5 w-5 text-accent-3" />
          </span>
          <h1 className="mt-4 text-xl font-semibold text-white">Check your email</h1>
          <p className="mt-1.5 text-sm text-muted leading-relaxed">
            If an account exists with that email, we&apos;ve sent a password reset link.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center justify-center h-11 w-full rounded-full bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors"
          >
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <BrandHeader />

      <div className="rounded-2xl border border-border bg-surface p-7">
        <h1 className="text-xl font-semibold text-white text-center">Reset your password</h1>
        <p className="mt-1.5 text-sm text-muted text-center leading-relaxed">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>

        {formError ? (
          <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-red-400/25 bg-red-400/10 px-3.5 py-3 text-xs leading-relaxed text-red-300">
            <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            {formError}
          </div>
        ) : null}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 flex flex-col gap-4">
          <Field label="Email" htmlFor="email" error={errors.email?.message} required>
            <input id="email" type="email" autoComplete="email" placeholder="jamie@example.com" className={inputClasses} {...register("email")} />
          </Field>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 inline-flex items-center justify-center h-11 rounded-full bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-60"
          >
            {isSubmitting ? "Sending…" : "Send Reset Link"}
          </button>
        </form>
      </div>

      <p className="mt-5 text-center text-sm text-muted">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-white hover:text-accent-3 font-medium">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to login
        </Link>
      </p>
    </div>
  );
}
