import { motion } from "framer-motion";
import { focusAreas } from "../lib/content";
import { Reveal } from "./Reveal";

export function Focus() {
  return (
    <section id="focus" className="relative py-24 md:py-32">
      <div className="shell text-center">
        <Reveal>
          <h2 className="font-display text-[clamp(2rem,4.4vw,3.4rem)]">
            Bring whatever's on your mind.
          </h2>
        </Reveal>
        <Reveal delay={0.06}>
          <p className="mx-auto mt-5 max-w-[46ch] text-[1.05rem] leading-relaxed text-ink/60">
            These are areas we work with often. You don't need the right words —
            we'll find them together.
          </p>
        </Reveal>

        <div className="mx-auto mt-14 flex max-w-3xl flex-wrap justify-center gap-3">
          {focusAreas.map((f, i) => (
            <motion.button
              key={f.label}
              type="button"
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.6,
                delay: i * 0.04,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="chip"
            >
              <span>{f.label}</span>
              <span className="text-sm text-ink/45">{f.note}</span>
            </motion.button>
          ))}
        </div>

        <Reveal delay={0.1}>
          <p className="eyebrow mt-14">Or just tell me in your words</p>
        </Reveal>
        <Reveal delay={0.14}>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="mx-auto mt-5 flex max-w-xl items-center gap-2 rounded-full border border-line bg-white/70 p-2 pl-6 shadow-[0_10px_30px_rgba(26,23,20,0.06)] backdrop-blur"
          >
            <input
              type="text"
              placeholder="What's been weighing on you lately…"
              className="w-full bg-transparent py-2 text-[1rem] text-ink outline-none placeholder:text-ink/40"
            />
            <button
              type="submit"
              aria-label="Send"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-paper transition-transform hover:scale-105"
            >
              →
            </button>
          </form>
        </Reveal>
      </div>
    </section>
  );
}
