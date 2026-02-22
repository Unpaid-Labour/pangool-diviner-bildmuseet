import { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";

interface EndPageProps {
  onRestart: () => void;
}

const NUM_PARTICLES = 50;
const NUM_RINGS = 5;
const AUTO_RESTART_MS = 15_000;

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

  // Pre-compute particle positions
  const particles = useMemo(
    () =>
      Array.from({ length: NUM_PARTICLES }, () => ({
        angle: Math.random() * 360,
        distance: 100 + Math.random() * 300,
        size: 2 + Math.random() * 4,
        duration: 2 + Math.random() * 3,
        delay: Math.random() * 2,
      })),
    []
  );

  return (
    <div className="relative size-full grid-bg scanlines overflow-hidden flex flex-col items-center justify-center">
      {/* Glitch flash */}
      <motion.div
        className="absolute inset-0 bg-white pointer-events-none z-40"
        animate={{ opacity: [0, 0, 0.8, 0, 0, 0] }}
        transition={{ duration: 4, repeat: Infinity, repeatDelay: 3 }}
      />

      {/* Concentric rings */}
      {Array.from({ length: NUM_RINGS }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-red-600/20"
          style={{
            width: 100 + i * 80,
            height: 100 + i * 80,
          }}
          animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
          transition={{
            duration: 8 + i * 4,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}

      {/* Exploding particles */}
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-red-600"
          style={{ width: p.size, height: p.size }}
          initial={{ x: 0, y: 0, opacity: 0.8 }}
          animate={{
            x: Math.cos((p.angle * Math.PI) / 180) * p.distance,
            y: Math.sin((p.angle * Math.PI) / 180) * p.distance,
            opacity: 0,
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeOut",
          }}
        />
      ))}

      {/* Main text */}
      <motion.div
        className="relative z-10 text-center"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, type: "spring" }}
      >
        <h1
          className="text-6xl mb-4"
          style={{
            fontFamily: "var(--font-orbitron)",
            fontWeight: 900,
            color: "#ff0000",
            textShadow: "var(--pangool-glow-intense)",
            letterSpacing: "0.2em",
          }}
        >
          THE ANCESTORS HAVE SPOKEN
        </h1>

        <div
          className="text-lg opacity-60 mb-2"
          style={{ fontFamily: "var(--font-vt323)" }}
        >
          THE VEIL CLOSES
        </div>

        <div
          className="text-sm opacity-40"
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
          fontSize: "1rem",
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
        className="absolute bottom-12 text-sm opacity-40"
        style={{ fontFamily: "var(--font-vt323)" }}
      >
        THE VOID RECLAIMS IN {countdown}s
      </div>

      {/* Binary string animation */}
      <div
        className="absolute bottom-6 text-xs opacity-20 tracking-widest"
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
