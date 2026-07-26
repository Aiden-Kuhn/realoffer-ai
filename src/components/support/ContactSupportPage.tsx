"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Mail, Sparkles } from "lucide-react";
import { ContactSupportForm } from "@/components/support/ContactSupportForm";
import { SupportFAQAccordion } from "@/components/support/SupportFAQAccordion";
import { SUPPORT_EMAIL } from "@/lib/support/submitSupportRequest";

const SUPPORT_MAILTO = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("RealOfferAI Support Request")}`;

type ContactSupportPageProps = {
  isAuthenticated: boolean;
  userEmail: string;
  userFullName: string;
};

export function ContactSupportPage({ isAuthenticated, userEmail, userFullName }: ContactSupportPageProps) {
  return (
    <div className="min-h-dvh bg-background px-4 py-12 sm:py-16">
      <div className="mx-auto w-full max-w-2xl flex flex-col gap-10">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 self-start text-sm text-muted hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 rounded-full px-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        <Link href="/" className="flex items-center gap-2 justify-center">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent via-accent-2 to-accent-3">
            <Sparkles className="h-4 w-4 text-white" strokeWidth={2.5} />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-white">
            RealOffer <span className="text-muted font-normal">AI</span>
          </span>
        </Link>

        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">Contact &amp; Support</h1>
          <p className="mt-2 text-sm sm:text-base text-muted leading-relaxed max-w-lg mx-auto">
            Need help with RealOfferAI? Review the common questions below or contact our support team directly.
          </p>
        </div>

        <section aria-labelledby="support-contact-heading" className="rounded-2xl border border-border bg-surface p-6 sm:p-7">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-3/10">
              <Mail className="h-5 w-5 text-accent-3" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 id="support-contact-heading" className="text-sm font-semibold text-white">
                Email Support
              </h2>
              <a href={`mailto:${SUPPORT_EMAIL}`} className="mt-0.5 block text-sm text-accent-3 hover:text-accent-3/80 transition-colors break-all">
                {SUPPORT_EMAIL}
              </a>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted leading-relaxed">
            For account questions, billing assistance, technical issues, or feedback, contact our support team by email.
          </p>
          <a
            href={SUPPORT_MAILTO}
            className="mt-5 inline-flex w-full sm:w-auto items-center justify-center h-11 rounded-full bg-white px-6 text-sm font-medium text-black hover:bg-white/90 transition-colors"
          >
            Email Support
          </a>
          <p className="mt-3 text-xs text-muted">We aim to respond within 1–2 business days.</p>
        </section>

        <section aria-labelledby="support-form-heading" className="rounded-2xl border border-border bg-surface p-6 sm:p-7">
          <h2 id="support-form-heading" className="text-sm font-semibold text-white mb-1">
            Send us a message
          </h2>
          <p className="text-xs text-muted mb-5">Fill out the form below and we&apos;ll get back to you by email.</p>
          <ContactSupportForm defaultName={userFullName} defaultEmail={userEmail} />
        </section>

        <section aria-labelledby="support-faq-heading">
          <h2 id="support-faq-heading" className="text-xl font-semibold tracking-tight text-white text-center">
            Frequently Asked Questions
          </h2>
          <div className="mt-6">
            <SupportFAQAccordion />
          </div>
        </section>

        <section aria-labelledby="support-cta-heading" className="rounded-2xl border border-border bg-surface p-6 sm:p-7 text-center">
          <h2 id="support-cta-heading" className="text-lg font-semibold text-white">
            Still need help?
          </h2>
          <p className="mt-1.5 text-sm text-muted leading-relaxed max-w-md mx-auto">
            Send us a message and include as much detail as possible so we can assist you efficiently.
          </p>
          <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={SUPPORT_MAILTO}
              className="inline-flex w-full sm:w-auto items-center justify-center h-11 rounded-full bg-white px-6 text-sm font-medium text-black hover:bg-white/90 transition-colors"
            >
              Email Support
            </a>
            <Link
              href={isAuthenticated ? "/dashboard" : "/"}
              className="inline-flex w-full sm:w-auto items-center justify-center h-11 rounded-full border border-border px-6 text-sm font-medium text-white/80 hover:text-white hover:border-border-strong transition-colors"
            >
              {isAuthenticated ? "Return to Dashboard" : "Return Home"}
              <ArrowRight className="h-4 w-4 ml-1.5" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
