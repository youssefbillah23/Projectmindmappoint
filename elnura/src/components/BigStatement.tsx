import { Reveal } from "./Reveal";

export function BigStatement() {
  return (
    <section className="relative py-32 md:py-48">
      <div className="shell text-center">
        <Reveal>
          <p className="eyebrow">Why it works</p>
        </Reveal>
        <Reveal delay={0.08}>
          <h2 className="font-display mx-auto mt-8 max-w-[20ch] text-[clamp(2.4rem,6vw,5rem)]">
            The hard part isn't you. It's doing it alone.
          </h2>
        </Reveal>
        <Reveal delay={0.16}>
          <p className="mx-auto mt-8 max-w-[48ch] text-[1.1rem] leading-relaxed text-ink/60">
            Together we find the pattern, name what's heavy, and build tools you
            can actually keep.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
