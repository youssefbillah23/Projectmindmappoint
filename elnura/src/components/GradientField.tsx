import { motion } from "framer-motion";

/**
 * Subtle animated gradient accent.
 *
 * Derived from the requested ShaderGradient config:
 *   color1 #ff5005 (flame) · color2 #dbba95 (sand) · color3 #d0bce1 (lilac)
 *   soft, grainy, slow drift (uSpeed 0.4).
 *
 * Implemented as drifting radial blobs + a grain overlay so it stays light
 * and runs everywhere without a WebGL/three.js dependency.
 */
export function GradientField({ className = "" }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden grain ${className}`}
      aria-hidden
    >
      <motion.div
        className="absolute -left-[10%] top-[8%] h-[60vmax] w-[60vmax] rounded-full blur-[80px]"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, #ff5005 0%, rgba(255,80,5,0) 62%)",
          opacity: 0.45,
        }}
        animate={{ x: [0, 60, -20, 0], y: [0, 40, 80, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-[-8%] top-[24%] h-[55vmax] w-[55vmax] rounded-full blur-[80px]"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, #dbba95 0%, rgba(219,186,149,0) 62%)",
          opacity: 0.6,
        }}
        animate={{ x: [0, -50, 30, 0], y: [0, 60, 20, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute left-[28%] bottom-[-12%] h-[55vmax] w-[55vmax] rounded-full blur-[90px]"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, #d0bce1 0%, rgba(208,188,225,0) 62%)",
          opacity: 0.55,
        }}
        animate={{ x: [0, 40, -40, 0], y: [0, -30, 30, 0] }}
        transition={{ duration: 34, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
