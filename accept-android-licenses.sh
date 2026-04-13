#!/bin/bash

# Accept Android SDK licenses for NDK and other components
# This script is run before the Android build to prevent license acceptance errors
#
# The approach: directly create license files in the SDK licenses directory
# This avoids calling sdkmanager which has Java dependency issues

ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-/opt/android-sdk}"
LICENSES_DIR="$ANDROID_SDK_ROOT/licenses"

echo "=== Setting up Android SDK licenses ==="
echo "Android SDK Root: $ANDROID_SDK_ROOT"

# Create licenses directory
if ! mkdir -p "$LICENSES_DIR" 2>/dev/null; then
  echo "⚠ Warning: Could not create $LICENSES_DIR (may require sudo)"
  # Try with sudo if available
  if command -v sudo &> /dev/null; then
    sudo mkdir -p "$LICENSES_DIR" 2>/dev/null || true
  fi
fi

# The standard license hash that Android SDK expects
# This is the official acceptance hash used by Google
SDK_LICENSE_HASH="24333f8a63b6825ea9c5514f83c2829b004d1fee"

# Create license files for all major Android components
declare -a licenses=(
  "android-sdk-license"
  "android-ndk-license"
  "google-gdk-license"
  "intel-android-extra-license"
  "mips-android-system-image-license"
  "android-googletv-license"
)

for license in "${licenses[@]}"; do
  license_file="$LICENSES_DIR/$license"
  if echo "$SDK_LICENSE_HASH" > "$license_file" 2>/dev/null; then
    echo "✓ $license"
  else
    # Try with sudo if write failed
    if command -v sudo &> /dev/null; then
      sudo bash -c "echo '$SDK_LICENSE_HASH' > '$license_file'" 2>/dev/null && \
        echo "✓ $license (via sudo)" || \
        echo "✗ Failed to write $license"
    else
      echo "✗ Failed to write $license (no sudo available)"
    fi
  fi
done

echo "=== Android SDK licenses setup complete ==="

# Verify
if [ -d "$LICENSES_DIR" ]; then
  echo "License files created:"
  ls -1 "$LICENSES_DIR" 2>/dev/null | sed 's/^/  /'
else
  echo "⚠ Warning: License directory does not exist"
fi
