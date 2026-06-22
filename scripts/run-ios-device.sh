#!/usr/bin/env bash
# Build and run PatrolApp on a connected iPhone (e.g. iPhone XS Max) from an M1 Mac.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Apple Silicon Homebrew node in PATH
if [ -d /opt/homebrew/bin ]; then
  export PATH="/opt/homebrew/bin:$PATH"
fi

if [ ! -d "ios/Pods" ]; then
  echo "Pods not installed. Run: npm run ios:setup"
  exit 1
fi

echo "==> Connected iOS devices:"
xcrun xctrace list devices 2>/dev/null | grep -E "iPhone|iPad" | grep -v Simulator || true
echo ""

DEVICE_NAME="${1:-}"
if [ -z "$DEVICE_NAME" ]; then
  # Prefer a physical iPhone over simulator
  DEVICE_NAME="$(xcrun xctrace list devices 2>/dev/null \
    | grep -E "^iPhone" \
    | grep -v Simulator \
    | head -1 \
    | sed 's/ (.*//')"
fi

if [ -z "$DEVICE_NAME" ]; then
  echo "No physical iPhone found."
  echo "Connect your iPhone XS Max via USB, unlock it, tap Trust, then retry."
  echo ""
  echo "Also enable Developer Mode on iPhone:"
  echo "  Settings → Privacy & Security → Developer Mode → ON (restart required)"
  exit 1
fi

MAC_IP="$(ipconfig getifaddr en0 2>/dev/null || true)"
if [ -n "$MAC_IP" ]; then
  echo "==> Mac Wi-Fi IP: $MAC_IP"
  echo "    If using a local API, set DEV_MACHINE_IP=$MAC_IP in .env"
  echo ""
fi

echo "==> Building for device: $DEVICE_NAME"
echo "    (Metro must be running: npm start)"
echo ""

npx react-native run-ios --device "$DEVICE_NAME"
