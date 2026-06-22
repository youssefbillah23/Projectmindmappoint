import { img } from "../lib/content";
import { Reveal } from "./Reveal";
import { SmartImage } from "./SmartImage";

export function Approach() {
  return (
    <section id="approach" className="relative py-24 md:py-36">
      <div className="shell space-y-28 md:space-y-44">
        {/* Row 1 — image left, copy right */}
        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-20">
          <Reveal>
            <SmartImage
              src={img.approachA}
              alt=""
              className="aspect-[4/5] w-full rounded-2xl"
            />
          </Reveal>
          <div>
            <Reveal>
              <p className="eyebrow">The approach</p>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 className="font-display mt-5 text-[clamp(2rem,4vw,3.2rem)]">
                Therapy that meets you exactly where you are.
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-6 max-w-[44ch] text-[1.05rem] leading-relaxed text-ink/70">
                No labels, no rushing. We start by understanding your story,
                then build a plan around your pace — drawing on CBT, schema
                therapy, and compassion-focused work to find what actually helps
                you.
              </p>
            </Reveal>
          </div>
        </div>

        {/* Row 2 — copy left, panel right */}
        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-20">
          <div className="order-2 md:order-1">
            <Reveal>
              <p className="eyebrow">Every session has a shape</p>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 className="font-display mt-5 text-[clamp(2rem,4vw,3.2rem)]">
                Know what each session is for.
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-6 max-w-[44ch] text-[1.05rem] leading-relaxed text-ink/70">
                You always know where we are and where we're headed. Each
                session ends with something gentle to carry into your week.
              </p>
            </Reveal>
          </div>
          <Reveal delay={0.1} className="order-1 md:order-2">
            <SessionPanel />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function SessionPanel() {
  return (
    <div className="rounded-2xl border border-line bg-white/70 p-5 shadow-[0_24px_60px_rgba(26,23,20,0.10)] backdrop-blur">
      <div className="flex items-center gap-2 border-b border-line pb-3">
        <span className="h-2 w-2 rounded-full bg-sage" />
        <span className="text-sm font-medium text-ink/80">
          Session plan · This week
        </span>
      </div>
      <div className="mt-4 space-y-2.5">
        <Bubble>Check-in — how the week actually felt</Bubble>
        <Bubble>
          Notice one <b>recurring thought</b> and where it shows up
        </Bubble>
        <Bubble>Practise a grounding tool together</Bubble>
        <div className="flex justify-end">
          <span className="rounded-full bg-ink px-4 py-2 text-sm text-paper">
            One small step ↗
          </span>
        </div>
        <Bubble>“This week, pause before you say yes.”</Bubble>
      </div>
    </div>
  );
}

function Bubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-paper-2/80 px-4 py-3 text-[0.95rem] text-ink/85">
      {children}
    </div>
  );
}
