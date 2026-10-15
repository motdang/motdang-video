# Mot Dang daily videos · มดแดง วิดีโอประจำวัน

Three 45-second motion-graphic videos a day for the **Motdang.net** Facebook Page, built from live [motdang.net](https://motdang.net) data and posted automatically with a Thai + English caption.

| | |
|---|---|
| Format | 1080 × 1920 (9:16), 30 fps, 45 s, H.264 + AAC, ~25–30 MB |
| Editions | morning 07:00 · noon 12:00 · evening 18:00 (Asia/Bangkok) |
| Look | Cream / red / ink palette, red-ant mascot, checker border strips, paper grain. Matches the reference clip posted on the Page on 14 Oct 2026 |
| Languages | Thai first, English underneath, on screen and in every caption |
| Cost per video | No AI is used to draw anything. The video is code that turns data into frames. AI is only used for the caption (n8n) and to run the scheduled job |

---

## Contents

1. [How it fits together](#how-it-fits-together)
2. [Repository layout](#repository-layout)
3. [Run it locally](#run-it-locally)
4. [The video timeline](#the-video-timeline)
5. [Editions and the daily scene plan](#editions-and-the-daily-scene-plan)
6. [Scene catalogue](#scene-catalogue)
7. [Data sources](#data-sources)
8. [The render engine](#the-render-engine)
9. [Soundtrack](#soundtrack)
10. [Publishing pipeline (Claude + n8n + Facebook)](#publishing-pipeline-claude--n8n--facebook)
11. [Caption quality: fact-check, guardrails, evaluation](#caption-quality-fact-check-guardrails-evaluation)
12. [Monitoring](#monitoring)
13. [Changing things](#changing-things)
14. [Troubleshooting](#troubleshooting)
15. [Content rules](#content-rules)

---

## How it fits together

```
 06:50 · 11:50 · 17:50  Claude scheduled task (cloud, no computer needed)
        │
        ├─ git clone motdang/motdang-video
        ├─ ./run.sh <slot>
        │     fetch_data.py ── motdang.net feeds ──► data.json (+ today's 3-scene plan)
        │     facts.py      ──────────────────────► out/facts.txt (only what the video shows)
        │     music.py      ──────────────────────► out/music.wav
        │     render.js     ── Chromium frames ─► ffmpeg ─► out/motdang_<date>_<slot>.mp4
        ├─ ./drop.sh  ── pushes the mp4 to branch `drops` ─► short-lived download URL
        │
        ├─ n8n "Mot Dang · Daily video pipeline"  (action: caption)
        │     duplicate guard → feed freshness → Claude writes → Claude fact-checks
        │     → code guardrails → row in motdang_video_posts → caption returned
        │
        ├─ Composio Facebook → FACEBOOK_CREATE_VIDEO_POST (Page 1343910615468335)
        └─ n8n (action: log) → Facebook link saved on the same row

 n8n also runs on its own: missed-slot watchdog (07:30 · 12:30 · 18:30), nightly report (21:30), error log
```

Nobody has to be online. The scheduled tasks, n8n and Facebook all run in the cloud.

---

## Repository layout

| File | What it does |
|---|---|
| `run.sh` | One-shot pipeline for a slot: install deps if missing → fetch → facts → music → render. Prints `VIDEO=…` |
| `fetch_data.py` | Pulls every motdang.net feed, normalises it, and picks the day's scene plan. Writes `data.json` |
| `facts.py` | Turns `data.json` into plain-text facts for the caption writer, scene by scene, using only numbers that appear on screen |
| `template.html` | Page shell 1080×1920: fonts, colour tokens, helpers (easing, counters, transitions), illustrations (logo badge, ant mascot, weather icons, moon) and the scene engine with `window.render(t)` |
| `scenes.js` | All scene components, intro / brand / outro, the per-slot copy and the timeline |
| `render.js` | Playwright drives Chromium frame by frame and pipes JPEG frames into ffmpeg. `--stills` mode for quick previews |
| `music.py` | Synthesises an original 45 s soundtrack (no samples) |
| `drop.sh` | Publishes the finished mp4 to the `drops` branch and prints a temporary download URL for Facebook |
| `RUNBOOK.md` | Exact step list the scheduled Claude task follows |
| `n8n/workflow.ts` | n8n Workflow SDK source of the first build of the pipeline workflow (the live workflow in n8n has since gained more; see below) |
| `package.json` | Fonts (`@fontsource/kanit`, `ibm-plex-sans-thai`, `ibm-plex-mono`) and `playwright` |

Branches: `main` holds the code. `drops` holds only the latest rendered video: it is force-pushed every run, so the repo doesn't grow with history.

---

## Run it locally

Requirements: Python 3.10+, Node 18+, ffmpeg, a Chromium that Playwright can drive (the script uses `/opt/pw-browsers/chromium` when it exists, otherwise Playwright's own).

```bash
npm ci                                   # fonts + playwright
./run.sh morning                         # or noon / evening; ~5 min
# → out/motdang_<YYYY-MM-DD>_morning.mp4, out/facts.txt, data.json

# quick look without rendering the whole video (PNG stills at given seconds):
python3 fetch_data.py noon data.json
node render.js data.json out/preview --stills 2.5,6.5,13,23,33,41.5

# force particular scenes for a test: edit data.json → "body": ["events","fight","money"]
node render.js data.json out/test --stills 13,23,33
```

`run.sh` picks the slot from the clock when none is given (before 10:00 → morning, before 15:00 → noon, else evening).

---

## The video timeline

Every edition has the same skeleton. Scenes overlap by ~0.6 s so each new one wipes in over the last.

| Time (s) | Scene | Transition in |
|---|---|---|
| 0.0 – 4.8 | **Intro**: "เชียงใหม่ · เชียงราย · ตอนนี้", LIVE time chip, three tilted cards flying in (one per body scene), yellow question sticker (e.g. "เช้านี้เป็นไงบ้าง?") | — |
| 4.2 – 9.2 | **Brand**: red field, floating lanterns, rotating rings, logo badge with the ant drawing itself, wordmark มดแดง / MOT DANG, tagline, mascot ant walking in | torn paper |
| 8.6 – 18.4 | **Body scene A** | per scene (iris / blinds / diagonal) |
| 17.8 – 27.8 | **Body scene B** | per scene |
| 27.2 – 37.6 | **Body scene C** | per scene |
| 37.0 – 45.0 | **Outro**: badge, wordmark, slot call-to-action, `motdang.net` pill with a click, TH/EN toggle, ant walks in, source credits | torn paper |

Always on top: red/cream checker strips at top and bottom, a soft vignette and animated paper grain.

---

## Editions and the daily scene plan

`fetch_data.py` builds **one plan per day** (seeded by the date), so the three editions never repeat a scene that day, and the mix changes from day to day.

| Edition | Rule |
|---|---|
| Morning | `weatherNow` always first, then 2 of `air`, `forecast7`, `airNorth`, `money`, `dayColour`. At least one of `air` / `airNorth` is guaranteed |
| Noon | 3 of `openNow`, `cinema`, `festival`, `events`, `money`, `hotsprings`, `seven`, `elephants` not used in the morning. On the 1st, 2nd, 16th and 17th the third scene becomes `lottery` (fresh results) |
| Evening | 2 of `sky`, `cinema`, `events`, `dayColour`, `airNorth`, `fight` not used earlier (`fight` counts double, and only on nights a stadium fights), then `tomorrow` always last |

The intro question also rotates between three wordings per edition, and the intro cards always show the three scenes that follow.

The plan depends only on the date (plus whether a stadium fights that night), so re-rendering the same edition on the same day gives the same scenes. The chosen scenes are in `data.json` → `body`.

---

## Scene catalogue

17 scene types in total.

| Key | On screen | Data | Look |
|---|---|---|---|
| `weatherNow` | Chiang Mai + Chiang Rai now: temp counter, condition TH/EN, feels-like, humidity, wind, UV; sun arc from sunrise to sunset with the sun at the current time | weather | sky gradient, drifting clouds, animated icons (sun rays, rain drops, fog, lightning) |
| `air` | PM2.5 gauge with Thai PCD bands and a needle, band label, 24 hourly bars (current hour highlighted), 8 other towns | air | cream, coloured band chips |
| `airNorth` | 9 towns ranked by PM2.5 as growing bars, cleanest vs haziest | air | cream bars with ink shadows |
| `forecast7` | 7-day Chiang Mai rows: day, icon, min–max bar on a shared scale, rain chance | weather | dark brown |
| `openNow` | Map of the old city moat with pins popping by category, total open now, 6 category counters | places API (`open_now=1`, 4 km) | illustrated map, river, Doi Suthep, walking ant |
| `cinema` | Films / shows / cinemas counters and 4 ticket cards with show times (evening: after 18:00 only) | showtimes | dark theatre, sweeping beams, film strips |
| `festival` | Countdown calendar to the next northern festival, name TH/EN, date, lunar note | festival_calendar | night purple, rising lanterns |
| `events` | Count today/tonight and next 7 days, timeline of up to 5 events with time and venue | events | cream timeline |
| `fight` | Muay Thai stadiums fighting tonight, times, ticket prices | fight_nights | black, ring ropes, punching glove |
| `money` | THB mid rates (USD, EUR, GBP, CNY, JPY×100), gold bar sell price and daily change, 3 crypto prices with 24 h change, "not investment advice" | finance | green ticker board, gold card |
| `dayColour` | Day of the week, traditional day colour, Buddha posture, Dhammapada verse of the day (Pali in Thai script + English) | fortune, shuffle, katha | full-bleed day colour, rotating lotus |
| `hotsprings` | Register total, count by province, the 3 hottest in CM/CR with thermometers | hotsprings | steam rising |
| `seven` | 7-Eleven count vs all convenience stores (ring chart), median distance to the nearest, coverage bars | seven | 7-Eleven stripe colours |
| `elephants` | Venues listed, how many state no riding / no shows, 3 no-riding parks with programme and price | elephants | jungle green, bobbing elephant |
| `lottery` | Official first prize with flip-digit animation, 3-digit and 2-digit prizes, next draw date, "official record, not a tip" | lottery | red and gold, lanterns |
| `sky` | Tonight's moon drawn at the real phase and illumination, Thai lunar day (e.g. ขึ้น 4 ค่ำ), Wan Phra badge, sunset and tomorrow's sunrise | sky, weather | night gradient, twinkling stars, Doi Suthep silhouette, city lights |
| `tomorrow` | Tomorrow for CM + CR: max/min, condition, rain chance, PM2.5 forecast, umbrella-or-not tip | weather, air | warm cream |

---

## Data sources

All from motdang.net. The engine never scrapes third-party sites itself.

| Feed | Used for |
|---|---|
| `/data/weather.json` (Open-Meteo, CC BY 4.0) | current conditions, 7-day forecast, sunrise/sunset |
| `/data/air.json` (Open-Meteo CAMS, modelled) | PM2.5 now, hourly, tomorrow, 9 towns |
| `/data/sky.json` | moon phase, Thai lunar day, Wan Phra |
| `/data/showtimes.json` (Major Cineplex) | films, shows, times |
| `/api/v1/places?open_now=1&cat=…` | open-now counts around each old town |
| `/data/festival_calendar.json` | next festival |
| `/data/events.json` | today's / tonight's events |
| `/data/fight_nights.json` | Muay Thai stadium schedule |
| `/data/finance.json` | FX (Bank of Thailand), gold, crypto (CoinGecko) |
| `/data/fortune.json`, `/data/shuffle.json`, `/data/katha.json` | day colour, verse of the day (lucky numbers are dropped) |
| `/data/hotsprings.json`, `/data/seven.json`, `/data/elephants.json`, `/data/lottery.json` | spotlight scenes |

If a feed fails, `fetch_data.py` logs a warning and keeps going with empty data for that part.

---

## The render engine

- **Deterministic:** `template.html` exposes `window.render(t)`. Every element's position, opacity and counter value is a pure function of `t`, so frame 812 always looks the same, and stills can be taken at any second.
- **Animation helpers:** elements declare entrances with attributes. `data-in` is the start time, `data-d` the duration and `data-fx` the effect: `up`, `down`, `left`, `right`, `pop`, `drop`, `fly`, `growX`, `growY`, `wipe`, `fade`. `data-float` adds idle bobbing. Numbers count up with `data-count`. Scenes add custom motion in an `update(lt)` hook (needles, sun arcs, ant legs, rain, steam, beams).
- **Transitions:** clip-path wipes (`tear` jagged paper edge, `iris` circle, `blinds` 9 strips, `diag` diagonal), plus a slow camera push-in on every scene.
- **Capture:** `render.js` loads the page in headless Chromium at 1080×1920. It calls `render(f/30)` for each of the 1,350 frames, screenshots each one as JPEG and streams it into ffmpeg (`libx264`, CRF 21, maxrate 6 Mb/s, `yuv420p`, faststart). The audio is muxed in at the end. A full render takes about 4–5 minutes on 1 vCPU.
- **Fonts:** Kanit (headlines), IBM Plex Sans Thai (body), IBM Plex Mono (labels), all bundled from npm, so renders look the same on any machine.

---

## Soundtrack

`music.py` writes a new, original 44.1 kHz stereo track for each video:
pentatonic plucks (Karplus–Strong), marimba bass, warm pad chords, soft kick and shakers, a whoosh under every transition and a bell on the logo reveals, with fade in/out and limiting.
Each edition has its own tempo and key (morning 100 BPM, noon 92, evening 84). No samples or licensed music are used.

---

## Publishing pipeline (Claude + n8n + Facebook)

### Scheduled tasks (Claude)

| Task | Runs (Bangkok) | Posts around |
|---|---|---|
| Mot Dang video · morning edition | 06:50 daily | 07:00 |
| Mot Dang video · noon edition | 11:50 daily | 12:00 |
| Mot Dang video · evening edition | 17:50 daily | 18:00 |

Each run starts a fresh cloud session and follows [`RUNBOOK.md`](RUNBOOK.md): clone → render → check 3 frames → `drop.sh` → caption via n8n → post via Composio → find the post link → log via n8n → short report with push notification.
They run with automatic approval and don't need your computer or you to be online.

### Video hand-off to Facebook

`drop.sh` force-pushes the mp4 to the `drops` branch of this **private** repo and asks the GitHub contents API for its `download_url`. That URL carries a short-lived token, so Facebook can fetch the file for a few minutes and nobody else can afterwards.

### n8n workflow "Mot Dang · Daily video pipeline" (id `1jnmAM7sFyXlGW3W`)

One webhook (`POST /webhook/motdang-video`) with three actions:

| `action` | Body fields | What happens | Returns |
|---|---|---|---|
| `caption` | `slot`, `post_date`, `edition`, `facts` | validate → duplicate guard → feed freshness check → Claude writes → Claude fact-checks → guardrails → insert row (`captioned`) | `{caption, row_id, fact_check_ok, used_fix, issues, unverified_numbers}` or `{skip:true}` if already posted |
| `log` | `row_id`, `status`, `fb_post_id`, `fb_url`, `note` | update that row (or insert if no id) | `{logged:true, row_id}` |
| `status` | `post_date` | all rows for the date | `{rows:[…]}` |

Other triggers in the same workflow: **Watchdog** at 07:30 · 12:30 · 18:30, **Nightly report** at 21:30, **Error trigger**, and **Evaluation trigger** (see below).
The language models are Claude Sonnet 5 through n8n's built-in gateway credits (no API key to manage, thinking disabled for predictable output).

### Data tables (n8n)

| Table | id | Columns |
|---|---|---|
| `motdang_video_posts` | `PHYx7pi2rFgQkQQI` | `post_date`, `slot` (`morning`/`noon`/`evening`/`daily-report`/`n8n`), `status` (`captioned`, `posted`, `failed`, `missed`, `n8n-error`, `x/3 posted`), `caption`, `fb_post_id`, `fb_url`, `note` |
| `motdang_caption_evals` | `V1bfR3VDvMCPPgng` | `case_name`, `slot`, `edition`, `facts`, `must_include`, `must_not`, `caption_out`, `score_out` |

### Accounts and IDs

| What | Value |
|---|---|
| Facebook Page | Motdang.net, Graph page id `1343910615468335` (profile id in the browser URL: `61595048904000`) |
| Facebook connection | Composio toolkit `facebook` (connected by the Page owner) |
| GitHub | `motdang/motdang-video` (private) |
| n8n | `nanobotco.app.n8n.cloud`, personal project |

---

## Caption quality: fact-check, guardrails, evaluation

1. **Writer** (Claude): Thai hook with one emoji, 2–4 Thai lines with the key numbers, the same in shorter English, a call to action to motdang.net, 4–6 hashtags always including `#เชียงใหม่ #ChiangMai #มดแดง`. The tone shifts by edition (practical morning, curious noon, relaxed evening).
2. **Fact-checker** (second Claude pass): compares the caption with the facts. It fails the caption for any unsupported number, place, film, time or date, a missing language, link or hashtag, lottery tips or investment advice, or more than 900 characters. When it fails, it returns a minimally repaired caption, which is then used.
3. **Guardrails** (code): add missing hashtags and link, collapse blank lines, cap length, and list any number that does not appear in the facts (`unverified_numbers`, saved in the row note).
4. **Evaluation**: the n8n *Evaluations* tab runs `motdang_caption_evals` through the real caption path, without touching the post log. There are 6 cases: two real days, plus traps for lottery tips, investment advice, PM2.5 wording and sparse feeds. Metrics: `overall`, `number_coverage`, `no_forbidden`, `no_unverified_numbers`, `bilingual`, `format_ok`, `fact_checker_pass`, `caption_chars`. Run it after any prompt change and compare scores. Add more rows to the table to test more situations.

---

## Monitoring

- **Phone:** each scheduled run sends a push notification with the Facebook link or the error.
- **n8n table `motdang_video_posts`:** one row per edition. `missed` rows mean nothing was posted 30 min after the slot.
- **Nightly report (21:30):** a `daily-report` row with "x/3 posted" and a short Thai/English ops note.
- **n8n executions:** failed runs keep full data (`saveDataErrorExecution: all`), and any workflow error writes an `n8n-error` row.

---

## Changing things

| I want to… | Edit |
|---|---|
| Change colours / fonts | `:root` tokens and `@font-face` in `template.html` |
| Change a scene's layout or text | its `c<Name>` function in `scenes.js` |
| Add a new scene type | write `cMyScene(st,du)` in `scenes.js`, add it to `BUILD` and `CARD` (intro card art + tag), add its data in `fetch_data.py`, its facts in `facts.py`, and its key to a pool in the plan |
| Change which scenes appear when | the plan block at the end of `fetch_data.py` |
| Change timings / length | `T` (timeline) in `scenes.js` and `DURATION`; the music length in `music.py` |
| Change the intro questions or outro CTA | `SLOTS` and `QS` at the top of `scenes.js` |
| Change caption style | the *Write caption* system prompt in n8n (then run the evaluation) |
| Change posting times | the three Claude scheduled tasks, plus the watchdog cron in n8n |

Always preview with `--stills` before pushing. The next scheduled run uses whatever is on `main`.

---

## Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| `Executable doesn't exist … chrome-headless-shell` | Playwright version mismatch. `render.js` already prefers `/opt/pw-browsers/chromium`; elsewhere run `npx playwright install chromium` |
| Text missing on a card | card text inherits the scene colour. Cards force `color: var(--ink)`; check custom elements do too |
| Scene looks empty | a feed returned nothing. Check `data.json` and the warnings from `fetch_data.py` |
| n8n caption `fact_check_ok:false` with no issues | the checker returned unreadable output. The writer's caption is still used; check that the model still has thinking disabled |
| n8n says "being edited by a user" | close the workflow tab in the n8n editor, then retry |
| Facebook 400 on `file_url` | the drop URL expired. Re-run `./drop.sh` and post within a few minutes |
| `missed` row but the video is on the Page | the run posted but failed before logging. Add the link with `action: log` |

---

## Content rules

- Show and say only what the data says. No invented numbers, places or times.
- PM2.5 values are modelled estimates (CAMS) and are labelled as such.
- Lottery: official results and the next draw date only, never tips or lucky numbers.
- Money: reference figures only, always with "not investment advice".
- Elephant parks: shown as each venue states its own practices.
- One post per edition per day.

Data credits: motdang.net, Open-Meteo (CC BY 4.0), OpenStreetMap (ODbL), Major Cineplex, Bank of Thailand, Gold Traders Association, CoinGecko, Government Lottery Office, Department of Mineral Resources, SuttaCentral (CC0).
