import { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";

interface EndPageProps {
  onRestart: () => void;
}

const NUM_PARTICLES = 50;
const AUTO_RESTART_MS = 7_000;

export function EndPage({ onRestart }: EndPageProps) {
  const [countdown, setCountdown] = useState(AUTO_RESTART_MS / 1000);
  const [binaryStr, setBinaryStr] = useState(randomBinary());

  // Auto-restart countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          onRestart();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onRestart]);

  // Random binary animation
  useEffect(() => {
    const interval = setInterval(() => setBinaryStr(randomBinary()), 200);
    return () => clearInterval(interval);
  }, []);

  // Particles that drift INWARD toward center (reversed direction)
  const particles = useMemo(
    () =>
      Array.from({ length: NUM_PARTICLES }, () => {
        const angle = Math.random() * 360;
        const distance = 150 + Math.random() * 350;
        return {
          // Start far away
          startX: Math.cos((angle * Math.PI) / 180) * distance,
          startY: Math.sin((angle * Math.PI) / 180) * distance,
          size: 1.5 + Math.random() * 3.5,
          duration: 2.5 + Math.random() * 3,
          delay: Math.random() * 2,
        };
      }),
    []
  );

  return (
    <div className="relative size-full grid-bg scanlines overflow-hidden flex flex-col items-center justify-center">
      {/* Edge distortion — pulsing vignette */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-30"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.6) 70%, rgba(0,0,0,0.95) 100%)",
        }}
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Particles drifting inward */}
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-red-600"
          style={{ width: p.size, height: p.size }}
          initial={{ x: p.startX, y: p.startY, opacity: 0.7 }}
          animate={{
            x: (Math.random() - 0.5) * 10, // converge near center
            y: (Math.random() - 0.5) * 40,
            opacity: 0,
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeIn",
          }}
        />
      ))}

      {/* Main text */}
      <motion.div
        className="relative z-10 text-center px-8"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, type: "spring" }}
      >
        <h1
          className="text-5xl mb-4"
          style={{
            fontFamily: "var(--font-orbitron)",
            fontWeight: 900,
            color: "#ff0000",
            textShadow: "var(--pangool-glow-intense)",
            letterSpacing: "0.12em",
          }}
        >
          THE VEIL CLOSES
        </h1>

        <div
          className="text-2xl opacity-40"
          style={{ fontFamily: "var(--font-vt323)" }}
        >
          SILENCE DESCENDS
        </div>
      </motion.div>

      {/* Restart button */}
      <motion.button
        className="relative z-10 mt-12 px-10 py-4 border border-red-600/50 bg-black cursor-pointer"
        style={{
          fontFamily: "var(--font-orbitron)",
          fontSize: "2.5rem",
          fontWeight: 700,
          color: "#ff0000",
          textTransform: "uppercase",
          letterSpacing: "0.15em",
          textShadow: "0 0 8px rgba(255,0,0,0.5)",
        }}
        onClick={onRestart}
        whileHover={{
          scale: 1.05,
          rotate: [0, -1, 1, 0],
          boxShadow: "0 0 30px rgba(255,0,0,0.4)",
        }}
        whileTap={{ scale: 0.95 }}
      >
        SEEK AGAIN
      </motion.button>

      {/* Auto-restart countdown */}
      <div
        className="absolute bottom-14 text-2xl opacity-40"
        style={{ fontFamily: "var(--font-vt323)" }}
      >
        THE VOID RECLAIMS IN {countdown}s
      </div>

      {/* Binary string animation */}
      <div
        className="absolute bottom-8 text-xs opacity-20 tracking-widest"
        style={{ fontFamily: "var(--font-vt323)" }}
      >
        {binaryStr}
      </div>
    </div>
  );
}

function randomBinary(): string {
  return Array.from({ length: 32 }, () => (Math.random() > 0.5 ? "1" : "0")).join("");
}
