import { useState, useEffect } from "react";
import { motion } from "motion/react";

interface AnswerPageProps {
  answer: string;
  onDone: () => void;
}

const CHAR_DELAY_MS = 50;
const AUTO_ADVANCE_MS = 20_000; // 20s after fully typed

export function AnswerPage({ answer, onDone }: AnswerPageProps) {
  const [displayed, setDisplayed] = useState("");
  const [typingDone, setTypingDone] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Typewriter effect
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < answer.length) {
        setDisplayed(answer.slice(0, index + 1));
        index++;
      } else {
        setTypingDone(true);
        clearInterval(interval);
      }
    }, CHAR_DELAY_MS);
    return () => clearInterval(interval);
  }, [answer]);

  // Auto-advance countdown after typing completes
  useEffect(() => {
    if (!typingDone) return;

    const totalSeconds = AUTO_ADVANCE_MS / 1000;
    setCountdown(totalSeconds);

    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          onDone();
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [typingDone, onDone]);

  return (
    <div
      className="relative size-full grid-bg scanlines overflow-hidden flex flex-col items-center justify-center p-12 cursor-pointer"
      onClick={typingDone ? onDone : undefined}
    >
      {/* Background glow */}
      <div
        className="pulse-glow absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at center, rgba(255,0,0,0.15) 0%, transparent 70%)",
        }}
      />

      {/* Corner decorations */}
      <div
        className="absolute top-6 left-6 text-xs opacity-40"
        style={{ fontFamily: "var(--font-vt323)" }}
      >
        THE SPIRITS SPEAK
      </div>

      {/* Divination text */}
      <motion.div
        className="max-w-2xl text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div
          className="text-5xl leading-relaxed"
          style={{
            fontFamily: "var(--font-vt323)",
            textShadow: "var(--pangool-text-glow)",
          }}
        >
          {displayed}
          {!typingDone && <span className="cursor-blink">_</span>}
        </div>
      </motion.div>

      {/* Footer status */}
      {typingDone && (
        <motion.div
          className="absolute bottom-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 1 }}
        >
          <div
            className="text-sm"
            style={{ fontFamily: "var(--font-vt323)" }}
          >
            The veil closes in {countdown}s
          </div>
          <div
            className="text-xs mt-1 opacity-60"
            style={{ fontFamily: "var(--font-vt323)" }}
          >
            TAP TO RELEASE THE SPIRIT
          </div>
        </motion.div>
      )}
    </div>
  );
}
