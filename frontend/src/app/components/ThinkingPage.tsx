import { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "motion/react";
import { requestDivination, requestSpeak } from "@/lib/api";

interface ThinkingPageProps {
  theme: string;
  question: string | null;
  onDone: (answer: string) => void;
}

const NUM_TENDRILS = 12;
const NUM_SPORES = 20;
const NUM_RINGS = 4;

/** Generate an organic SVG path from center outward using quadratic bezier segments */
function generateTendrilPath(
  angle: number,
  length: number,
  segments: number
): string {
  const segLen = length / segments;
  let x = 0;
  let y = 0;
  let d = `M ${x} ${y}`;
  const rad = (angle * Math.PI) / 180;

  for (let i = 0; i < segments; i++) {
    // Direction with increasing jitter as we move outward
    const jitter = (Math.random() - 0.5) * 40 * ((i + 1) / segments);
    const cx = x + Math.cos(rad + jitter * 0.02) * segLen * 0.6 + (Math.random() - 0.5) * 30;
    const cy = y + Math.sin(rad + jitter * 0.02) * segLen * 0.6 + (Math.random() - 0.5) * 30;
    x += Math.cos(rad) * segLen + jitter;
    y += Math.sin(rad) * segLen + jitter;
    d += ` Q ${cx} ${cy} ${x} ${y}`;
  }
  return d;
}

export function ThinkingPage({ theme, question, onDone }: ThinkingPageProps) {
  const [elapsed, setElapsed] = useState(0);
  const controllerRef = useRef<AbortController | null>(null);

  // Elapsed timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Start divination request
  useEffect(() => {
    const controller = requestDivination(theme, question, {
      onToken: () => {
      },
      onDone: (fullText) => {
        requestSpeak(fullText);
        setTimeout(() => onDone(fullText), 2000);
      },
      onError: (error) => {
        console.error("Divination error:", error);
        const fallback =
          "The spirits stir in silence. The answer lies within you, seeker. Return when the stars align.";
        requestSpeak(fallback);
        setTimeout(() => onDone(fallback), 2000);
      },
    });

    controllerRef.current = controller;
    return () => controller.abort();
  }, [theme, question, onDone]);

  // Pre-compute tendrils
  const tendrils = useMemo(
    () =>
      Array.from({ length: NUM_TENDRILS }, () => {
        const angle = Math.random() * 360;
        const length = 150 + Math.random() * 200;
        const segments = 4 + Math.floor(Math.random() * 3);
        return {
          d: generateTendrilPath(angle, length, segments),
          strokeWidth: 1 + Math.random() * 2,
          opacity: 0.3 + Math.random() * 0.5,
          delay: Math.random() * 2,
          duration: 2 + Math.random() * 1.5,
        };
      }),
    []
  );

  // Pre-compute spore particles
  const spores = useMemo(
    () =>
      Array.from({ length: NUM_SPORES }, () => ({
        angle: Math.random() * 360,
        distance: 200 + Math.random() * 250,
        size: 2 + Math.random() * 2,
        duration: 8 + Math.random() * 4,
        delay: Math.random() * 6,
      })),
    []
  );

  return (
    <div className="relative size-full grid-bg scanlines overflow-hidden flex flex-col items-center justify-center p-12">
      {/* Background glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ opacity: [0.1, 0.3, 0.1] }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{
          background:
            "radial-gradient(circle at center, rgba(255,0,0,0.2) 0%, transparent 60%)",
        }}
      />

      {/* ─── Fractal Nerve Web SVG ─── */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="-400 -400 800 800"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Glow filter for tendrils */}
          <filter id="nerve-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Layer 2 — Concentric Ritual Rings */}
        {Array.from({ length: NUM_RINGS }).map((_, i) => (
          <motion.circle
            key={`ring-${i}`}
            cx={0}
            cy={0}
            r={80 + i * 70}
            fill="none"
            stroke="#ff0000"
            strokeWidth={0.5}
            strokeDasharray="8 12"
            opacity={0.15 + i * 0.03}
            animate={{
              rotate: i % 2 === 0 ? 360 : -360,
              scale: [0.98, 1.02, 0.98],
            }}
            transition={{
              rotate: {
                duration: 20 + i * 8,
                repeat: Infinity,
                ease: "linear",
              },
              scale: {
                duration: 3 + i * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
              },
            }}
            style={{ transformOrigin: "0 0" }}
          />
        ))}

        {/* Layer 1 — Branching Nerve Tendrils */}
        {tendrils.map((t, i) => (
          <motion.path
            key={`tendril-${i}`}
            d={t.d}
            fill="none"
            stroke="#ff0000"
            strokeWidth={t.strokeWidth}
            strokeLinecap="round"
            filter="url(#nerve-glow)"
            pathLength={1}
            initial={{
              strokeDasharray: "1 1",
              strokeDashoffset: 1,
              opacity: 0,
            }}
            animate={{
              strokeDashoffset: 0,
              opacity: [0, t.opacity, t.opacity * 0.6, t.opacity, t.opacity * 0.6],
            }}
            transition={{
              strokeDashoffset: {
                duration: t.duration,
                delay: t.delay,
                ease: "easeOut",
              },
              opacity: {
                duration: 3,
                delay: t.delay + t.duration,
                repeat: Infinity,
                ease: "easeInOut",
              },
            }}
          />
        ))}

        {/* Layer 3 — Drifting Spore Particles */}
        {spores.map((s, i) => {
          const rad = (s.angle * Math.PI) / 180;
          return (
            <motion.circle
              key={`spore-${i}`}
              cx={0}
              cy={0}
              r={s.size}
              fill="#ff0000"
              initial={{ opacity: 0 }}
              animate={{
                cx: [0, Math.cos(rad) * s.distance],
                cy: [0, Math.sin(rad) * s.distance],
                opacity: [0, 0.6, 0.6, 0],
              }}
              transition={{
                duration: s.duration,
                delay: s.delay,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          );
        })}

      </svg>

      {/* Status info */}
      <div
        className="absolute top-6 left-6 text-2xl opacity-60 z-10"
        style={{ fontFamily: "var(--font-vt323)" }}
      >
        <div>DOMAIN: {theme.toUpperCase()}</div>
        {question && <div>QUERY: "{question.slice(0, 40)}"</div>}
      </div>

      <div
        className="absolute top-6 right-6 text-2xl opacity-60 text-right z-10"
        style={{ fontFamily: "var(--font-vt323)" }}
      >
        ELAPSED: {elapsed}s
      </div>

      {/* Main text — on top of everything */}
      <motion.div
        className="relative z-10 text-center px-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="text-7xl mb-6"
          style={{
            fontFamily: "var(--font-vt323)",
            textShadow: "var(--pangool-text-glow)",
          }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          The spirits stir beyond the veil ...
        </motion.div>
      </motion.div>
    </div>
  );
}
