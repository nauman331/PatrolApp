#!/usr/bin/env bash
# One-time / repeat iOS setup on macOS. Fixes stale CocoaPods and Node path issues.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IOS_DIR="$ROOT/ios"

echo "==> PatrolApp iOS setup"
echo "    Project root: $ROOT"

cd "$ROOT"

if [ ! -d "node_modules/react-native" ]; then
  echo "==> Installing npm dependencies..."
  npm install
fi

echo "==> Applying patch-package patches..."
npm run postinstall

echo "==> Removing stale Node path cache..."
rm -f "$IOS_DIR/.xcode.env.local"

echo "==> Cleaning old CocoaPods artifacts..."
rm -rf "$IOS_DIR/Pods" "$IOS_DIR/build"

cd "$IOS_DIR"

if command -v bundle >/dev/null 2>&1 && [ -f "$ROOT/Gemfile" ]; then
  echo "==> Installing Ruby gems (CocoaPods)..."
  bundle install
  echo "==> Running pod install..."
  bundle exec pod install --repo-update
else
  echo "==> Running pod install..."
  pod install --repo-update
fi

NODE_PATH="$(command -v node || true)"
if [ -z "$NODE_PATH" ]; then
  echo ""
  echo "ERROR: Node.js not found in PATH."
  echo "Install Node >= 22.11.0 (see package.json engines) and re-run: npm run ios:setup"
  exit 1
fi

echo ""
echo "iOS setup complete."
echo "  Node: $NODE_PATH ($("$NODE_PATH" --version))"
echo ""
echo "Next steps on your Mac:"
echo "  1. Open ios/Patrolapp.xcworkspace in Xcode"
echo "  2. Select the Patrolapp target → Signing & Capabilities → choose your Team"
echo "  3. npm start          (Metro bundler, in one terminal)"
echo "  4. npm run ios        (build & run, in another terminal)"
