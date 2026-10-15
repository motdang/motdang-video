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
    # --- events (today; evening edition prefers things starting 17:00+)
    ev = safe(lambda: get("/data/events.json"), {"events": []}).get("events", [])
    todays = []
    for e in ev:
        st, en = e.get("start", ""), (e.get("end") or e.get("start", ""))
        if st[:10] <= today <= en[:10] and e.get("title"):
            if e.get("source") == "city-dates":
                continue
            tm = st[11:16] if st[:10] == today and st[11:16] != "00:00" else ""
            todays.append({"time": tm, "title": e["title"][:70], "venue": (e.get("venue_name") or "")[:48] if not (e.get("venue_name") or "").startswith("[") else "",
                           "recurring": bool(e.get("recurring")), "multi": st[:10] != en[:10]})
    if slot == "evening":
        todays = [e for e in todays if e["time"] >= "17:00"] or todays
    todays.sort(key=lambda e: (e["recurring"], e["time"] or "99"))
    pick = sorted(todays[:5], key=lambda e: e["time"] or "00:00")
    week = sum(1 for e in ev if today <= e.get("start", "")[:10] <= (now.date() + dt.timedelta(days=6)).isoformat())
    d["events"] = {"today": len(todays), "week": week, "list": pick}

    # --- muay thai tonight
    fn = safe(lambda: get("/data/fight_nights.json"), {"venues": []})
    code = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"][now.weekday()]
    fights = []
    for v in fn.get("venues", []):
        if v.get("days") and code in v["days"]:
            t = v.get("tickets_thb") or {}
            fights.append({"th": v.get("name_th"), "en": v.get("name_en"), "start": v.get("start"), "end": v.get("end"),
                           "from": min([x for x in t.values() if isinstance(x, (int, float))] or [0])})
    d["fights"] = fights

    # --- money
    fi = safe(lambda: get("/data/finance.json"), {})
    fx = (fi.get("fx") or {}).get("mid_thb", {})
    d["money"] = {"fx": [{"code": k, "thb": fx[k]} for k in ("USD", "EUR", "GBP", "CNY", "JPY") if k in fx],
                  "fx_date": (fi.get("fx") or {}).get("date"), "gold": fi.get("gold"),
                  "crypto": (fi.get("crypto") or {}).get("coins", [])[:3]}

    # --- day colour + verse of the day
    fo = safe(lambda: get("/data/fortune.json"), {"days": {}})
    th = ((fo.get("days") or {}).get(today) or {}).get("thai")
    if not th:
        cols = [("สีเหลือง", "yellow", "#F2C641"), ("สีชมพู", "pink", "#EE7FA8"), ("สีเขียว", "green", "#4FA36A"), ("สีส้ม", "orange", "#EE8B3C"),
                ("สีฟ้า", "blue", "#4A90D9"), ("สีม่วง", "purple", "#8C5BC4"), ("สีแดง", "red", "#D8322A")]
        c = cols[now.weekday()]
        th = {"th": "วัน" + TH_DOW[now.weekday()], "en": EN_DOW[now.weekday()], "colour_th": c[0], "colour_en": c[1], "hex": c[2], "buddha_th": "", "buddha_en": ""}
    th.pop("lucky", None)  # never show "lucky numbers"
    d["day"] = th
    sh = safe(lambda: get("/data/shuffle.json"), {})
    kt = safe(lambda: get("/data/katha.json"), {"items": []}).get("items", [])
    i = ((sh.get("today") or {}).get("katha_idx"))
    v = kt[i] if (i is not None and i < len(kt)) else None
    d["verse"] = v and {"ref": v.get("ref"), "th": v.get("th", [])[:4], "en": v.get("en", [])[:4], "gloss_th": v.get("gloss_th")}

    # --- hot springs
    hs = safe(lambda: get("/data/hotsprings.json"), {"provinces": {}, "springs": []})
    provs = sorted(({"th": p["th"], "en": p["en"], "n": p["count"]} for p in hs.get("provinces", {}).values()), key=lambda x: -x["n"])[:6]
    def tnum(x):
        try: return float(str(x.get("tempC") or "").split("-")[-1])
        except ValueError: return 0
    hot = sorted([x for x in hs.get("springs", []) if x.get("province") in ("cm", "cr") and tnum(x) > 0], key=lambda x: -tnum(x))[:3]
    d["hotsprings"] = {"total": len(hs.get("springs", [])), "provs": provs,
                       "hot": [{"name": x.get("nameTh") or x.get("name"), "en": x.get("nameEn") or x.get("name"), "temp": tnum(x), "amphoe": x.get("amphoe_th") or ""} for x in hot]}

    # --- 7-Eleven census
    sv = safe(lambda: get("/data/seven.json"), {})
    d["seven"] = {"census": sv.get("census"), "coverage": sv.get("coverage")}

    # --- elephants (ethics as each venue states it)
    el = safe(lambda: get("/data/elephants.json"), {"venues": []}).get("venues", [])
    d["elephants"] = {"n": len(el), "noride": sum(1 for v in el if (v.get("stated") or {}).get("riding") == "no"),
                      "noshow": sum(1 for v in el if (v.get("stated") or {}).get("shows") == "no"),
                      "list": [{"en": v.get("name_en"), "self": v.get("self_en", "")[:60], "price": v.get("prices_th", ""), "n": v.get("elephants", "")}
                               for v in el if (v.get("stated") or {}).get("riding") == "no"][:3]}

    # --- lottery (official record only)
    lo = safe(lambda: get("/data/lottery.json"), {}).get("draw") or {}
    nxt_draw = now.date().replace(day=16) if now.day < 16 else (now.date().replace(day=28) + dt.timedelta(days=4)).replace(day=1)
    d["lottery"] = lo and {"date_th": lo.get("date_th"), "date_en": lo.get("date_en"), "prizes": [{"id": p["id"], "th": p["th"], "en": p["en"], "numbers": p["numbers"][:2]} for p in lo.get("prizes", [])[:4]],
                           "next_th": f"{nxt_draw.day} {TH_MONTH[nxt_draw.month]}", "next_en": f"{nxt_draw.day} {EN_MON[nxt_draw.month]}"}

    # --- pick this edition's three body scenes (rotates daily so editions differ)
    import random
    rng = random.Random(today)  # one plan per day, so the three editions never repeat a scene
    fresh_lotto = now.day in (1, 2, 16, 17) and bool(d["lottery"])
    m_rest = rng.sample(["air", "forecast7", "airNorth", "money", "dayColour"], 2)
    if "air" not in m_rest and "airNorth" not in m_rest:
        m_rest[0] = rng.choice(["air", "airNorth"])
    plan = {"morning": ["weatherNow"] + m_rest}
    used = set(plan["morning"])
    noon_pool = [p for p in ["openNow", "cinema", "festival", "events", "money", "hotsprings", "seven", "elephants"] if p not in used]
    plan["noon"] = rng.sample(noon_pool, 3)
    if fresh_lotto:
        plan["noon"][2] = "lottery"
    used |= set(plan["noon"])
    eve_pool = [p for p in ["sky", "cinema", "events", "dayColour", "airNorth", "fight", "fight"] if p not in used and (p != "fight" or fights)]
    e1 = rng.choice(eve_pool)
    e2 = rng.choice([p for p in eve_pool if p != e1] or ["sky"])
    plan["evening"] = [e1, e2, "tomorrow"]
    body = plan.get(slot, plan["morning"])
    d["body"] = body
    d["variant"] = rng.randint(0, 2)

    json.dump(d, open(out, "w"), ensure_ascii=False, indent=1)
    print("wrote", out)


if __name__ == "__main__":
    main()
