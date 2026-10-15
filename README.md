# Mot Dang daily videos

45-second, 1080×1920 motion-graphic videos for the Motdang.net Facebook Page, three editions a day, built from live motdang.net data.

| Edition | Time (Bangkok) | Scenes |
|---|---|---|
| morning | 07:00 | weather now (CM + CR) · PM2.5 gauge, hourly bars, northern towns · 7-day forecast |
| noon | 12:00 | open-now map + category counts · cinema today · festival countdown |
| evening | 18:00 | moon & sky tonight · late cinema shows · tomorrow's weather + PM2.5 |

Every edition opens with the card intro and the red Mot Dang brand reveal and closes on the motdang.net outro. The soundtrack is synthesised fresh by `music.py` (no samples, nothing to license).

## Run

```bash
npm ci                     # fonts + playwright (uses the preinstalled Chromium if present)
./run.sh noon              # -> out/motdang_<date>_noon.mp4, out/facts.txt
```

Pieces: `fetch_data.py` (motdang.net feeds → data.json) · `template.html` + `scenes.js` (deterministic HTML scenes, `render(t)`) · `render.js` (Playwright frame capture → ffmpeg) · `music.py` · `facts.py` (the numbers the caption may use).

## Publishing pipeline (Claude + n8n + Facebook)

1. A Claude scheduled task runs `./run.sh <slot>` at 06:50 / 11:50 / 17:50.
2. It pushes the mp4 to the `drops` branch of this repo (force-pushed, one file) and gets a short-lived download URL.
3. It calls the n8n workflow **"Mot Dang · Daily video captions & log"** (`action: caption`, with `facts.txt`) and gets back a Thai + English caption.
4. It posts the video + caption to the Motdang.net Page (id 1343910615468335).
5. It calls the same workflow with `action: log`, so every post lands in the n8n data table `motdang_video_posts`.
