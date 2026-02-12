"""Pangool Museum Installation — FastAPI Backend.

Serves the React frontend and provides API endpoints for divination,
TTS playback, and optional speech-to-text transcription.
"""

import json
import logging
from pathlib import Path

from fastapi import FastAPI, UploadFile, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from inference import generate_divination
from tts import synthesize
from audio import play_audio
from stt import transcribe

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
)
logger = logging.getLogger("pangool")

app = FastAPI(title="Pangool Oracle", version="1.0.0")

# CORS for dev (Vite dev server on :5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Models ---


class DivineRequest(BaseModel):
    theme: str
    question: str | None = None


class SpeakRequest(BaseModel):
    text: str


# --- API Endpoints ---


@app.get("/api/health")
async def health():
    """Health check endpoint for watchdog monitoring."""
    return {"status": "ok", "service": "pangool"}


@app.post("/api/divine")
async def divine(request: Request, body: DivineRequest):
    """Generate a divination using the Gemma model via Ollama.

    Returns Server-Sent Events streaming tokens as they're generated.
    The frontend displays these with a typewriter effect.
    """

    async def event_generator():
        full_text = ""
        try:
            async for token in generate_divination(body.theme, body.question):
                full_text += token
                yield {"event": "token", "data": json.dumps({"token": token})}

                # Check if client disconnected
                if await request.is_disconnected():
                    logger.info("Client disconnected during divination")
                    return

            yield {
                "event": "done",
                "data": json.dumps({"full_text": full_text}),
            }
        except Exception as e:
            logger.error("Divination error: %s", e)
            yield {
                "event": "error",
                "data": json.dumps({"error": str(e)}),
            }

    return EventSourceResponse(event_generator())


@app.post("/api/speak")
async def speak(body: SpeakRequest):
    """Synthesize text to speech and play through the Mac Mini speaker.

    Fire-and-forget from the frontend's perspective — audio plays on the
    Mac Mini's system output, not on the iPad.
    """
    wav_path = synthesize(body.text)
    if wav_path is None:
        return {"status": "error", "message": "TTS synthesis failed"}

    await play_audio(wav_path)
    return {"status": "ok", "message": "Audio playback started"}


@app.post("/api/transcribe")
async def transcribe_audio(audio: UploadFile):
    """Transcribe uploaded audio to text using Whisper.

    Accepts audio file (WAV/WebM) from iPad mic recording.
    """
    audio_bytes = await audio.read()
    text = await transcribe(audio_bytes)
    if text is None:
        return {"status": "error", "text": None}
    return {"status": "ok", "text": text}


# --- Static file serving (production) ---

FRONTEND_DIST = Path(__file__).parent.parent / "frontend" / "dist"

if FRONTEND_DIST.exists():
    # Serve static assets (JS, CSS, images)
    app.mount(
        "/assets",
        StaticFiles(directory=FRONTEND_DIST / "assets"),
        name="assets",
    )

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        """Serve the React SPA for all non-API routes."""
        index_html = FRONTEND_DIST / "index.html"
        return HTMLResponse(index_html.read_text())
