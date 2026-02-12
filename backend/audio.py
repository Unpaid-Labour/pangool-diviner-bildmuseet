"""System audio playback for Mac Mini speaker output."""

import subprocess
import logging
from pathlib import Path

logger = logging.getLogger(__name__)


async def play_audio(file_path: Path) -> None:
    """Play a WAV file through the Mac Mini's system audio output.

    Uses afplay (macOS native) which routes to the default audio device.
    The file is deleted after playback completes.
    """
    if not file_path.exists():
        logger.error("Audio file not found: %s", file_path)
        return

    try:
        proc = subprocess.Popen(
            ["afplay", str(file_path)],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
        )
        # Don't await — let it play in the background
        # Clean up when done via a callback
        import asyncio

        loop = asyncio.get_event_loop()

        def _cleanup():
            proc.wait()
            file_path.unlink(missing_ok=True)
            if proc.returncode != 0:
                logger.warning(
                    "afplay exited with code %d: %s",
                    proc.returncode,
                    proc.stderr.read().decode() if proc.stderr else "",
                )
            else:
                logger.info("Audio playback completed: %s", file_path.name)

        loop.run_in_executor(None, _cleanup)
    except FileNotFoundError:
        logger.error("afplay not found — is this running on macOS?")
        file_path.unlink(missing_ok=True)
