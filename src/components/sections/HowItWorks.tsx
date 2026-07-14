import { SectionHeading } from "@/components/ui/SectionHeading";
import { StaggerGroup, StaggerItem } from "@/components/ui/Reveal";
import { steps } from "@/lib/data";

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-28 sm:py-36 border-t border-border">
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeading
          eyebrow="Workflow"
          title="From address to offer in four steps"
          description="No spreadsheets, no manual comps pulls, no guesswork — just a faster path to a confident decision."
        />

        <StaggerGroup className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <StaggerItem key={step.title} className="relative">
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-3 mb-5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06] border border-border text-sm font-semibold text-white/70 tabular-nums">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {index < steps.length - 1 ? (
                    <span className="hidden lg:block h-px flex-1 bg-gradient-to-r from-border to-transparent" />
                  ) : null}
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-accent/20 to-accent-2/10 border border-accent/20 mb-4">
                  <step.icon className="h-5 w-5 text-accent-3" strokeWidth={1.75} />
                </div>
                <h3 className="text-lg font-semibold text-white tracking-tight">{step.title}</h3>
                <p className="mt-2.5 text-[15px] leading-relaxed text-muted">{step.description}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
