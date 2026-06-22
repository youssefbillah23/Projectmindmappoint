import { motion } from "framer-motion";
import { plans } from "../lib/content";
import { Reveal } from "./Reveal";

export function Pricing() {
  return (
    <section id="pricing" className="relative py-24 md:py-36">
      <div className="shell">
        <div className="grid gap-6 md:grid-cols-2 md:items-end">
          <div>
            <Reveal>
              <p className="eyebrow">Pricing</p>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 className="font-display mt-4 text-[clamp(2rem,4.4vw,3.4rem)]">
                Care that fits your life.
              </h2>
            </Reveal>
          </div>
          <Reveal delay={0.1}>
            <p className="max-w-[44ch] text-[1.05rem] leading-relaxed text-ink/60 md:pb-2">
              Every plan includes the same warm, confidential space. Start small
              or go steady — you can change anytime.
            </p>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-5 md:grid-cols-3">
          {plans.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{
                duration: 0.8,
                delay: i * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
              className={[
                "flex flex-col rounded-3xl p-8",
                p.featured
                  ? "bg-ink text-paper shadow-[0_40px_90px_rgba(26,23,20,0.28)] md:-translate-y-4"
                  : "border border-line bg-paper-2/50",
              ].join(" ")}
            >
              <p
                className={`text-xs uppercase tracking-[0.2em] ${
                  p.featured ? "text-white/55" : "text-ink/45"
                }`}
              >
                {p.eyebrow}
              </p>
              <h3 className="font-display mt-4 text-3xl">{p.name}</h3>
              <p
                className={`mt-2 text-sm ${
                  p.featured ? "text-white/60" : "text-ink/55"
                }`}
              >
                {p.blurb}
              </p>

              <div className="mt-8 flex items-end gap-1">
                <span className="font-display text-5xl">{p.price}</span>
                <span
                  className={`mb-1.5 text-sm ${
                    p.featured ? "text-white/55" : "text-ink/50"
                  }`}
                >
                  {p.cadence}
                </span>
              </div>
              <p
                className={`mt-1 text-sm ${
                  p.featured ? "text-white/50" : "text-ink/45"
                }`}
              >
                {p.sub}
              </p>

              <div
                className={`mt-7 h-px ${
                  p.featured ? "bg-white/15" : "bg-line"
                }`}
              />

              <ul className="mt-7 space-y-3.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-[0.97rem]">
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                        p.featured ? "border-white/35" : "border-ink/25"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          p.featured ? "bg-white/70" : "bg-sage"
                        }`}
                      />
                    </span>
                    <span className={p.featured ? "text-white/85" : "text-ink/80"}>
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              <a
                href="#contact"
                className={`btn mt-9 w-full ${
                  p.featured ? "btn-light" : "btn-dark"
                }`}
              >
                {p.cta}
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
