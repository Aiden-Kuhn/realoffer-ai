import { ArrowRight, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GlowOrb } from "@/components/ui/GlowOrb";
import { Reveal } from "@/components/ui/Reveal";
import { trustPoints } from "@/lib/data";
import { HeroMockup } from "@/components/sections/HeroMockup";

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-40 pb-28 sm:pt-48 sm:pb-36">
      <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black_10%,transparent_70%)]" />
      <GlowOrb
        className="h-[420px] w-[420px] -top-32 left-1/2 -translate-x-[70%] opacity-30 animate-float-slow"
        color="var(--accent)"
      />
      <GlowOrb
        className="h-[380px] w-[380px] -top-16 left-1/2 translate-x-[10%] opacity-25 animate-float"
        color="var(--accent-3)"
      />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs sm:text-sm text-white/80">
              <Sparkles className="h-3.5 w-3.5 text-accent-3" />
              AI-powered underwriting for real estate investors
            </span>
          </Reveal>

          <Reveal delay={0.08}>
            <h1 className="mt-7 max-w-4xl text-4xl sm:text-5xl md:text-6xl lg:text-[4.25rem] font-semibold tracking-tight leading-[1.05] text-white text-balance">
              Analyze Real Estate Deals in{" "}
              <span className="text-gradient-accent">Seconds with AI</span>
            </h1>
          </Reveal>

          <Reveal delay={0.16}>
            <p className="mt-6 max-w-2xl text-lg sm:text-xl text-muted leading-relaxed text-balance">
              Paste a property address or listing link and instantly receive investment
              analysis, repair estimates, ARV calculations, profit projections, and
              AI-powered deal insights.
            </p>
          </Reveal>

          <Reveal delay={0.24}>
            <div className="mt-10 flex flex-col sm:flex-row items-center gap-3">
              <Button href="#get-started" variant="primary" size="lg">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button href="#demo" variant="secondary" size="lg">
                <Play className="h-4 w-4" />
                Watch Demo
              </Button>
            </div>
          </Reveal>

          <Reveal delay={0.32}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
              {trustPoints.map((point) => (
                <div key={point.label} className="flex items-center gap-2 text-sm text-white/50">
                  <point.icon className="h-4 w-4 text-white/30" />
                  {point.label}
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        <div className="mt-20">
          <HeroMockup />
        </div>
      </div>
    </section>
  );
}
