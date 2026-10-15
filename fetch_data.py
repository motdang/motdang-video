#!/usr/bin/env python3
"""Fetch live Mot Dang data and write data.json for one video slot.

usage: fetch_data.py [morning|noon|evening] [out.json]
"""
import json, sys, datetime as dt, urllib.request, urllib.parse
from zoneinfo import ZoneInfo

BASE = "https://motdang.net"
TZ = ZoneInfo("Asia/Bangkok")
UA = {"User-Agent": "MotDang-video-bot/1.0 (+https://motdang.net)"}

TH_MONTH = ["", "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."]
TH_DOW = ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์", "อาทิตย์"]
EN_DOW = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
EN_MON = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

# Open-Meteo WMO weather codes -> (kind, th, en)
def wx(code):
    c = int(code or 0)
    if c == 0: return ("sun", "ฟ้าใส", "Clear sky")
    if c in (1, 2): return ("partly", "มีเมฆบางส่วน", "Partly cloudy")
    if c == 3: return ("cloud", "เมฆมาก", "Overcast")
    if c in (45, 48): return ("fog", "หมอก", "Fog")
    if 51 <= c <= 57: return ("drizzle", "ฝนปรอย ๆ", "Drizzle")
    if 61 <= c <= 67 or 80 <= c <= 82: return ("rain", "ฝนตก", "Rain")
    if 95 <= c: return ("storm", "พายุฝนฟ้าคะนอง", "Thunderstorm")
    return ("cloud", "เมฆมาก", "Cloudy")


def get(path, **q):
    url = BASE + path + ("?" + urllib.parse.urlencode(q) if q else "")
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40) as r:
        return json.load(r)


def safe(fn, default):
    try:
        return fn()
    except Exception as e:  # keep rendering even if one feed is down
        print("warn:", e, file=sys.stderr)
        return default


