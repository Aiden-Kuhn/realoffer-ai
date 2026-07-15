"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sparkles, Info } from "lucide-react";
import { Field, inputClasses } from "@/components/shared/Field";
import { demoAuthSchema, type DemoAuthFormValues } from "@/lib/validation/schemas";
import { useAuth } from "@/lib/auth/AuthProvider";

type DemoAuthFormProps = {
  mode: "login" | "signup";
};

export function DemoAuthForm({ mode }: DemoAuthFormProps) {
  const router = useRouter();
  const { signIn } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DemoAuthFormValues>({ resolver: zodResolver(demoAuthSchema) });

  function onSubmit(values: DemoAuthFormValues) {
    setIsSubmitting(true);
    signIn({ name: values.name, email: values.email, companyName: values.companyName });
    router.push("/dashboard");
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
        <h1 className="text-xl font-semibold text-white text-center">
          {mode === "login" ? "Log in to your demo" : "Create your demo account"}
        </h1>
        <p className="mt-1.5 text-sm text-muted text-center leading-relaxed">
          {mode === "login" ? "Enter any name and email to continue." : "No credit card, no verification — just a name and email."}
        </p>

        <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-accent-3/20 bg-accent-3/[0.06] px-3.5 py-3 text-xs leading-relaxed text-white/70">
          <Info className="h-3.5 w-3.5 text-accent-3 mt-0.5 shrink-0" />
          This is a demo authentication flow. Nothing you enter here is verified, and any password field is never
          stored or checked — production authentication is not connected yet.
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 flex flex-col gap-4">
          <Field label="Full name" htmlFor="name" error={errors.name?.message} required>
            <input id="name" type="text" autoComplete="name" placeholder="Jamie Rivera" className={inputClasses} {...register("name")} />
          </Field>
          <Field label="Email" htmlFor="email" error={errors.email?.message} required>
            <input id="email" type="email" autoComplete="email" placeholder="jamie@example.com" className={inputClasses} {...register("email")} />
          </Field>
          {mode === "signup" ? (
            <Field label="Company name" htmlFor="companyName" hint="Optional">
              <input id="companyName" type="text" autoComplete="organization" placeholder="Rivera Capital" className={inputClasses} {...register("companyName")} />
            </Field>
          ) : null}
          <Field label="Password" htmlFor="password" hint="Visual only — not stored or verified in this demo">
            <input id="password" type="password" autoComplete="new-password" placeholder="••••••••" className={inputClasses} {...register("password")} />
          </Field>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 inline-flex items-center justify-center h-11 rounded-full bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-60"
          >
            {mode === "login" ? "Log in" : "Create demo account"}
          </button>
        </form>
      </div>

      <p className="mt-5 text-center text-sm text-muted">
        {mode === "login" ? (
          <>
            Don&apos;t have a demo account?{" "}
            <Link href="/signup" className="text-white hover:text-accent-3 font-medium">
              Sign up
            </Link>
          </>
        ) : (
          <>
            Already have one?{" "}
            <Link href="/login" className="text-white hover:text-accent-3 font-medium">
              Log in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
