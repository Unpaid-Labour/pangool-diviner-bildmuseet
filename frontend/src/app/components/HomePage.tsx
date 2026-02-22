import { useState, useEffect } from "react";
import { motion } from "motion/react";

interface HomePageProps {
  onStart: () => void;
}

export function HomePage({ onStart }: HomePageProps) {
  const [time, setTime] = useState(formatTime());

  useEffect(() => {
    const interval = setInterval(() => setTime(formatTime()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative size-full grid-bg scanlines overflow-hidden">
      {/* Background glow */}
      <div
        className="pulse-glow absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at center, rgba(255,0,0,0.15) 0%, transparent 70%)",
        }}
      />

      {/* Corner decorations */}
      <div className="absolute top-6 left-6 text-xs opacity-60" style={{ fontFamily: "var(--font-vt323)" }}>
        <div>SYS.PANGOOL v2.1</div>
        <div>STATUS: ACTIVE</div>
      </div>

      <div className="absolute top-6 right-6 text-xs opacity-60 text-right" style={{ fontFamily: "var(--font-vt323)" }}>
        <div>{time}</div>
        <div>SIGNAL: STRONG</div>
      </div>

      <div className="absolute bottom-6 left-6 text-xs opacity-40" style={{ fontFamily: "var(--font-vt323)" }}>
        TRANSMISSION READY
      </div>

      <div className="absolute bottom-6 right-6 text-xs opacity-40" style={{ fontFamily: "var(--font-vt323)" }}>
        ORACLE AWAITS
      </div>

      {/* Main content */}
      <div className="flex items-center justify-center size-full">
        <motion.button
          onClick={onStart}
          className="relative px-20 py-10 border-2 border-red-600 bg-black cursor-pointer"
          style={{
            fontFamily: "var(--font-orbitron)",
            fontSize: "1.8rem",
            fontWeight: 700,
            color: "#ff0000",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            textShadow: "var(--pangool-text-glow)",
          }}
          animate={{
            boxShadow: [
              "0 0 20px rgba(255,0,0,0.3), inset 0 0 20px rgba(255,0,0,0.1)",
              "0 0 40px rgba(255,0,0,0.6), inset 0 0 40px rgba(255,0,0,0.2)",
              "0 0 20px rgba(255,0,0,0.3), inset 0 0 20px rgba(255,0,0,0.1)",
            ],
            opacity: [1, 0.85, 1, 1, 0.9, 1],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
        >
          Ask the Pangool
        </motion.button>
      </div>
    </div>
  );
}

function formatTime(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(now.getMonth() + 1)}.${pad(now.getDate())}.${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}
