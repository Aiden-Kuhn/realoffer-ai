import { Reveal, StaggerGroup, StaggerItem } from "@/components/ui/Reveal";
import { audiences, stats } from "@/lib/data";

export function TrustedBy() {
  const loopedAudiences = [...audiences, ...audiences];

  return (
    <section className="relative border-y border-border py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <Reveal>
          <p className="text-center text-xs sm:text-sm uppercase tracking-[0.2em] text-muted">
            Built for real estate investors and wholesalers
          </p>
        </Reveal>

        <StaggerGroup className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-6">
          {stats.map((stat) => (
            <StaggerItem key={stat.label} className="flex flex-col items-center text-center gap-1.5">
              <span className="text-3xl sm:text-4xl font-semibold tracking-tight text-white tabular-nums">
                {stat.value}
              </span>
              <span className="text-sm text-muted">{stat.label}</span>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>

      <div className="mt-14 relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <div className="flex w-max gap-4 animate-marquee">
          {loopedAudiences.map((audience, i) => (
            <span
              key={`${audience}-${i}`}
              className="shrink-0 rounded-full glass px-5 py-2 text-sm text-white/60 whitespace-nowrap"
            >
              {audience}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
