#!/bin/bash

# Android SDK and NDK setup for EAS local builds
#
# This script handles two issues:
#   1. License acceptance for SDK components
#   2. NDK installation when the system SDK directory is read-only
#
# Strategy for NDK:
#   - Check common locations for a pre-installed NDK 27.1.12297006
#   - If not found, download NDK r27b to ~/android-sdk/ndk/27.1.12297006
#   - Write ndk.dir to android/local.properties so Gradle finds it
#     without attempting an auto-install via sdkmanager

set -euo pipefail

ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-/opt/android-sdk}"
LICENSES_DIR="$ANDROID_SDK_ROOT/licenses"
NDK_VERSION="27.1.12297006"
NDK_SHORT="r27b"

# ── 1. License files ──────────────────────────────────────────────────────────
echo "=== Setting up Android SDK licenses ==="
echo "Android SDK Root: $ANDROID_SDK_ROOT"

mkdir -p "$LICENSES_DIR" 2>/dev/null \
  || sudo mkdir -p "$LICENSES_DIR" 2>/dev/null \
  || true

SDK_LICENSE_HASH="24333f8a63b6825ea9c5514f83c2829b004d1fee"

for license in \
  android-sdk-license \
  android-ndk-license \
  google-gdk-license \
  intel-android-extra-license \
  mips-android-system-image-license \
  android-googletv-license
do
  license_file="$LICENSES_DIR/$license"
  if echo "$SDK_LICENSE_HASH" > "$license_file" 2>/dev/null; then
    echo "  ✓ $license"
  elif sudo bash -c "echo '$SDK_LICENSE_HASH' > '$license_file'" 2>/dev/null; then
    echo "  ✓ $license (via sudo)"
  else
    echo "  - $license (skipped — SDK dir not writable; will not block build)"
  fi
done

# ── 2. NDK setup ──────────────────────────────────────────────────────────────
echo ""
echo "=== Setting up Android NDK $NDK_VERSION ==="

# Candidate locations, checked in order
NDK_CANDIDATES=(
  "$ANDROID_SDK_ROOT/ndk/$NDK_VERSION"
  "$HOME/Android/Sdk/ndk/$NDK_VERSION"
  "$HOME/android-sdk/ndk/$NDK_VERSION"
  "/usr/lib/android-sdk/ndk/$NDK_VERSION"
)

FOUND_NDK=""
for candidate in "${NDK_CANDIDATES[@]}"; do
  if [ -d "$candidate" ]; then
    FOUND_NDK="$candidate"
    echo "  ✓ NDK found at $FOUND_NDK"
    break
  fi
done

# If not found anywhere, download to the user home location
if [ -z "$FOUND_NDK" ]; then
  USER_NDK_DIR="$HOME/android-sdk/ndk/$NDK_VERSION"
  echo "  NDK not found in any standard location."
  echo "  Installing NDK $NDK_SHORT to $USER_NDK_DIR ..."

  mkdir -p "$HOME/android-sdk/ndk"

  NDK_ZIP="/tmp/android-ndk-${NDK_SHORT}.zip"

  # Remove stale/truncated partial download (< 1 MB)
  if [ -f "$NDK_ZIP" ] && [ "$(stat -c%s "$NDK_ZIP" 2>/dev/null || echo 0)" -lt 1048576 ]; then
    rm -f "$NDK_ZIP"
  fi

  if [ ! -f "$NDK_ZIP" ]; then
    NDK_URL="https://dl.google.com/android/repository/android-ndk-${NDK_SHORT}-linux.zip"
    echo "  Downloading $NDK_URL ..."
    curl -L --progress-bar --retry 3 -o "$NDK_ZIP" "$NDK_URL"
  fi

  echo "  Extracting NDK ..."
  TEMP_DIR=$(mktemp -d)
  unzip -q "$NDK_ZIP" -d "$TEMP_DIR"
  mv "$TEMP_DIR/android-ndk-${NDK_SHORT}" "$USER_NDK_DIR"
  rm -rf "$TEMP_DIR" "$NDK_ZIP"
  echo "  ✓ NDK installed at $USER_NDK_DIR"

  FOUND_NDK="$USER_NDK_DIR"
fi

# ── 3. Write ndk.dir to android/local.properties ─────────────────────────────
# The android/ directory exists after expo prebuild has run.
# Writing ndk.dir here prevents Gradle from attempting an sdkmanager install.
if [ -d "android" ]; then
  LOCAL_PROPS="android/local.properties"
  # Remove any existing ndk.dir line, then append ours
  if [ -f "$LOCAL_PROPS" ]; then
    sed -i '/^ndk\.dir=/d' "$LOCAL_PROPS"
  fi
  echo "ndk.dir=$FOUND_NDK" >> "$LOCAL_PROPS"
  echo "  ✓ Wrote ndk.dir=$FOUND_NDK to $LOCAL_PROPS"
else
  echo "  android/ not yet generated — ndk.dir will be injected by the Expo config plugin"
fi

echo ""
echo "=== Setup complete ==="
