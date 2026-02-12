# Pangool Museum Installation

## Overview
An 11-month museum installation where visitors interact with a "pangool" oracle. A fine-tuned Gemma model generates divinations displayed on an iPad and spoken through a sculpture speaker. Fully offline.

## Architecture
- **iPad** (kiosk, Safari Guided Access) ↔ **Ethernet** ↔ **Mac Mini** (server) → **Speaker** (3.5mm)
- Web app served by Mac Mini, iPad is just a browser

## Tech Stack
| Layer | Technology |
|---|---|
| iPad UI | React + TypeScript + Tailwind CSS v4 + Framer Motion, built with Vite |
| Backend API | Python + FastAPI (serves frontend + API) |
| Model Inference | Ollama running Gemma (fine-tuned, quantized) |
| Speech-to-Text | Whisper via faster-whisper (optional) |
| Text-to-Speech | Piper TTS |
| Process Management | launchd (macOS native) |

## Project Structure
```
pangool_ipad_app/
├── frontend/          # React app (Vite + TypeScript)
│   ├── src/
│   │   ├── app/       # App.tsx + page components
│   │   ├── lib/       # API client, audio helpers
│   │   └── styles/    # Tailwind + theme CSS
│   └── vite.config.ts
├── backend/           # Python FastAPI
│   ├── main.py        # API routes, serves frontend dist/
│   ├── inference.py   # Ollama client
│   ├── tts.py         # Piper TTS wrapper
│   ├── stt.py         # Whisper transcription
│   └── audio.py       # System audio playback
├── models/            # Model files (GGUF)
├── voices/            # TTS voice files
└── scripts/           # Setup & launchd plists
```

## Build & Run Commands

### Frontend
```bash
cd frontend
npm install
npm run dev          # Dev server (proxied to backend at :8000)
npm run build        # Production build → dist/
```

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Production (Mac Mini)
Backend serves `frontend/dist/` as static files. Single process on port 8000.

## API Endpoints
- `GET /` — React SPA
- `POST /api/divine` — `{ theme, question? }` → SSE streamed divination
- `POST /api/speak` — `{ text }` → triggers TTS on Mac Mini speaker
- `POST /api/transcribe` — audio blob → transcribed text
- `GET /api/health` — health check

## Key Conventions
- SSE (Server-Sent Events) for streaming model output to frontend
- Fonts: Orbitron (headings/buttons), VT323 (terminal/status text)
- Color scheme: red (#ff0000) on black (#000000), CRT aesthetic
- State machine flow: home → theme-selection → listening → thinking → answer → end
- iPad never handles audio — Mac Mini owns TTS playback via wired speaker
- Static IPs: Mac Mini 10.0.0.1, iPad 10.0.0.2

## Testing
```bash
curl http://localhost:8000/api/health
curl -N -X POST http://localhost:8000/api/divine -H 'Content-Type: application/json' -d '{"theme":"fortune"}'
curl -X POST http://localhost:8000/api/speak -H 'Content-Type: application/json' -d '{"text":"The spirits speak"}'
```
