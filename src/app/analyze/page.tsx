import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { AnalyzePropertyForm } from "@/components/analyze/AnalyzePropertyForm";

export const metadata: Metadata = { title: "Analyze a Property — RealOffer AI" };

/**
 * The focused, distraction-free entry point for starting a new deal — no
 * dashboard sidebar/top bar (see app/analyze/layout.tsx for the auth guard
 * that keeps this page authenticated-only). All of the actual form/analysis
 * logic lives in AnalyzePropertyForm, reused as-is; this page only supplies
 * the surrounding chrome.
 */
export default function AnalyzePropertyPage() {
  return (
    <div className="min-h-dvh flex flex-col bg-background px-4 py-10 sm:py-14">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col">
        <div className="flex items-center justify-between gap-4 mb-10 sm:mb-14">
          <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent via-accent-2 to-accent-3">
              <Sparkles className="h-4 w-4 text-white" strokeWidth={2.5} />
            </span>
            <span className="truncate text-[15px] font-semibold tracking-tight text-white">
              RealOffer <span className="text-muted font-normal">AI</span>
            </span>
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 shrink-0 text-sm text-muted hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 rounded-full px-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">Analyze a property</h1>
          <p className="mt-2 text-sm sm:text-[15px] text-muted leading-relaxed max-w-lg">
            Paste a listing link or enter the property manually to generate a complete investment analysis.
          </p>
        </div>

        <AnalyzePropertyForm />
      </div>
    </div>
  );
}
