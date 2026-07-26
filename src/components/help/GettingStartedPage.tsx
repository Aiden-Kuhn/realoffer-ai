import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Bookmark,
  Mail,
  Hammer,
  Calculator,
  FileSignature,
  LayoutDashboard,
  Gauge,
  AlertTriangle,
  ClipboardList,
  Sparkles,
} from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StaggerGroup, StaggerItem } from "@/components/ui/Reveal";
import { SupportEmailLink } from "@/components/legal/SupportEmailLink";
import { features, steps } from "@/lib/data";

const numberCardClasses = "flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-accent/20 to-accent-2/10 border border-accent/20 mb-4";

type NumberExplainer = {
  icon: typeof Gauge;
  title: string;
  description: string;
};

const NUMBER_EXPLAINERS: NumberExplainer[] = [
  {
    icon: Calculator,
    title: "ARV (After-Repair Value)",
    description:
      "A suggested resale value pulled from comparable sales for the property. You choose which comps to include or exclude, so it's never a black box — but it's an estimate, not an appraisal.",
  },
  {
    icon: Hammer,
    title: "Repair estimate",
    description:
      "A cost estimate built from a condition preset or a line-item budget by trade. It's meant to guide your assumptions, not replace a contractor's bid.",
  },
  {
    icon: FileSignature,
    title: "MAO (Maximum Allowable Offer)",
    description:
      "The highest price you could pay and still hit your target margin, calculated from ARV, repair costs, and holding costs. It updates the moment you change an assumption.",
  },
  {
    icon: Gauge,
    title: "Deal Score",
    description:
      "A 0–100 score summarizing how the numbers stack up. It's fully deterministic — never AI-influenced — so the same inputs always produce the same score.",
  },
  {
    icon: AlertTriangle,
    title: "Risks",
    description:
      "Flags for things worth double-checking, like thin margins or missing property data. A clean risk list doesn't guarantee a good deal — it just means nothing obvious was flagged.",
  },
];

