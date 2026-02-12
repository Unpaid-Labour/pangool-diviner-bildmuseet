"""Piper TTS wrapper for generating speech audio."""

import subprocess
import tempfile
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

VOICES_DIR = Path(__file__).parent.parent / "voices"

# Piper voice model — download from https://github.com/rhasspy/piper/releases
# Place .onnx + .onnx.json files in the voices/ directory
PIPER_VOICE = VOICES_DIR / "en_US-lessac-medium.onnx"


def synthesize(text: str) -> Path | None:
    """Generate a WAV file from text using Piper TTS.

    Returns the path to the generated WAV file, or None on failure.
    Falls back to macOS `say` command if Piper is not available.
    """
    output_path = Path(tempfile.mktemp(suffix=".wav"))

    # Try Piper TTS first
    if PIPER_VOICE.exists():
        try:
            result = subprocess.run(
                [
                    "piper",
                    "--model", str(PIPER_VOICE),
                    "--output_file", str(output_path),
                ],
                input=text,
                capture_output=True,
                text=True,
                timeout=30,
            )
            if result.returncode == 0 and output_path.exists():
                logger.info("Piper TTS generated: %s", output_path)
                return output_path
            logger.warning("Piper TTS failed: %s", result.stderr)
        except FileNotFoundError:
            logger.warning("Piper binary not found, falling back to macOS say")
        except subprocess.TimeoutExpired:
            logger.warning("Piper TTS timed out")

    # Fallback: macOS say command → AIFF → convert to WAV with afconvert
    try:
        aiff_path = output_path.with_suffix(".aiff")
        subprocess.run(
            ["say", "-o", str(aiff_path), text],
            capture_output=True,
            timeout=30,
            check=True,
        )
        subprocess.run(
            [
                "afconvert",
                "-f", "WAVE",
                "-d", "LEI16@22050",
                str(aiff_path),
                str(output_path),
            ],
            capture_output=True,
            timeout=10,
            check=True,
        )
        aiff_path.unlink(missing_ok=True)
        logger.info("macOS say TTS generated: %s", output_path)
        return output_path
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        logger.error("TTS fallback failed: %s", e)
        return None
