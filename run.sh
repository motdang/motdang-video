#!/usr/bin/env bash
# Render one Mot Dang video. usage: ./run.sh [morning|noon|evening]
# Output: out/motdang_<date>_<slot>.mp4, out/facts.txt, data.json
set -euo pipefail
cd "$(dirname "$0")"
SLOT="${1:-$(TZ=Asia/Bangkok date +%H | awk '{h=$1+0; print (h<10?"morning":(h<15?"noon":"evening"))}')}"
DAY="$(TZ=Asia/Bangkok date +%F)"
mkdir -p out
[ -d node_modules/playwright ] || npm ci --silent
python3 fetch_data.py "$SLOT" data.json
python3 facts.py data.json > out/facts.txt
VAR=$(case "$SLOT" in morning) echo 0;; noon) echo 1;; *) echo 2;; esac)
python3 music.py out/music.wav "$VAR"
OUT="out/motdang_${DAY}_${SLOT}.mp4"
node render.js data.json "$OUT" --audio out/music.wav
ffprobe -v error -show_entries format=duration,size -of default=nw=1 "$OUT"
echo "VIDEO=$OUT"
