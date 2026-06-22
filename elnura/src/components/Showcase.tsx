import { Reveal } from "./Reveal";

export function Showcase() {
  return (
    <section id="sessions" className="relative py-24 md:py-36">
      <div className="shell text-center">
        <Reveal>
          <p className="eyebrow">What changes</p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="font-display mx-auto mt-5 max-w-[18ch] text-[clamp(1.9rem,3.6vw,2.9rem)]">
            This is what a few weeks of support can look like.
          </h2>
        </Reveal>

        <Reveal delay={0.12}>
          <div className="mx-auto mt-16 max-w-3xl">
            {/* stacked-paper effect */}
            <div className="relative">
              <div className="absolute -top-3 left-4 right-4 h-full rounded-2xl bg-paper-2/70" />
              <div className="absolute -top-1.5 left-2 right-2 h-full rounded-2xl bg-paper-2" />
              <div className="relative rounded-2xl border border-line bg-white p-7 text-left shadow-[0_30px_70px_rgba(26,23,20,0.10)]">
                <div className="flex items-center justify-between border-b border-line pb-4">
                  <span className="text-sm text-ink/55">
                    Progress · Week 6
                  </span>
                  <span className="flex items-center gap-2 text-sm text-ink/55">
                    <span className="h-2 w-2 rounded-full bg-sage" />
                    Feeling: steadier
                  </span>
                </div>

                <div className="grid gap-8 py-7 md:grid-cols-2">
                  <Col label="Where you started">
                    <Line title="Anxious most mornings" sub="Hard to focus" />
                    <Big value="7 / 10" tone="muted" caption="stress level" />
                  </Col>
                  <Col label="Where you are now" align="right">
                    <Line
                      title="Calmer, more present"
                      sub="Tools that work"
                      align="right"
                    />
                    <Big value="3 / 10" tone="sage" caption="stress level" align="right" />
                  </Col>
                </div>

                <div className="flex items-center justify-between border-t border-line pt-5">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-ink/45">
                      Sleep
                    </p>
                    <p className="text-ink/80">5h → 7h</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-wider text-ink/45">
                      Self-kindness
                    </p>
                    <p className="font-display text-2xl text-sage">+ a lot</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Col({
  label,
  children,
  align = "left",
}: {
  label: string;
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <div className={align === "right" ? "text-right" : ""}>
      <p className="text-xs uppercase tracking-[0.18em] text-ink/45">{label}</p>
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  );
}

function Line({
  title,
  sub,
  align = "left",
}: {
  title: string;
  sub: string;
  align?: "left" | "right";
}) {
  return (
    <div className={align === "right" ? "text-right" : ""}>
      <p className="text-lg text-ink">{title}</p>
      <p className="text-sm text-ink/55">{sub}</p>
    </div>
  );
}

function Big({
  value,
  caption,
  tone,
  align = "left",
}: {
  value: string;
  caption: string;
  tone: "muted" | "sage";
  align?: "left" | "right";
}) {
  return (
    <div className={align === "right" ? "text-right" : ""}>
      <div
        className={`font-display text-[2.4rem] ${
          tone === "sage" ? "text-sage" : "text-ink/70"
        }`}
      >
        {value}
      </div>
      <div className="text-xs uppercase tracking-wider text-ink/45">
        {caption}
      </div>
    </div>
  );
}
