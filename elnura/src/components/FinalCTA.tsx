import { motion } from "framer-motion";
import { brand, img } from "../lib/content";
import { GradientField } from "./GradientField";
import { Reveal } from "./Reveal";
import { SmartImage } from "./SmartImage";

export function FinalCTA() {
  return (
    <section id="contact" className="relative overflow-hidden">
      {/* image strip across the top */}
      <div className="grid grid-cols-3 gap-2 px-2 md:grid-cols-5">
        {img.gallery.slice(0, 5).map((src, i) => (
          <SmartImage
            key={i}
            src={src}
            alt=""
            className={`aspect-[4/5] w-full rounded-xl ${
              i > 2 ? "hidden md:block" : ""
            }`}
          />
        ))}
      </div>

      <div className="relative">
        <GradientField className="opacity-70" />
        <div className="relative z-10 shell py-28 text-center md:py-40">
          <Reveal>
            <h2 className="font-display mx-auto max-w-[18ch] text-[clamp(2.4rem,6vw,5rem)]">
              You don't have to carry it alone. Let's begin.
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mx-auto mt-7 max-w-[42ch] text-[1.1rem] leading-relaxed text-ink/65">
              A first session is simply a conversation. No pressure, no
              commitment — just a calm place to start.
            </p>
          </Reveal>
          <Reveal delay={0.16}>
            <motion.div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <a href={brand.whatsapp} className="btn btn-dark">
                {brand.cta}
              </a>
              <a href={brand.instagram} className="btn btn-ghost">
                Message on Instagram →
              </a>
            </motion.div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
