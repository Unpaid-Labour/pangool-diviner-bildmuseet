import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";

// Sand-microscope-inspired glyphs — \uFE0E forces monochrome text on iPad Safari
const ICONS: { glyph: string; theme: string }[] = [
  { glyph: "\u25CE\uFE0E", theme: "work" },     // ◎ foram concentric rings
  { glyph: "\u2B21\uFE0E", theme: "work" },     // ⬡ crystal lattice hexagon
  { glyph: "\u273A\uFE0E", theme: "work" },     // ✺ sea urchin radial spines
  { glyph: "\u263D\uFE0E", theme: "love" },     // ☽ shell curve, crescent
  { glyph: "\u2766\uFE0E", theme: "love" },     // ❦ organic heart / floral
  { glyph: "\u26AF\uFE0E", theme: "love" },     // ⚯ paired bond
  { glyph: "\u274A\uFE0E", theme: "health" },   // ❊ radial crystal snowflake
  { glyph: "\u273F\uFE0E", theme: "health" },   // ✿ sand dollar flower
  { glyph: "\u2638\uFE0E", theme: "fortune" },  // ☸ wheel / radial structure
  { glyph: "\u2726\uFE0E", theme: "fortune" },  // ✦ crystal star point
  { glyph: "\u25C8\uFE0E", theme: "fortune" },  // ◈ faceted gem cross-section
  { glyph: "\u224B\uFE0E", theme: "growth" },   // ≋ layered banded agate
  { glyph: "\u2740\uFE0E", theme: "growth" },   // ❀ rosette bloom
  { glyph: "\u262F\uFE0E", theme: "being" },    // ☯ organic duality
  { glyph: "\u25C9\uFE0E", theme: "being" },    // ◉ single-cell / eye
];

const TICK_COUNT = 20;

type Phase = "idle" | "spinning" | "settled" | "transitioning";

interface HomePageProps {
  onStart: (theme: string) => void;
}

