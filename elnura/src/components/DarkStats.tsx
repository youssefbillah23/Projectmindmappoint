import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { img, stats } from "../lib/content";
import { SmartImage } from "./SmartImage";

export function DarkStats() {
  return (
    <section className="relative w-full overflow-hidden py-28 md:py-40">
      <div className="absolute inset-0">
        <SmartImage src={img.quote} alt="" className="h-full w-full" />
        <div className="absolute inset-0 bg-ink/72" />
      </div>

      <div className="relative z-10 shell text-center">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="font-display mx-auto max-w-[16ch] text-[clamp(2.2rem,5vw,4rem)] text-white"
        >
          Stop coping alone. Start feeling better.
        </motion.h2>

        <div className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-y-10 md:grid-cols-4">
          {stats.map((s, i) => (
            <Stat key={s.label} {...s} delay={i * 0.08} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Stat({
  value,
  label,
  delay,
}: {
  value: string;
  label: string;
  delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20%" });
  const [shown, setShown] = useState(value);

  // count-up for purely numeric values
  useEffect(() => {
    if (!inView) return;
    const match = value.match(/^(\d+)(.*)$/);
    if (!match) {
      setShown(value);
      return;
    }
    const end = parseInt(match[1], 10);
    const suffix = match[2];
    const start = performance.now();
    const dur = 1100;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(end * eased) + suffix);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="font-display text-[clamp(2.4rem,5vw,3.6rem)] text-white">
        {shown}
      </div>
      <div className="mt-2 text-sm tracking-wide text-white/60">{label}</div>
    </motion.div>
  );
}
