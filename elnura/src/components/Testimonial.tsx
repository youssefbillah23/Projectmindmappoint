import { motion } from "framer-motion";
import { img, testimonials } from "../lib/content";
import { SmartImage } from "./SmartImage";

export function Testimonial() {
  const t = testimonials[0];
  return (
    <section className="relative w-full overflow-hidden py-32 md:py-44">
      <div className="absolute inset-0">
        <SmartImage src={img.sleep} alt="" className="h-full w-full" />
        <div className="absolute inset-0 bg-ink/70" />
      </div>
      <div className="relative z-10 shell text-center">
        <div className="font-display text-6xl text-white/30">“</div>
        <motion.blockquote
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-[24ch] text-[clamp(1.6rem,3.4vw,2.6rem)] font-medium leading-snug text-white"
        >
          {t.quote}
        </motion.blockquote>
        <p className="mt-8 text-sm uppercase tracking-[0.2em] text-white/55">
          {t.name}
        </p>
      </div>
    </section>
  );
}
