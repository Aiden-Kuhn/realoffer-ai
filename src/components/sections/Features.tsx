import { SectionHeading } from "@/components/ui/SectionHeading";
import { StaggerGroup, StaggerItem } from "@/components/ui/Reveal";
import { GlowOrb } from "@/components/ui/GlowOrb";
import { features } from "@/lib/data";

export function Features() {
  return (
    <section id="features" className="relative py-28 sm:py-36 overflow-hidden">
      <GlowOrb
        className="h-[500px] w-[500px] top-1/3 -right-64 opacity-[0.12]"
        color="var(--accent-2)"
      />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeading
          eyebrow="Platform"
          title="Everything you need to underwrite a deal"
          description="Six purpose-built tools that replace hours of spreadsheet work with a single paste."
        />

        <StaggerGroup className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature) => (
            <StaggerItem key={feature.title}>
              <div className="group relative h-full rounded-2xl border border-border bg-surface p-7 transition-all duration-300 hover:border-border-strong hover:-translate-y-1 hover:bg-surface-2">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-accent/0 via-transparent to-accent-3/0 opacity-0 group-hover:opacity-100 group-hover:from-accent/[0.06] group-hover:to-accent-3/[0.06] transition-opacity duration-300" />
                <div className="relative">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-accent/20 to-accent-2/10 border border-accent/20 mb-5">
                    <feature.icon className="h-5 w-5 text-accent-3" strokeWidth={1.75} />
                  </div>
                  <h3 className="text-lg font-semibold text-white tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="mt-2.5 text-[15px] leading-relaxed text-muted">
                    {feature.description}
                  </p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
