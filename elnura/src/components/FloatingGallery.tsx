import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { img } from "../lib/content";
import { SmartImage } from "./SmartImage";

// Scattered positions + parallax speeds, echoing the Spread gallery.
const items = [
  { src: 0, top: "14%", left: "4%", w: "15vw", speed: 90 },
  { src: 1, top: "34%", left: "20%", w: "10vw", speed: -60 },
  { src: 2, top: "8%", left: "82%", w: "11vw", speed: 120 },
  { src: 3, top: "44%", left: "74%", w: "12vw", speed: -40 },
  { src: 4, top: "58%", left: "2%", w: "12vw", speed: 70 },
  { src: 5, top: "66%", left: "86%", w: "10vw", speed: -80 },
];

export function FloatingGallery() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  return (
    <section ref={ref} className="relative h-[88vh] min-h-[560px] w-full">
      {/* centre hero image */}
      <div className="absolute left-1/2 top-1/2 z-10 w-[42vw] min-w-[300px] -translate-x-1/2 -translate-y-1/2">
        <SmartImage
          src={img.vision}
          alt=""
          className="aspect-[16/10] w-full rounded-2xl shadow-[0_30px_80px_rgba(26,23,20,0.18)]"
        />
      </div>

      {items.map((it, i) => (
        <Floater key={i} progress={scrollYProgress} {...it} />
      ))}
    </section>
  );
}

function Floater({
  progress,
  src,
  top,
  left,
  w,
  speed,
}: {
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
  src: number;
  top: string;
  left: string;
  w: string;
  speed: number;
}) {
  const y = useTransform(progress, [0, 1], [speed, -speed]);
  return (
    <motion.div
      style={{ y, top, left, width: w }}
      className="absolute"
    >
      <SmartImage
        src={img.gallery[src]}
        alt=""
        className="aspect-[3/4] w-full rounded-xl shadow-[0_18px_50px_rgba(26,23,20,0.14)]"
      />
    </motion.div>
  );
}
