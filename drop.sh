#!/usr/bin/env bash
# Push one rendered video to the `drops` branch (force-pushed, holds only the latest
# video) and print a short-lived direct download URL Facebook can fetch.
# usage: ./drop.sh out/motdang_<date>_<slot>.mp4
set -euo pipefail
cd "$(dirname "$0")"
VID="$1"; NAME="$(basename "$VID")"
REPO="${REPO:-motdang/motdang-video}"
TMP="$(mktemp -d)"
cp "$VID" "$TMP/$NAME"
cp out/facts.txt "$TMP/facts.txt" 2>/dev/null || true
(
  cd "$TMP"
  git init -q -b drops
  git add -A
  git -c user.name="motdang-video-bot" -c user.email="noreply@anthropic.com" commit -q -m "drop $NAME"
  git push -q -f "https://github.com/$REPO" drops:drops
)
rm -rf "$TMP"
# contents API returns a download_url with a temporary token for private repos
URL="$(env -u GH_TOKEN gh api "repos/$REPO/contents/$NAME?ref=drops" --jq .download_url)"
echo "DROP_URL=$URL"