def main():
    slot = sys.argv[1] if len(sys.argv) > 1 else "morning"
    out = sys.argv[2] if len(sys.argv) > 2 else "data.json"
    now = dt.datetime.now(TZ)
    today = now.date().isoformat()
    tomorrow = (now.date() + dt.timedelta(days=1)).isoformat()

    d = {
        "slot": slot,
        "now": now.strftime("%H:%M"),
        "date": today,
        "date_th": f"วัน{TH_DOW[now.weekday()]}ที่ {now.day} {TH_MONTH[now.month]} {now.year + 543}",
        "date_en": f"{EN_DOW[now.weekday()]} {now.day} {EN_MON[now.month]} {now.year}",
        "date_short": f"{now.day} {EN_MON[now.month]} {now.year}",
    }

    # --- weather
    w = safe(lambda: get("/data/weather.json"), {"cities": []})
    cities = []
    for c in w.get("cities", []):
        if c.get("id") not in ("chiang-mai", "chiang-rai"):
            continue
        k = wx(c.get("code"))
        days = []
        for day in c.get("days", [])[:7]:
            kk = wx(day.get("code"))
            ddate = dt.date.fromisoformat(day["date"])
            days.append({"date": day["date"], "dow_th": ["จันทร์","อังคาร","พุธ","พฤหัสฯ","ศุกร์","เสาร์","อาทิตย์"][ddate.weekday()],
                         "dow_en": EN_DOW[ddate.weekday()][:3], "max": round(day["max"]), "min": round(day["min"]),
                         "prob": day.get("prob", 0), "rain": day.get("rain", 0), "kind": kk[0], "th": kk[1], "en": kk[2],
                         "sunrise": day.get("sunrise", "")[-5:], "sunset": day.get("sunset", "")[-5:], "uv": day.get("uv")})
        cities.append({"id": c["id"], "th": c["th"], "en": c["en"], "temp": round(c.get("temp", 0)),
                       "feels": round(c.get("feels", 0)), "humidity": c.get("humidity"), "wind": c.get("wind"),
                       "uv": c.get("uv"), "kind": k[0], "wx_th": k[1], "wx_en": k[2], "is_day": c.get("is_day", 1),
                       "days": days})
    d["weather"] = cities

    # --- air
    a = safe(lambda: get("/data/air.json"), {"places": []})
    air = []
    for p in a.get("places", []):
        hours = [h for h in p.get("hours", []) if h[0].startswith(today)]
        tom = next((x for x in p.get("days", []) if x["date"] == tomorrow), None)
        air.append({"id": p["id"], "th": p["th"], "en": p["en"], "pm25": round(p.get("pm25", 0)),
                    "aqi": p.get("usAqi"), "band": p.get("band", {}), "hours": [round(h[1], 1) for h in hours],
                    "tomorrow": tom and {"pm25": round(tom["pm25"]), "band": tom["band"]}})
    d["air"] = air

    # --- sky
    sky = safe(lambda: get("/data/sky.json"), {"days": {}})
    d["moon"] = (sky.get("days", {}).get(today) or {}).get("moon")

    # --- cinema
    st = safe(lambda: get("/data/showtimes.json"), {"cinemas": []})
    films, shows, late, cine = {}, 0, 0, {"cm": 0, "cr": 0}
    for cin in st.get("cinemas", []):
        day = cin.get("days", {}).get(today, [])
        for f in day:
            n = len(f.get("times", []))
            shows += n
            cine[cin.get("province", "cm")] = cine.get(cin.get("province", "cm"), 0) + n
            late += sum(1 for t in f.get("times", []) if t >= "18:00")
            e = films.setdefault(f["title"], {"title": f["title"], "minutes": f.get("minutes"),
                                              "genre": (f.get("genres") or [f.get("category", "")])[0], "shows": 0, "times": set()})
            e["shows"] += n
            e["times"].update(f.get("times", []))
    top = sorted(films.values(), key=lambda x: -x["shows"])[:5]
    for f in top:
        ts = sorted(f["times"])
        f["times"] = [t for t in ts if t >= "18:00"][:5] if slot == "evening" else ts[:5]
    d["cinema"] = {"films": len(films), "shows": shows, "late": late, "by_prov": cine, "top": top,
                   "screens": len(st.get("cinemas", []))}

    # --- open now (counts by category near each old town)
    cats = [("food", "ร้านอาหาร", "Food", "food"), ("market", "ตลาด", "Markets", "market"),
            ("massage", "นวด-สปา", "Massage", "massage"), ("medical", "หมอ-ร้านยา", "Medical", "medical"),
            ("hotel", "ที่พัก", "Stays", "hotel"), ("shopping", "ช้อปปิ้ง", "Shopping", "shopping")]
    open_now = {}
    for cid, lat, lng in (("cm", 18.7883, 98.9853), ("cr", 19.9105, 99.8406)):
        rows = []
        for key, th, en, icon in cats:
            r = safe(lambda: get("/api/v1/places", open_now=1, cat=key, near=f"{lat},{lng}", radius=4000, limit=3), {})
            rows.append({"key": key, "th": th, "en": en, "icon": icon, "n": r.get("total", 0),
                         "names": [x.get("nameEn") or x.get("name") for x in r.get("results", [])][:3]})
        open_now[cid] = {"total": sum(x["n"] for x in rows), "rows": rows}
    d["open_now"] = open_now

    # --- next festival
    fc = safe(lambda: get("/data/festival_calendar.json"), {"rows": []})
    nxt = sorted([r for r in fc.get("rows", []) if r.get("date_start", "") >= today], key=lambda r: r["date_start"])
    if nxt:
        r = nxt[0]
        days_left = (dt.date.fromisoformat(r["date_start"]) - now.date()).days
        names = {"ok-phansa": ("วันออกพรรษา", "End of Buddhist Lent"), "yi-peng": ("ยี่เป็ง", "Yi Peng"),
                 "loy-krathong": ("ลอยกระทง", "Loy Krathong"), "makha-bucha": ("วันมาฆบูชา", "Makha Bucha"),
                 "visakha-bucha": ("วันวิสาขบูชา", "Visakha Bucha"), "asalha-bucha": ("วันอาสาฬหบูชา", "Asalha Bucha"),
                 "khao-phansa": ("วันเข้าพรรษา", "Buddhist Lent begins"), "songkran": ("สงกรานต์", "Songkran"),
                 "chinese-new-year": ("ตรุษจีน", "Chinese New Year")}
        th, en = names.get(r["festival_id"], (r.get("note_th", r["festival_id"])[:30], r["festival_id"].replace("-", " ").title()))
        dd = dt.date.fromisoformat(r["date_start"])
        d["festival"] = {"id": r["festival_id"], "th": th, "en": en, "days": days_left,
                         "date_th": f"{dd.day} {TH_MONTH[dd.month]}", "date_en": f"{dd.day} {EN_MON[dd.month]}",
                         "note_th": (r.get("note_th") or "")[:90], "note_en": (r.get("note_en") or "")[:110]}
    json.dump(d, open(out, "w"), ensure_ascii=False, indent=1)
    print("wrote", out)


if __name__ == "__main__":
    main()
