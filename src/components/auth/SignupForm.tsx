"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sparkles, AlertCircle, MailCheck } from "lucide-react";
import { Field, inputClasses } from "@/components/shared/Field";
import { signupSchema, type SignupFormValues } from "@/lib/validation/schemas";
import { useAuth } from "@/lib/auth/AuthProvider";

export function SignupForm() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({ resolver: zodResolver(signupSchema) });

  async function onSubmit(values: SignupFormValues) {
    setFormError(null);
    setIsSubmitting(true);
    const { error, needsEmailConfirmation } = await signUp(values);
    if (error) {
      setFormError(error);
      setIsSubmitting(false);
      return;
    }
    if (needsEmailConfirmation) {
      setAwaitingConfirmation(true);
      setIsSubmitting(false);
      return;
    }
    router.push("/dashboard");
  }

  if (awaitingConfirmation) {
    return (
      <div className="w-full max-w-sm text-center">
        <Link href="/" className="flex items-center gap-2 justify-center mb-8">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent via-accent-2 to-accent-3">
            <Sparkles className="h-4 w-4 text-white" strokeWidth={2.5} />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-white">
            RealOffer <span className="text-muted font-normal">AI</span>
          </span>
        </Link>
        <div className="rounded-2xl border border-border bg-surface p-7">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-accent-3/10">
            <MailCheck className="h-5 w-5 text-accent-3" />
          </span>
          <h1 className="mt-4 text-xl font-semibold text-white">Check your email</h1>
          <p className="mt-1.5 text-sm text-muted leading-relaxed">
            We sent a confirmation link to your email address. Click it to activate your account, then log in.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center justify-center h-11 w-full rounded-full bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors"
          >
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <Link href="/" className="flex items-center gap-2 justify-center mb-8">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent via-accent-2 to-accent-3">
          <Sparkles className="h-4 w-4 text-white" strokeWidth={2.5} />
        </span>
        <span className="text-[15px] font-semibold tracking-tight text-white">
          RealOffer <span className="text-muted font-normal">AI</span>
        </span>
      </Link>

      <div className="rounded-2xl border border-border bg-surface p-7">
        <h1 className="text-xl font-semibold text-white text-center">Create your account</h1>
        <p className="mt-1.5 text-sm text-muted text-center leading-relaxed">Start analyzing deals in minutes.</p>

        {formError ? (
          <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-red-400/25 bg-red-400/10 px-3.5 py-3 text-xs leading-relaxed text-red-300">
            <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            {formError}
          </div>
        ) : null}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 flex flex-col gap-4">
          <Field label="Full name" htmlFor="fullName" error={errors.fullName?.message} required>
            <input id="fullName" type="text" autoComplete="name" placeholder="Jamie Rivera" className={inputClasses} {...register("fullName")} />
          </Field>
          <Field label="Company name" htmlFor="companyName" hint="Optional">
            <input id="companyName" type="text" autoComplete="organization" placeholder="Rivera Capital" className={inputClasses} {...register("companyName")} />
          </Field>
          <Field label="Email" htmlFor="email" error={errors.email?.message} required>
            <input id="email" type="email" autoComplete="email" placeholder="jamie@example.com" className={inputClasses} {...register("email")} />
          </Field>
          <Field label="Password" htmlFor="password" error={errors.password?.message} hint="At least 6 characters" required>
            <input id="password" type="password" autoComplete="new-password" placeholder="••••••••" className={inputClasses} {...register("password")} />
          </Field>
          <Field label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword?.message} required>
            <input id="confirmPassword" type="password" autoComplete="new-password" placeholder="••••••••" className={inputClasses} {...register("confirmPassword")} />
          </Field>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 inline-flex items-center justify-center h-11 rounded-full bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-60"
          >
            {isSubmitting ? "Creating account…" : "Create account"}
          </button>
        </form>
      </div>

      <p className="mt-5 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-white hover:text-accent-3 font-medium">
          Log in
        </Link>
      </p>
    </div>
  );
}
