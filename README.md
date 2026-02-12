# Pangool Diviner — Bildmuseet

An AI oracle museum installation. Visitors interact with a "pangool" spirit through an iPad kiosk — choosing a theme, optionally speaking a question — and receive a poetic divination displayed on screen and spoken aloud through a sculpture.

Runs fully offline. A fine-tuned Gemma model generates divinations on a Mac Mini, served to an iPad over a direct Ethernet connection.

## Architecture

```
iPad (Safari kiosk)  ──Ethernet──  Mac Mini (server)  ──3.5mm──  Speaker (sculpture)
```

- **Mac Mini** runs everything: web server, AI model (Ollama/Gemma), text-to-speech (Piper), speech-to-text (Whisper)
- **iPad** is just a browser pointed at the Mac Mini's IP address
- **Speaker** is wired to the Mac Mini — audio never touches the iPad

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Tailwind CSS v4, Framer Motion, Vite |
| Backend | Python, FastAPI |
| Inference | Ollama + Gemma (quantized, local) |
| TTS | Piper TTS (fallback: macOS `say`) |
| STT | faster-whisper (optional, for voice input) |
| Process Mgmt | launchd (auto-start, auto-restart, nightly reboot) |

## Quick Start

### Frontend

```bash
cd frontend
npm install
npm run dev        # Dev server at http://localhost:5173
npm run build      # Production build → dist/
```

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Ollama

```bash
ollama serve
ollama pull gemma3:4b
```

In production, the backend serves the built frontend as static files. Open `http://10.0.0.1:8000` on the iPad.

## Project Structure

```
├── frontend/          React app (Vite + TypeScript)
│   └── src/
│       ├── app/       App state machine + page components
│       ├── lib/       API client, mic recording
│       └── styles/    Tailwind config, CRT theme, fonts
├── backend/           Python FastAPI server
│   ├── main.py        API routes (divine, speak, transcribe, health)
│   ├── inference.py   Ollama streaming client
│   ├── tts.py         Piper TTS with macOS fallback
│   ├── stt.py         Whisper transcription
│   └── audio.py       System audio playback (afplay)
├── scripts/           Mac Mini setup, launchd plists, iPad guide
├── models/            Model files (not in git)
├── voices/            TTS voice files (not in git)
├── STAFF-GUIDE.md     Non-technical guide for museum staff
└── CLAUDE.md          AI assistant context
```

## API

| Endpoint | Method | Description |
|---|---|---|
| `/api/divine` | POST | Stream a divination via SSE. Body: `{ "theme": "fortune", "question": "..." }` |
| `/api/speak` | POST | Trigger TTS playback on Mac Mini speaker. Body: `{ "text": "..." }` |
| `/api/transcribe` | POST | Transcribe audio via Whisper. Body: multipart audio file |
| `/api/health` | GET | Health check — returns `{ "status": "ok" }` |

## Visitor Flow

Home → Theme Selection → Listening (optional voice) → Thinking → Answer → End → (auto-reset)

## Museum Deployment

See [`STAFF-GUIDE.md`](STAFF-GUIDE.md) for non-technical setup and troubleshooting instructions for museum staff.

See [`scripts/setup-mac.sh`](scripts/setup-mac.sh) and [`scripts/setup-ipad.md`](scripts/setup-ipad.md) for technical setup.
