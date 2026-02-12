import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "motion/react";
import { MicRecorder } from "@/lib/audio";
import { requestTranscribe } from "@/lib/api";

interface ListeningPageProps {
  theme: string;
  onDone: (speech: string | null) => void;
}

const LISTEN_TIMEOUT_MS = 15_000; // Auto-skip after 15s
const MIC_ENABLED = true; // Set false to always skip voice input

export function ListeningPage({ theme, onDone }: ListeningPageProps) {
  const [detectedText, setDetectedText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const recorderRef = useRef<MicRecorder | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const stopAndTranscribe = useCallback(async () => {
    if (recorderRef.current?.isRecording) {
      const blob = await recorderRef.current.stop();
      setIsRecording(false);

      if (blob.size > 0) {
        setDetectedText("transcribing...");
        const text = await requestTranscribe(blob);
        if (text) {
          setDetectedText(text);
          // Small delay to show the transcription before proceeding
          setTimeout(() => onDone(text), 1500);
          return;
        }
      }
    }
    onDone(null);
  }, [onDone]);

  useEffect(() => {
    // Show skip button after a brief delay
    const skipTimer = setTimeout(() => setShowSkip(true), 2000);

    // Start recording if mic is enabled
    if (MIC_ENABLED) {
      const recorder = new MicRecorder();
      recorderRef.current = recorder;
      recorder.start().then((ok) => {
        if (ok) {
          setIsRecording(true);
        }
      });
    }

    // Auto-skip timeout
    timeoutRef.current = setTimeout(() => {
      stopAndTranscribe();
    }, LISTEN_TIMEOUT_MS);

    return () => {
      clearTimeout(skipTimer);
      clearTimeout(timeoutRef.current);
      if (recorderRef.current?.isRecording) {
        recorderRef.current.stop();
      }
    };
  }, [stopAndTranscribe]);

  const handleSend = () => {
    clearTimeout(timeoutRef.current);
    stopAndTranscribe();
  };

  const handleSkip = () => {
    clearTimeout(timeoutRef.current);
    if (recorderRef.current?.isRecording) {
      recorderRef.current.stop();
    }
    onDone(null);
  };

  return (
    <div className="relative size-full grid-bg scanlines overflow-hidden flex flex-col items-center justify-center">
      {/* Background glow */}
      <div
        className="pulse-glow absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at center, rgba(255,0,0,0.12) 0%, transparent 70%)",
        }}
      />

      {/* Theme indicator */}
      <div
        className="absolute top-6 left-6 text-xs opacity-50"
        style={{ fontFamily: "var(--font-vt323)" }}
      >
        DOMAIN: {theme.toUpperCase()}
      </div>

      {/* Listening indicator */}
      <motion.div
        className="heartbeat mb-8 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div
          className="text-4xl mb-4"
          style={{
            fontFamily: "var(--font-vt323)",
            textShadow: "var(--pangool-text-glow)",
          }}
        >
          {isRecording ? "listening..." : "speak your question"}
        </div>
        <div
          className="text-lg opacity-50"
          style={{ fontFamily: "var(--font-vt323)" }}
        >
          or tap skip to let the spirits choose
        </div>
      </motion.div>

      {/* Recording visualization */}
      {isRecording && (
        <motion.div
          className="flex gap-1 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <motion.div
              key={i}
              className="w-1 bg-red-600 rounded-full"
              animate={{
                height: [8, 24 + Math.random() * 16, 8],
              }}
              transition={{
                duration: 0.6 + Math.random() * 0.4,
                repeat: Infinity,
                delay: i * 0.1,
              }}
            />
          ))}
        </motion.div>
      )}

      {/* Detected text */}
      {detectedText && (
        <motion.div
          className="absolute bottom-24 left-8 right-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div
            className="text-xl opacity-70"
            style={{ fontFamily: "var(--font-vt323)" }}
          >
            "{detectedText}"
          </div>
        </motion.div>
      )}

      {/* Action buttons */}
      {showSkip && (
        <motion.div
          className="absolute bottom-8 flex gap-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {isRecording && (
            <button
              onClick={handleSend}
              className="px-8 py-3 border border-red-600/60 bg-black cursor-pointer text-red-600 uppercase tracking-wider"
              style={{
                fontFamily: "var(--font-vt323)",
                fontSize: "1.2rem",
                textShadow: "0 0 8px rgba(255,0,0,0.5)",
              }}
            >
              send
            </button>
          )}
          <button
            onClick={handleSkip}
            className="px-8 py-3 border border-red-600/30 bg-black cursor-pointer text-red-600/50 uppercase tracking-wider"
            style={{
              fontFamily: "var(--font-vt323)",
              fontSize: "1.2rem",
            }}
          >
            skip
          </button>
        </motion.div>
      )}
    </div>
  );
}
