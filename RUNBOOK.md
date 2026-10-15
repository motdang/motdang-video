# Runbook: one scheduled edition (Claude + n8n + Facebook)

Each scheduled task runs this for one slot (`morning` 06:50, `noon` 11:50, `evening` 17:50 Asia/Bangkok).
IDs used below:

- Facebook Page **Motdang.net** page_id `1343910615468335` (Composio toolkit `facebook`)
- n8n workflow **Mot Dang · Daily video pipeline** id `1jnmAM7sFyXlGW3W`, trigger node `Pipeline webhook`
- n8n data table `motdang_video_posts` id `PHYx7pi2rFgQkQQI`

## Steps

1. **Get the engine**: attach `motdang/motdang-video` with push access (add_repo), then
   `git clone --depth 1 https://github.com/motdang/motdang-video ~/motdang-video` and `cd` into it.
2. **Render**: `./run.sh <slot>` (≈5 min). It prints `VIDEO=out/motdang_<date>_<slot>.mp4` and writes `out/facts.txt` and `data.json` (its `body` field lists the 3 scenes).
   Check it: `ffprobe` must show 45 s, 1080×1920, h264 + aac. Pull 3 frames (`ffmpeg -ss 12/22/32`) and look at them; if a scene is blank or broken, log `failed` (step 7) and stop.
3. **Drop the video**: `./drop.sh <video>` prints `DROP_URL=…` (private repo, short-lived token; use it within minutes).
4. **Caption (n8n)**: `execute_workflow` (executionMode `production`, triggerNodeName `Pipeline webhook`) with
   `webhookData.method=POST`, `body={action:"caption", slot, post_date:<YYYY-MM-DD Bangkok>, edition:<body joined by ",">, facts:<out/facts.txt>}`.
   Poll `get_workflow_execution` (includeData, nodeNames `["Apply guardrails","Log captioned","Skip duplicate"]`) until it finishes.
   - `Skip duplicate` ran → this slot was already posted today: stop, nothing else to do.
   - Otherwise take `caption` from **Apply guardrails** and the row `id` from **Log captioned**.
     If `fact_check_ok` is false and `issues` is non-empty, still use the (repaired) caption but mention the issues in the log note.
5. **Post**: Composio `FACEBOOK_CREATE_VIDEO_POST` with `page_id`, `file_url=DROP_URL`, `description=<caption>`,
   `title` = first line of the caption (no emoji, ≤ 80 chars). Do not retry blindly: a retry can double-post.
6. **Find the post**: `FACEBOOK_GET_PAGE_POSTS` (limit 3, fields `id,created_time,permalink_url`); take the newest one created in the last 15 min.
   If it is not there yet, wait 60 s and look once more; fall back to `FACEBOOK_GET_PAGE_VIDEOS`.
7. **Log (n8n)**: `execute_workflow` again with `body={action:"log", row_id:<id from step 4>, status:"posted"|"failed", fb_post_id, fb_url, note}`.
8. Finish with a short `SendUserMessage`: slot, the 3 scenes, the Facebook link (or the failure and what was tried).

## Rules

- Never post more than once per slot. If unsure whether step 5 went through, check step 6 before doing anything else.
- Never put lottery tips, lucky numbers or investment advice in a caption.
- If motdang.net feeds are down, `fetch_data.py` still renders with what it has; if the video would be mostly empty, log `failed` instead of posting.
