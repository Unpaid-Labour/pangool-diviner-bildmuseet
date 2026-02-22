import { motion } from "motion/react";

const THEMES = ["work", "love", "health", "fortune", "growth", "being"] as const;

interface ThemeSelectionPageProps {
  onSelect: (theme: string) => void;
}

export function ThemeSelectionPage({ onSelect }: ThemeSelectionPageProps) {
  return (
    <div className="relative size-full grid-bg scanlines overflow-hidden flex flex-col items-center justify-center">
      {/* Background glow */}
      <div
        className="pulse-glow absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at center, rgba(255,0,0,0.1) 0%, transparent 70%)",
        }}
      />

      {/* Title */}
      <motion.div
        className="mb-16 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2
          className="text-4xl tracking-widest uppercase opacity-80"
          style={{ fontFamily: "var(--font-vt323)" }}
        >
          Choose your domain
        </h2>
      </motion.div>

      {/* Theme grid */}
      <div className="grid grid-cols-2 gap-8 max-w-2xl px-12">
        {THEMES.map((theme, i) => (
          <motion.button
            key={theme}
            onClick={() => onSelect(theme)}
            className="relative px-12 py-9 border border-red-600/60 bg-black cursor-pointer"
            style={{
              fontFamily: "var(--font-vt323)",
              fontSize: "2.25rem",
              color: "#ff0000",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              textShadow: "0 0 8px rgba(255,0,0,0.5)",
              boxShadow:
                "0 0 10px rgba(255,0,0,0.2), inset 0 0 10px rgba(255,0,0,0.1)",
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1, duration: 0.3 }}
            whileHover={{
              scale: 1.08,
              boxShadow:
                "0 0 30px rgba(255,0,0,0.5), inset 0 0 20px rgba(255,0,0,0.2)",
              backgroundColor: "rgba(255,0,0,0.08)",
            }}
            whileTap={{ scale: 0.95 }}
          >
            {theme}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
