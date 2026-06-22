#!/usr/bin/env bash
# Сборка SelfTrack PRO .ipa для установки через SideStore / AltStore
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Сборка веб-приложения..."
npm ci
npm run build
npx cap sync ios

IOS_DIR="$ROOT/ios/App"
ARCHIVE_PATH="$ROOT/build/SelfTrack.xcarchive"
EXPORT_DIR="$ROOT/build/ipa"
IPA_PATH="$ROOT/build/SelfTrack.ipa"

rm -rf "$ROOT/build"
mkdir -p "$ROOT/build"

echo "==> Архивация Xcode (Release, iPhone)..."
xcodebuild \
  -project "$IOS_DIR/App.xcodeproj" \
  -scheme App \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath "$ARCHIVE_PATH" \
  archive \
  CODE_SIGN_STYLE=Automatic \
  DEVELOPMENT_TEAM="${DEVELOPMENT_TEAM:-}" \
  -allowProvisioningUpdates

echo "==> Экспорт .ipa..."
xcodebuild \
  -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportPath "$EXPORT_DIR" \
  -exportOptionsPlist "$ROOT/ios/ExportOptions.plist" \
  -allowProvisioningUpdates

if [ -f "$EXPORT_DIR/App.ipa" ]; then
  mv "$EXPORT_DIR/App.ipa" "$IPA_PATH"
fi

echo ""
echo "Готово: $IPA_PATH"
echo "Установите через SideStore на iPhone."
