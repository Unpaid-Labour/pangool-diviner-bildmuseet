#!/usr/bin/env bash
# Download Afro-TTS (intronhealth/afro-tts) model files from HuggingFace.
# Run once during Mac Mini setup.
set -euo pipefail

REPO="intronhealth/afro-tts"
DEST="$(cd "$(dirname "$0")/.." && pwd)/models/afrotts"

REQUIRED_FILES=(
    "config.json"
    "model.pth"
    "vocab.json"
    "mel_stats.pth"
    "dvae.pth"
)

echo "Downloading Afro-TTS model to $DEST ..."
mkdir -p "$DEST"

BASE_URL="https://huggingface.co/${REPO}/resolve/main"

for f in "${REQUIRED_FILES[@]}"; do
    if [ -f "$DEST/$f" ]; then
        echo "  ✓ $f (already exists)"
    else
        echo "  ↓ Downloading $f ..."
        curl -L --progress-bar -o "$DEST/$f" "$BASE_URL/$f"
    fi
done

# Verify all files exist
echo ""
echo "Verifying files ..."
missing=0
for f in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$DEST/$f" ]; then
        echo "  ✗ MISSING: $f"
        missing=1
    else
        size=$(du -h "$DEST/$f" | cut -f1)
        echo "  ✓ $f ($size)"
    fi
done

if [ "$missing" -eq 1 ]; then
    echo ""
    echo "ERROR: Some files are missing. Re-run this script or download manually."
    exit 1
fi

echo ""
echo "Afro-TTS model ready at $DEST"
