"""Afro-TTS (XTTS v2) voice cloning for generating speech audio."""

import subprocess
import tempfile
import logging
import os
from pathlib import Path

import torch
import soundfile as sf
from TTS.tts.configs.xtts_config import XttsConfig
from TTS.tts.models.xtts import Xtts

logger = logging.getLogger(__name__)

VOICES_DIR = Path(__file__).parent.parent / "voices"
MODELS_DIR = Path(__file__).parent.parent / "models" / "afrotts"
REFERENCE_WAV = Path(
    os.environ.get("PANGOOL_REFERENCE_WAV", str(VOICES_DIR / "pangool_reference.wav"))
)

# Resolve device: MPS (Apple Silicon) > CUDA > CPU
if torch.backends.mps.is_available():
    DEVICE = "mps"
elif torch.cuda.is_available():
    DEVICE = "cuda"
else:
    DEVICE = "cpu"

# Patch torch.load to allow pickle-based XTTS checkpoints (PyTorch 2.6+ defaults
# weights_only=True which rejects them). These files come from a trusted source
# (HuggingFace intronhealth/afro-tts).
_orig_torch_load = torch.load
torch.load = lambda *args, **kwargs: _orig_torch_load(
    *args, **{**kwargs, "weights_only": False}
)

# Eager-load model and precompute speaker latents at import time
_model = None
_gpt_cond_latent = None
_speaker_embedding = None

try:
    config = XttsConfig()
    config.load_json(str(MODELS_DIR / "config.json"))
    _model = Xtts.init_from_config(config)
    _model.load_checkpoint(config, checkpoint_dir=str(MODELS_DIR), eval=True)
    _model.to(DEVICE)

    if REFERENCE_WAV.exists():
        _gpt_cond_latent, _speaker_embedding = _model.get_conditioning_latents(
            audio_path=[str(REFERENCE_WAV)]
        )
        logger.info("Afro-TTS loaded on %s, reference: %s", DEVICE, REFERENCE_WAV)
    else:
        logger.warning(
            "Afro-TTS model loaded but reference WAV missing: %s", REFERENCE_WAV
        )
except Exception as e:
    logger.warning("Failed to load Afro-TTS, will fall back to macOS say: %s", e)
    _model = None


def synthesize(text: str) -> Path | None:
    """Generate a WAV file from text using Afro-TTS voice cloning.

    Returns the path to the generated WAV file, or None on failure.
    Falls back to macOS `say` command if Afro-TTS is not available.
    """
    output_path = Path(tempfile.mktemp(suffix=".wav"))

    if _model is not None and _gpt_cond_latent is not None:
        try:
            out = _model.inference(
                text,
                "en",
                _gpt_cond_latent,
                _speaker_embedding,
            )
            sf.write(str(output_path), out["wav"], 24000)
            logger.info("Afro-TTS generated: %s", output_path)
            return output_path
        except Exception as e:
            logger.warning("Afro-TTS inference failed: %s", e)

    # Fallback: macOS say command
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