/** Fisher-Yates shuffle (returns new array) */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function HomePage({ onStart }: HomePageProps) {
  const [time, setTime] = useState(formatTime());
  const [phase, setPhase] = useState<Phase>("idle");
  const [displayedGlyph, setDisplayedGlyph] = useState("");
  const chosenRef = useRef<{ glyph: string; theme: string } | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Clock
  useEffect(() => {
    const interval = setInterval(() => setTime(formatTime()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, []);

  // Spinning: recursive setTimeout with quadratic deceleration
  useEffect(() => {
    if (phase !== "spinning") return;

    const shuffled = shuffle(ICONS);
    const targetIdx = Math.floor(Math.random() * shuffled.length);
    const target = shuffled[targetIdx];
    chosenRef.current = target;

    // Build tick sequence: cycle through shuffled, land on target last
    const sequence: { glyph: string; theme: string }[] = [];
    for (let i = 0; i < TICK_COUNT - 1; i++) {
      sequence.push(shuffled[i % shuffled.length]);
    }
    sequence.push(target); // final tick is always the target

    let tick = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];

    function step() {
      setDisplayedGlyph(sequence[tick].glyph);
      tick++;
      if (tick < TICK_COUNT) {
        // Quadratic easing: 50ms → ~400ms
        const t = tick / (TICK_COUNT - 1);
        const interval = 50 + 350 * t * t;
        const timer = setTimeout(step, interval);
        timers.push(timer);
      } else {
        // Done spinning
        setPhase("settled");
      }
    }

    step();
    timersRef.current = timers;

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [phase]);

  // Settled → transitioning after 1s
  useEffect(() => {
    if (phase !== "settled") return;
    const timer = setTimeout(() => setPhase("transitioning"), 1000);
    return () => clearTimeout(timer);
  }, [phase]);

  // Transitioning → call onStart after 1s
  useEffect(() => {
    if (phase !== "transitioning") return;
    const timer = setTimeout(() => {
      if (chosenRef.current) {
        onStart(chosenRef.current.theme);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [phase, onStart]);

  const handleTap = useCallback(() => {
    if (phase !== "idle") return;
    setPhase("spinning");
  }, [phase]);

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
      <div className="absolute top-6 left-6 text-2xl opacity-60" style={{ fontFamily: "var(--font-vt323)" }}>
        <div>SYS.PANGOOL v2.1</div>
        <div>STATUS: ACTIVE</div>
      </div>

      <div className="absolute top-6 right-6 text-2xl opacity-60 text-right" style={{ fontFamily: "var(--font-vt323)" }}>
        <div>{time}</div>
        <div>SIGNAL: STRONG</div>
      </div>

      <div className="absolute bottom-6 left-6 text-2xl opacity-40" style={{ fontFamily: "var(--font-vt323)" }}>
        TRANSMISSION READY
      </div>

      <div className="absolute bottom-6 right-6 text-2xl opacity-40" style={{ fontFamily: "var(--font-vt323)" }}>
        ORACLE AWAITS
      </div>

      {/* Main content — centered */}
      <div className="flex items-center justify-center size-full">
        <AnimatePresence mode="wait">
          {/* "Reach for your fate" button — only during idle */}
          {phase === "idle" && (
            <motion.button
              key="fate-button"
              onClick={handleTap}
              className="relative mx-[70px] px-16 py-12 border-4 border-red-600 bg-black cursor-pointer text-center"
              style={{
                fontFamily: "var(--font-orbitron)",
                fontSize: "3.7rem",
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
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.5 } }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="block">Reach</span>
              <span className="block">for your fate</span>
            </motion.button>
          )}

          {/* Spinning glyph — center screen slot machine */}
          {phase === "spinning" && (
            <motion.div
              key="spinning-glyph"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                fontSize: "22rem",
                color: "#ff0000",
                fontFamily: "serif",
                textShadow: "0 0 20px rgba(255,0,0,0.6), 0 0 40px rgba(255,0,0,0.3)",
                lineHeight: 1,
              }}
            >
              {displayedGlyph}
            </motion.div>
          )}

          {/* Settled glyph — glow intensifies */}
          {phase === "settled" && (
            <motion.div
              key="settled-glyph"
              initial={{ scale: 1 }}
              animate={{
                scale: [1, 1.15, 1.1],
                textShadow: [
                  "0 0 30px rgba(255,0,0,0.8), 0 0 60px rgba(255,0,0,0.5)",
                  "0 0 60px rgba(255,0,0,1), 0 0 100px rgba(255,0,0,0.8), 0 0 140px rgba(255,0,0,0.4)",
                  "0 0 40px rgba(255,0,0,0.9), 0 0 80px rgba(255,0,0,0.6)",
                ],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{
                fontSize: "16rem",
                color: "#ff0000",
                fontFamily: "serif",
                textShadow: "0 0 30px rgba(255,0,0,0.8), 0 0 60px rgba(255,0,0,0.5)",
                lineHeight: 1,
              }}
            >
              {displayedGlyph}
            </motion.div>
          )}

          {/* Transitioning — pulse outward then fade */}
          {phase === "transitioning" && (
            <motion.div
              key="transitioning-glyph"
              initial={{
                scale: 1.1,
                opacity: 1,
              }}
              animate={{
                scale: [1.1, 1.3, 0.8],
                opacity: [1, 0.8, 0],
                textShadow: [
                  "0 0 40px rgba(255,0,0,0.9), 0 0 80px rgba(255,0,0,0.6)",
                  "0 0 70px rgba(255,0,0,1), 0 0 120px rgba(255,0,0,0.8)",
                  "0 0 0px rgba(255,0,0,0)",
                ],
              }}
              transition={{ duration: 1, ease: "easeInOut" }}
              style={{
                fontSize: "16rem",
                color: "#ff0000",
                fontFamily: "serif",
                lineHeight: 1,
              }}
            >
              {displayedGlyph}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function formatTime(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(now.getMonth() + 1)}.${pad(now.getDate())}.${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}
