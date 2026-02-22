import { motion } from "motion/react";

/**
 * Fullscreen overlay shown when the backend connection is lost.
 * Polls /api/health and auto-recovers when connection returns.
 */
export function ConnectionOverlay() {
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="text-3xl mb-6"
        style={{
          fontFamily: "var(--font-vt323)",
          color: "#ff0000",
          textShadow: "0 0 10px rgba(255,0,0,0.5)",
        }}
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        the spirits have withdrawn...
      </motion.div>

      <div
        className="text-sm opacity-40"
        style={{ fontFamily: "var(--font-vt323)", color: "#ff0000" }}
      >
        AWAITING THEIR RETURN
      </div>

      {/* Animated dots */}
      <div className="flex gap-2 mt-4">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-red-600"
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
