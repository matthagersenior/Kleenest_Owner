#!/usr/bin/env bash
set -euo pipefail

APK="${1:?APK path required}"
PACKAGE="${2:?Expected package identifier required}"

test -s "$APK"
command -v unzip >/dev/null
command -v readelf >/dev/null

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

unzip -Z1 "$APK" > "$TMP/entries.txt"
for entry in \
  'lib/arm64-v8a/libreactnative.so' \
  'lib/arm64-v8a/libhermesvm.so' \
  'assets/index.android.bundle'; do
  grep -Fxq "$entry" "$TMP/entries.txt" || { echo "APK is missing $entry" >&2; exit 1; }
done

for library in libreactnative.so libhermesvm.so; do
  unzip -p "$APK" "lib/arm64-v8a/$library" > "$TMP/$library"
  test -s "$TMP/$library"
  readelf -h "$TMP/$library" > "$TMP/$library.elf"
  grep -Eq 'Machine:[[:space:]]+AArch64' "$TMP/$library.elf" || { echo "$library is not AArch64" >&2; exit 1; }
  grep -Eq 'Class:[[:space:]]+ELF64' "$TMP/$library.elf" || { echo "$library is not a 64-bit ELF" >&2; exit 1; }
done

unzip -p "$APK" assets/index.android.bundle > "$TMP/index.android.bundle"
test -s "$TMP/index.android.bundle"
grep -aFq 'ssgesjzdvdsqacdtasje.supabase.co' "$TMP/index.android.bundle"
grep -aFq 'KleenestOS' "$TMP/index.android.bundle"
grep -aFq 'Kleenest Email Center' "$TMP/index.android.bundle"
grep -aFq 'get_attachment' "$TMP/index.android.bundle"

AAPT="$(command -v aapt || true)"
if [ -z "$AAPT" ]; then
  AAPT="$(find "${ANDROID_HOME:?Android SDK required}/build-tools" -mindepth 2 -maxdepth 2 -type f -name aapt | sort -V | tail -n1)"
fi
test -x "$AAPT"
"$AAPT" dump badging "$APK" > "$TMP/badging.txt"
grep -Fq "package: name='$PACKAGE'" "$TMP/badging.txt"
if grep -Fq 'application-debuggable' "$TMP/badging.txt"; then
  echo 'Release APK is marked debuggable.' >&2
  exit 1
fi

echo 'ARM64 APK package, native ELF architecture, bundled Email Center, and release identity verified.'
echo 'Physical ARM64 launch remains unverified; x86_64 emulator startup is tested separately.'
