"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sparkles, AlertCircle } from "lucide-react";
import { Field, inputClasses } from "@/components/shared/Field";
import { loginSchema, type LoginFormValues } from "@/lib/validation/schemas";
import { useAuth } from "@/lib/auth/AuthProvider";
import { resolveSafeRedirect } from "@/lib/auth/redirectTarget";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginFormValues) {
    setFormError(null);
    setIsSubmitting(true);
    const { error } = await signIn(values);
    if (error) {
      setFormError(error);
      setIsSubmitting(false);
      return;
    }
    router.push(resolveSafeRedirect(searchParams.get("redirectTo")));
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
        <h1 className="text-xl font-semibold text-white text-center">Log in to your account</h1>
        <p className="mt-1.5 text-sm text-muted text-center leading-relaxed">Enter your email and password to continue.</p>

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
          <div>
            <Field label="Password" htmlFor="password" error={errors.password?.message} required>
              <input id="password" type="password" autoComplete="current-password" placeholder="••••••••" className={inputClasses} {...register("password")} />
            </Field>
            <Link href="/forgot-password" className="mt-2 inline-block text-xs text-muted hover:text-white transition-colors">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 inline-flex items-center justify-center h-11 rounded-full bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-60"
          >
            {isSubmitting ? "Logging in…" : "Log in"}
          </button>
        </form>
      </div>

      <p className="mt-5 text-center text-sm text-muted">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-white hover:text-accent-3 font-medium">
          Sign up
        </Link>
      </p>
    </div>
  );
}
