import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { GlowOrb } from "@/components/ui/GlowOrb";

export function CTA() {
  return (
    <section id="get-started" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-[28px] border border-border-strong bg-gradient-to-b from-surface-2 to-surface px-8 py-16 sm:px-16 sm:py-20 text-center">
            <div className="absolute inset-0 bg-grid opacity-40 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)]" />
            <GlowOrb
              className="h-[380px] w-[380px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30 animate-pulse-slow"
              color="var(--accent)"
            />
            <div className="relative flex flex-col items-center">
              <h2 className="max-w-xl text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight leading-[1.1] text-white text-balance">
                Start underwriting deals like the pros
              </h2>
              <p className="mt-5 max-w-lg text-lg text-muted leading-relaxed text-balance">
                Try RealOffer AI free and move faster on the deals that matter —
                with the data to back every offer.
              </p>
              <div className="mt-9 flex flex-col sm:flex-row items-center gap-3">
                <Button href="/signup" variant="primary" size="lg">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button href="mailto:sales@realoffer.ai" variant="secondary" size="lg">
                  Talk to Sales
                </Button>
              </div>
              <p className="mt-6 text-sm text-muted">No credit card required · Cancel anytime</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
