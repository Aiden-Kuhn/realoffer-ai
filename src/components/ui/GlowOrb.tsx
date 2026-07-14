type GlowOrbProps = {
  className?: string;
  color?: string;
};

export function GlowOrb({ className = "", color = "var(--accent)" }: GlowOrbProps) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute rounded-full blur-[110px] ${className}`}
      style={{ background: color }}
    />
  );
}
