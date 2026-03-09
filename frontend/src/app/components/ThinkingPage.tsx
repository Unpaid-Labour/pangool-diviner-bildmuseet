import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { requestDivination, requestSpeak } from "@/lib/api";

interface ThinkingPageProps {
  theme: string;
  question: string | null;
  onDone: (answer: string) => void;
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
        // Trigger TTS on Mac Mini speaker
        requestSpeak(fullText);
        // Brief pause before transitioning to answer page
        setTimeout(() => onDone(fullText), 2000);
      },
      onError: (error) => {
        console.error("Divination error:", error);
        // On error, generate a fallback answer
        const fallback =
          "The spirits stir in silence. The answer lies within you, seeker. Return when the stars align.";
        requestSpeak(fallback);
        setTimeout(() => onDone(fallback), 2000);
      },
    });

    controllerRef.current = controller;
    return () => controller.abort();
  }, [theme, question, onDone]);

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

      {/* Status info */}
      <div
        className="absolute top-6 left-6 text-2xl opacity-60"
        style={{ fontFamily: "var(--font-vt323)" }}
      >
        <div>DOMAIN: {theme.toUpperCase()}</div>
        {question && <div>QUERY: "{question.slice(0, 40)}"</div>}
      </div>

      <div
        className="absolute top-6 right-6 text-2xl opacity-60 text-right"
        style={{ fontFamily: "var(--font-vt323)" }}
      >
        ELAPSED: {elapsed}s
      </div>

      {/* Main content */}
      {/* Loading visual — shown during all phases (loading, streaming, done) */}
      <motion.div
        className="text-center px-8"
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
