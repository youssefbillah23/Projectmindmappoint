import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { brand, nav } from "../lib/content";

/**
 * Floating frosted pill nav. Full width with links at the top of the page,
 * collapses to a compact "brand + dark CTA" pill once you scroll — exactly
 * like the Spread reference.
 */
export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <motion.nav
        layout
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-center gap-1 rounded-full border border-white/40 bg-white/55 px-2 py-2 shadow-[0_8px_30px_rgba(26,23,20,0.08)] backdrop-blur-xl"
      >
        <a
          href="#top"
          className="px-4 py-1.5 text-[1.05rem] font-medium tracking-tight"
        >
          {brand.name}
        </a>

        {!scrolled && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            className="hidden items-center gap-1 md:flex"
          >
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-full px-4 py-1.5 text-[0.95rem] text-ink/70 transition-colors hover:text-ink"
              >
                {item.label}
              </a>
            ))}
          </motion.div>
        )}

        <a
          href="#pricing"
          className="btn btn-dark ml-1 px-5 py-2 text-[0.9rem]"
        >
          {brand.ctaShort}
        </a>
      </motion.nav>
    </div>
  );
}
