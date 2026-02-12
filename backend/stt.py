"""Whisper speech-to-text transcription (optional)."""

import tempfile
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

_model = None


def _get_model():
    """Lazy-load the Whisper model."""
    global _model
    if _model is None:
        try:
            from faster_whisper import WhisperModel

            _model = WhisperModel(
                "tiny",  # Use "base" for better accuracy at cost of speed
                device="cpu",
                compute_type="int8",
            )
            logger.info("Whisper model loaded (tiny, cpu, int8)")
        except ImportError:
            logger.warning("faster-whisper not installed — STT disabled")
        except Exception as e:
            logger.error("Failed to load Whisper model: %s", e)
    return _model


async def transcribe(audio_bytes: bytes) -> str | None:
    """Transcribe audio bytes to text.

    Accepts WAV or WebM audio data. Returns transcribed text or None on failure.
    """
    model = _get_model()
    if model is None:
        return None

    # Write audio to temp file
    suffix = ".wav"
    tmp = tempfile.NamedTemporaryFile(suffix=suffix, delete=False)
    tmp_path = Path(tmp.name)
    try:
        tmp.write(audio_bytes)
        tmp.close()

        segments, _info = model.transcribe(
            str(tmp_path),
            beam_size=1,
            language="en",
            vad_filter=True,
        )
        text = " ".join(segment.text.strip() for segment in segments)
        logger.info("Transcribed: %s", text[:100])
        return text if text else None
    except Exception as e:
        logger.error("Transcription failed: %s", e)
        return None
    finally:
        tmp_path.unlink(missing_ok=True)
