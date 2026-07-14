import { type ReactNode } from "react";
import { Reveal } from "@/components/ui/Reveal";

type SectionHeadingProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  align?: "center" | "left";
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
}: SectionHeadingProps) {
  const alignment = align === "center" ? "items-center text-center mx-auto" : "items-start text-left";

  return (
    <Reveal className={`flex flex-col ${alignment} max-w-2xl gap-4`}>
      {eyebrow ? (
        <span className="text-xs font-semibold tracking-[0.2em] uppercase text-accent-3/90">
          {eyebrow}
        </span>
      ) : null}
      <h2 className="text-3xl sm:text-4xl md:text-[2.75rem] font-semibold tracking-tight leading-[1.1] text-white">
        {title}
      </h2>
      {description ? (
        <p className="text-base sm:text-lg text-muted leading-relaxed">{description}</p>
      ) : null}
    </Reveal>
  );
}
