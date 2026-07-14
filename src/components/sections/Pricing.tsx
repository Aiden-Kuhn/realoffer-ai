import { Check, Minus } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StaggerGroup, StaggerItem } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { GlowOrb } from "@/components/ui/GlowOrb";
import { plans } from "@/lib/data";

export function Pricing() {
  return (
    <section id="pricing" className="relative py-28 sm:py-36 border-t border-border overflow-hidden">
      <GlowOrb
        className="h-[500px] w-[500px] top-0 left-1/2 -translate-x-1/2 opacity-[0.1]"
        color="var(--accent)"
      />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeading
          eyebrow="Pricing"
          title="Plans that scale with your deal flow"
          description="Start with the plan that matches your deal volume, then upgrade any time as your pipeline grows."
        />

        <StaggerGroup className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan) => (
            <StaggerItem key={plan.name} className="h-full">
              <div
                className={`relative flex h-full flex-col rounded-2xl border p-8 ${
                  plan.featured
                    ? "border-accent/40 bg-gradient-to-b from-accent/[0.08] to-surface shadow-[0_20px_60px_-20px_rgba(99,102,241,0.35)] lg:-translate-y-3"
                    : "border-border bg-surface"
                }`}
              >
                {plan.featured ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-accent to-accent-2 px-4 py-1 text-xs font-semibold text-white shadow-lg">
                    Most Popular
                  </span>
                ) : null}

                <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                <p className="mt-2 text-sm text-muted leading-relaxed min-h-[2.5rem]">
                  {plan.description}
                </p>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-semibold tracking-tight text-white">
                    {plan.price}
                  </span>
                  <span className="text-sm text-muted">{plan.period}</span>
                </div>

                <Button
                  href="#get-started"
                  variant={plan.featured ? "primary" : "secondary"}
                  size="lg"
                  className="mt-7 w-full"
                >
                  {plan.cta}
                </Button>

                <ul className="mt-8 flex flex-col gap-3.5">
                  {plan.features.map((f) => (
                    <li key={f.label} className="flex items-start gap-3 text-sm">
                      {f.included ? (
                        <Check className="h-4 w-4 mt-0.5 shrink-0 text-accent-3" />
                      ) : (
                        <Minus className="h-4 w-4 mt-0.5 shrink-0 text-white/20" />
                      )}
                      <span className={f.included ? "text-white/80" : "text-white/30"}>
                        {f.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
