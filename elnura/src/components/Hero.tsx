import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { brand, img } from "../lib/content";
import { SmartImage } from "./SmartImage";

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  // gentle parallax + fade as you scroll past the hero
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "-14%"]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section
      id="top"
      ref={ref}
      className="relative h-[100svh] min-h-[640px] w-full overflow-hidden"
    >
      <motion.div style={{ y: imgY }} className="absolute inset-0 scale-110">
        <SmartImage src={img.hero} alt="" className="h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/45 via-ink/20 to-ink/55" />
      </motion.div>

      <motion.div
        style={{ y: textY, opacity: fade }}
        className="relative z-10 flex h-full items-end"
      >
        <div className="shell pb-[8vh]">
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            className="font-display max-w-[12ch] text-[clamp(2.8rem,8vw,6.6rem)] text-white"
          >
            Space to breathe. Room to heal.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
            className="mt-6 max-w-[42ch] text-[1.05rem] leading-relaxed text-white/80"
          >
            Warm, evidence-based therapy with {brand.name}. Online sessions for
            anxiety, relationships, self-esteem and burnout — at your pace, in
            your language.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.55 }}
            className="mt-9 flex items-center gap-4"
          >
            <a href="#pricing" className="btn btn-light">
              {brand.cta}
            </a>
            <a href="#approach" className="btn btn-ghost text-white">
              How it works →
            </a>
          </motion.div>
        </div>
      </motion.div>

      <RotatingBadge />
    </section>
  );
}

function RotatingBadge() {
  const text = "• A CALMER MIND • ONE STEP AT A TIME ";
  return (
    <div className="absolute bottom-10 right-8 z-10 hidden h-28 w-28 items-center justify-center md:flex">
      <motion.svg
        viewBox="0 0 100 100"
        className="absolute h-full w-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
      >
        <defs>
          <path
            id="circlePath"
            d="M50,50 m-37,0 a37,37 0 1,1 74,0 a37,37 0 1,1 -74,0"
          />
        </defs>
        <text className="fill-white/80 text-[8.5px] tracking-[0.18em]">
          <textPath href="#circlePath">{text + text}</textPath>
        </text>
      </motion.svg>
      <span className="text-white/90 text-lg">↗</span>
    </div>
  );
}
