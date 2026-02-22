import { useState, useEffect, useCallback } from "react";
import { HomePage } from "./components/HomePage";
import { ThemeSelectionPage } from "./components/ThemeSelectionPage";
import { ListeningPage } from "./components/ListeningPage";
import { ThinkingPage } from "./components/ThinkingPage";
import { AnswerPage } from "./components/AnswerPage";
import { EndPage } from "./components/EndPage";
import { ConnectionOverlay } from "./components/ConnectionOverlay";
import { checkHealth } from "@/lib/api";

export type Stage =
  | "home"
  | "theme-selection"
  | "listening"
  | "thinking"
  | "answer"
  | "end";

const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes idle → reset to home

export function App() {
  const [stage, setStage] = useState<Stage>("home");
  const [selectedTheme, setSelectedTheme] = useState<string>("");
  const [userSpeech, setUserSpeech] = useState<string | null>(null);
  const [modelAnswer, setModelAnswer] = useState<string>("");
  const [connected, setConnected] = useState(true);

  // Connection health polling
  useEffect(() => {
    const poll = async () => {
      const ok = await checkHealth();
      setConnected(ok);
    };
    poll();
    const interval = setInterval(poll, 10_000);
    return () => clearInterval(interval);
  }, []);

  // Idle timeout — reset to home if no interaction
  useEffect(() => {
    if (stage === "home") return;
    const timer = setTimeout(() => {
      setStage("home");
      setSelectedTheme("");
      setUserSpeech(null);
      setModelAnswer("");
    }, IDLE_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [stage]);

  const reset = useCallback(() => {
    setStage("home");
    setSelectedTheme("");
    setUserSpeech(null);
    setModelAnswer("");
  }, []);

  // BYPASSED: listening stage skipped — theme-only divination (no user question).
  // ListeningPage code preserved below for potential future use.
  const handleThemeSelected = useCallback((theme: string) => {
    setSelectedTheme(theme);
    setStage("thinking");
  }, []);

  const handleListeningDone = useCallback((speech: string | null) => {
    setUserSpeech(speech);
    setStage("thinking");
  }, []);

  const handleDivinationDone = useCallback((answer: string) => {
    setModelAnswer(answer);
    setStage("answer");
  }, []);

  const handleAnswerDone = useCallback(() => {
    setStage("end");
  }, []);

  return (
    <>
      {!connected && <ConnectionOverlay />}

      {stage === "home" && (
        <HomePage onStart={() => setStage("theme-selection")} />
      )}

      {stage === "theme-selection" && (
        <ThemeSelectionPage onSelect={handleThemeSelected} />
      )}

      {/* BYPASSED: listening stage — theme-only divination, no user question.
         Uncomment to re-enable speech input:
      {stage === "listening" && (
        <ListeningPage
          theme={selectedTheme}
          onDone={handleListeningDone}
        />
      )}
      */}

      {stage === "thinking" && (
        <ThinkingPage
          theme={selectedTheme}
          question={userSpeech}
          onDone={handleDivinationDone}
        />
      )}

      {stage === "answer" && (
        <AnswerPage answer={modelAnswer} onDone={handleAnswerDone} />
      )}

      {stage === "end" && <EndPage onRestart={reset} />}
    </>
  );
}
