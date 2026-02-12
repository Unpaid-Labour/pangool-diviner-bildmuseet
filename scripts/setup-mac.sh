#!/bin/bash
# Pangool Museum Installation — Mac Mini Setup Script
# Run once to configure the Mac Mini as a headless server.
#
# Usage: sudo bash scripts/setup-mac.sh

set -euo pipefail

PANGOOL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PLIST_DIR="$HOME/Library/LaunchAgents"

echo "=== Pangool Mac Mini Setup ==="
echo "Project dir: $PANGOOL_DIR"
echo ""

# --- System Preferences ---
echo "[1/6] Configuring power management..."
# Prevent sleep
sudo pmset -a sleep 0
sudo pmset -a disksleep 0
sudo pmset -a displaysleep 0
# Wake on power loss (auto-restart after power failure)
sudo pmset -a autorestart 1
echo "  Done."

echo "[2/6] Disabling automatic updates..."
sudo softwareupdate --schedule off 2>/dev/null || true
# Disable automatic downloads
defaults write com.apple.SoftwareUpdate AutomaticDownload -bool false
defaults write com.apple.SoftwareUpdate AutomaticCheckEnabled -bool false
echo "  Done."

echo "[3/6] Disabling screen saver..."
defaults -currentHost write com.apple.screensaver idleTime 0
echo "  Done."

# --- Network (static IP for direct Ethernet to iPad) ---
echo "[4/6] Configuring static IP..."
echo "  NOTE: Manually set Ethernet to static IP 10.0.0.1, subnet 255.255.255.0"
echo "  System Preferences → Network → Ethernet → Configure IPv4 → Manually"
echo "  IP: 10.0.0.1 | Subnet: 255.255.255.0 | Router: (leave blank)"
echo ""

# --- Install launchd services ---
echo "[5/6] Installing launchd services..."
mkdir -p "$PLIST_DIR"

# Copy plist files
for plist in "$PANGOOL_DIR/scripts/"com.pangool.*.plist; do
  if [ -f "$plist" ]; then
    # Update WorkingDirectory path in plist
    BASENAME=$(basename "$plist")
    sed "s|__PANGOOL_DIR__|$PANGOOL_DIR|g" "$plist" > "$PLIST_DIR/$BASENAME"
    echo "  Installed $BASENAME"
  fi
done

# Load services
launchctl load "$PLIST_DIR/com.pangool.backend.plist" 2>/dev/null || true
launchctl load "$PLIST_DIR/com.pangool.ollama.plist" 2>/dev/null || true
launchctl load "$PLIST_DIR/com.pangool.nightly-reboot.plist" 2>/dev/null || true
echo "  Done."

# --- Build frontend ---
echo "[6/6] Building frontend..."
cd "$PANGOOL_DIR/frontend"
if command -v npm &>/dev/null; then
  npm install
  npm run build
  echo "  Frontend built → frontend/dist/"
else
  echo "  WARNING: npm not found. Install Node.js and run: cd frontend && npm install && npm run build"
fi

echo ""
echo "=== Setup Complete ==="
echo ""
echo "To start manually:"
echo "  cd $PANGOOL_DIR/backend"
echo "  uvicorn main:app --host 0.0.0.0 --port 8000"
echo ""
echo "To start Ollama:"
echo "  ollama serve"
echo "  ollama pull gemma3:4b"
echo ""
echo "iPad should connect to: http://10.0.0.1:8000"