export function GettingStartedPage() {
  return (
    <div className="min-h-dvh bg-background px-4 py-12 sm:py-16">
      <div className="mx-auto w-full max-w-3xl flex flex-col gap-12">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 self-start text-sm text-muted hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 rounded-full px-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        <div>
          <Link href="/" className="flex items-center gap-2 justify-center">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent via-accent-2 to-accent-3">
              <Sparkles className="h-4 w-4 text-white" strokeWidth={2.5} />
            </span>
            <span className="text-[15px] font-semibold tracking-tight text-white">
              RealOffer <span className="text-muted font-normal">AI</span>
            </span>
          </Link>

          <div className="mt-8 text-center">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">Getting Started</h1>
            <p className="mt-2 text-sm sm:text-base text-muted leading-relaxed max-w-lg mx-auto">
              A quick tour of what RealOfferAI does, how to analyze a deal, and where everything lives — come back
              here any time.
            </p>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/analyze"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 h-11 rounded-full bg-white px-6 text-sm font-medium text-black hover:bg-white/90 transition-colors"
            >
              <Search className="h-4 w-4" />
              Analyze a Property
            </Link>
            <Link
              href="/dashboard/deals"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 h-11 rounded-full border border-border px-6 text-sm font-medium text-white/80 hover:text-white hover:border-border-strong transition-colors"
            >
              <Bookmark className="h-4 w-4" />
              View Saved Deals
            </Link>
            <Link
              href="/contact"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 h-11 rounded-full border border-border px-6 text-sm font-medium text-white/80 hover:text-white hover:border-border-strong transition-colors"
            >
              <Mail className="h-4 w-4" />
              Contact Support
            </Link>
          </div>
        </div>

        <section aria-labelledby="what-it-does-heading">
          <SectionHeading
            align="left"
            eyebrow="Overview"
            title="What RealOfferAI does"
            description="RealOfferAI helps you organize and evaluate real estate deals in one place — property details, comparable sales, repair assumptions, offer calculations, deal scores, risks, saved deals, and contract tools."
          />
          <StaggerGroup className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {features.map((feature) => (
              <StaggerItem key={feature.title}>
                <div className="h-full rounded-2xl border border-border bg-surface p-6">
                  <div className={numberCardClasses}>
                    <feature.icon className="h-5 w-5 text-accent-3" strokeWidth={1.75} />
                  </div>
                  <h3 className="text-base font-semibold text-white tracking-tight">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{feature.description}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </section>

        <section aria-labelledby="how-to-analyze-heading">
          <SectionHeading
            align="left"
            eyebrow="Workflow"
            title="How to analyze a property"
            description="From an address to a full investment analysis in four steps."
          />
          <StaggerGroup className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {steps.map((step, index) => (
              <StaggerItem key={step.title}>
                <div className="h-full rounded-2xl border border-border bg-surface p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06] border border-border text-xs font-semibold text-white/70 tabular-nums">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <step.icon className="h-4 w-4 text-accent-3" strokeWidth={1.75} />
                  </div>
                  <h3 className="text-base font-semibold text-white tracking-tight">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{step.description}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </section>

        <section aria-labelledby="understanding-numbers-heading">
          <SectionHeading
            align="left"
            eyebrow="The numbers"
            title="Understanding ARV, repairs, MAO, deal score, and risks"
            description="Every analysis breaks down into a few core figures. Here's what each one means."
          />
          <StaggerGroup className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {NUMBER_EXPLAINERS.map((item) => (
              <StaggerItem key={item.title}>
                <div className="h-full rounded-2xl border border-border bg-surface p-6">
                  <div className={numberCardClasses}>
                    <item.icon className="h-5 w-5 text-accent-3" strokeWidth={1.75} />
                  </div>
                  <h3 className="text-base font-semibold text-white tracking-tight">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{item.description}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </section>

        <section aria-labelledby="saving-deals-heading" className="rounded-2xl border border-border bg-surface p-6 sm:p-7">
          <div className="flex items-start gap-3">
            <span className={numberCardClasses}>
              <LayoutDashboard className="h-5 w-5 text-accent-3" strokeWidth={1.75} />
            </span>
            <div>
              <h2 id="saving-deals-heading" className="text-base font-semibold text-white">
                Saving deals
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                Save any analysis to keep it in your pipeline, track its status from draft to closed, and revisit it
                any time from{" "}
                <Link href="/dashboard/deals" className="text-accent-3 hover:text-accent-3/80 underline transition-colors">
                  Saved Deals
                </Link>
                . You can search, filter, and sort saved deals by ARV, assignment fee, or projected profit.
              </p>
            </div>
          </div>
        </section>

        <section aria-labelledby="contracts-heading" className="rounded-2xl border border-border bg-surface p-6 sm:p-7">
          <div className="flex items-start gap-3">
            <span className={numberCardClasses}>
              <ClipboardList className="h-5 w-5 text-accent-3" strokeWidth={1.75} />
            </span>
            <div>
              <h2 id="contracts-heading" className="text-base font-semibold text-white">
                Generating and managing contracts
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                From a saved deal, you can generate a draft purchase agreement using the property and offer details
                you&apos;ve already entered. Every generated contract is a draft — review, edit, and confirm every
                term before use, and have an attorney review anything you intend to sign. Manage your drafts anytime
                from{" "}
                <Link href="/dashboard/contracts" className="text-accent-3 hover:text-accent-3/80 underline transition-colors">
                  Contracts
                </Link>
                .
              </p>
            </div>
          </div>
        </section>

        <section aria-labelledby="verify-estimates-heading" className="rounded-2xl border border-amber-400/25 bg-amber-400/10 p-6 sm:p-7">
          <h2 id="verify-estimates-heading" className="text-base font-semibold text-white">
            Estimates aren&apos;t guarantees
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-amber-100/90">
            Property values, repair costs, rent estimates, comparable sales, and investment calculations are
            estimates based on available information. Always independently verify property details and consult
            qualified real estate, legal, financial, or construction professionals before making a decision.
          </p>
        </section>

        <section aria-labelledby="support-heading" className="rounded-2xl border border-border bg-surface p-6 sm:p-7 text-center">
          <h2 id="support-heading" className="text-base font-semibold text-white">
            Need help?
          </h2>
          <p className="mt-1.5 text-sm text-muted leading-relaxed">
            Visit{" "}
            <Link href="/contact" className="text-accent-3 hover:text-accent-3/80 underline transition-colors">
              Contact &amp; Support
            </Link>{" "}
            for common questions, or email us directly at <SupportEmailLink />.
          </p>
        </section>
      </div>
    </div>
  );
}
