/**
 * API client for communicating with the Pangool backend.
 * Uses SSE for streaming divination tokens.
 */

const API_BASE = "";

export interface DivineCallbacks {
  onToken: (token: string) => void;
  onDone: (fullText: string) => void;
  onError: (error: string) => void;
}

/**
 * Request a divination from the Pangool oracle.
 * Streams tokens via SSE for real-time typewriter display.
 * Returns an AbortController to cancel the request.
 */
export function requestDivination(
  theme: string,
  question: string | null,
  callbacks: DivineCallbacks
): AbortController {
  const controller = new AbortController();

  (async () => {
    try {
      const response = await fetch(`${API_BASE}/api/divine`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme, question }),
        signal: controller.signal,
      });

      if (!response.ok) {
        callbacks.onError(`Server error: ${response.status}`);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        callbacks.onError("No response stream");
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            try {
              const parsed = JSON.parse(data);
              if (parsed.token) {
                callbacks.onToken(parsed.token);
              }
              if (parsed.full_text) {
                callbacks.onDone(parsed.full_text);
              }
              if (parsed.error) {
                callbacks.onError(parsed.error);
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        callbacks.onError((err as Error).message);
      }
    }
  })();

  return controller;
}

/**
 * Send text to the Mac Mini for TTS playback through the sculpture speaker.
 * Fire-and-forget — we don't wait for audio to finish.
 */
export async function requestSpeak(text: string): Promise<void> {
  try {
    await fetch(`${API_BASE}/api/speak`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  } catch (err) {
    console.warn("TTS request failed:", err);
  }
}

/**
 * Send recorded audio to the backend for Whisper transcription.
 */
export async function requestTranscribe(
  audioBlob: Blob
): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.wav");

    const response = await fetch(`${API_BASE}/api/transcribe`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    return data.text || null;
  } catch (err) {
    console.warn("Transcription failed:", err);
    return null;
  }
}

/**
 * Check if the backend is reachable.
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/health`, {
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
