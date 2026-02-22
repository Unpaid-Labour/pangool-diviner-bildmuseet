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
  const [phase, setPhase] = useState<"loading" | "streaming" | "done">(
    "loading"
  );
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
        setPhase("streaming");
      },
      onDone: (fullText) => {
        setPhase("done");
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
        className="absolute top-6 left-6 text-xs opacity-50"
        style={{ fontFamily: "var(--font-vt323)" }}
      >
        <div>DOMAIN: {theme.toUpperCase()}</div>
        {question && <div>QUERY: "{question.slice(0, 40)}"</div>}
      </div>

      <div
        className="absolute top-6 right-6 text-xs opacity-50 text-right"
        style={{ fontFamily: "var(--font-vt323)" }}
      >
        ELAPSED: {elapsed}s
      </div>

      {/* Main content */}
      {/* Loading visual — shown during all phases (loading, streaming, done) */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className={`${phase === "done" ? "text-4xl" : "text-3xl"} mb-6`}
          style={{
            fontFamily: "var(--font-vt323)",
            textShadow: "var(--pangool-text-glow)",
          }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {phase === "done"
            ? "THE ANCESTORS HAVE SPOKEN"
            : `The spirits stir beyond the veil ... ${elapsed}s`}
        </motion.div>

        {/* Loading bars */}
        <div className="flex gap-2 justify-center">
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={i}
              className="w-3 bg-red-600/60 rounded-sm"
              animate={{
                height: [4, 20 + Math.random() * 20, 4],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: 0.8 + Math.random() * 0.4,
                repeat: Infinity,
                delay: i * 0.15,
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
