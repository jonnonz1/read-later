#!/usr/bin/env bash
#
# Package the Read Later extension for Chrome Web Store submission.
#
# Uses a whitelist of runtime files so dev-only assets (git metadata, marketing
# folder, docs, icon source, build helpers) can never sneak into the upload.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# Files that make up the published extension. Everything else is excluded.
INCLUDE=(
  manifest.json
  background.js
  lib/config.js
  lib/share.js
  lib/storage.js
  popup/popup.html
  popup/popup.css
  popup/popup.js
  reader/reader.html
  reader/reader.css
  reader/reader.js
  share/viewer.html
  icons/icon-16.png
  icons/icon-32.png
  icons/icon-48.png
  icons/icon-128.png
)

VERSION=$(python3 -c 'import json; print(json.load(open("manifest.json"))["version"])')
OUT="$REPO_ROOT/read-later-v${VERSION}.zip"

STAGE=$(mktemp -d)
trap 'rm -rf "$STAGE"' EXIT

echo "Staging $(printf '%s\n' "${INCLUDE[@]}" | wc -l | tr -d ' ') files..."
for f in "${INCLUDE[@]}"; do
  if [[ ! -f "$f" ]]; then
    echo "✗ Missing required file: $f" >&2
    exit 1
  fi
  mkdir -p "$STAGE/$(dirname "$f")"
  cp "$f" "$STAGE/$f"
done

rm -f "$OUT"
(cd "$STAGE" && zip -r "$OUT" . >/dev/null)

SIZE=$(du -h "$OUT" | cut -f1)
echo
echo "✓ Built $(basename "$OUT") ($SIZE, manifest version $VERSION)"
echo
echo "Contents:"
(cd "$STAGE" && find . -type f | sort | sed 's|^\./|  |')
