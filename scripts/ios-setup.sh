#!/usr/bin/env bash
# iOS setup for Apple Silicon Mac (M1/M2/M3) + physical iPhone.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IOS_DIR="$ROOT/ios"

echo "==> PatrolApp iOS setup (Apple Silicon Mac)"
echo "    Project root: $ROOT"

# M1/M2/M3 Homebrew paths
if [ -d /opt/homebrew/bin ]; then
  export PATH="/opt/homebrew/bin:/opt/homebrew/sbin:$PATH"
  echo "    Architecture: Apple Silicon (arm64)"
elif [ "$(uname -m)" = "arm64" ]; then
  echo "    Architecture: arm64"
else
  echo "    Architecture: $(uname -m)"
fi

cd "$ROOT"

if [ -s "$HOME/.nvm/nvm.sh" ]; then
  export NVM_DIR="$HOME/.nvm"
  # shellcheck source=/dev/null
  . "$HOME/.nvm/nvm.sh" --no-use
  if [ -f .nvmrc ]; then
    nvm install
    nvm use
  fi
fi

echo "==> Installing npm dependencies..."
npm install

echo "==> Applying patch-package patches..."
npm run postinstall

echo "==> Removing stale Node path cache..."
rm -f "$IOS_DIR/.xcode.env.local"

echo "==> Cleaning old CocoaPods artifacts..."
rm -rf "$IOS_DIR/Pods" "$IOS_DIR/build"

cd "$IOS_DIR"

if command -v bundle >/dev/null 2>&1 && [ -f "$ROOT/Gemfile" ]; then
  echo "==> Installing Ruby gems (CocoaPods)..."
  (cd "$ROOT" && bundle install)
  echo "==> Running pod install (this may take 5–10 min on first run)..."
  bundle exec pod install --repo-update
else
  echo "==> Running pod install (this may take 5–10 min on first run)..."
  pod install --repo-update
fi

NODE_PATH="$(command -v node || true)"
if [ -z "$NODE_PATH" ]; then
  echo ""
  echo "ERROR: Node.js not found."
  echo "On M1 Mac install with Homebrew:"
  echo "  brew install node@22"
  echo "  echo 'export PATH=\"/opt/homebrew/opt/node@22/bin:\$PATH\"' >> ~/.zshrc"
  echo "  source ~/.zshrc"
  exit 1
fi

NODE_VER="$("$NODE_PATH" --version)"
echo ""
echo "Setup done. Run the app:"
echo "  Terminal 1:  npm start"
echo "  Terminal 2:  npm run ios          (simulator)"
echo "               npm run ios:device   (iPhone XS Max via USB)"
echo ""
echo "First time on iPhone: open ios/Patrolapp.xcworkspace → select your Team under Signing."
