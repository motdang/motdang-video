#!/usr/bin/env python3
"""Turn data.json into the plain-text facts the caption writer gets (only numbers that appear in the video)."""
import json, sys

d = json.load(open(sys.argv[1] if len(sys.argv) > 1 else "data.json"))
slot = d["slot"]
w = {c["id"]: c for c in d.get("weather", [])}
a = {x["id"]: x for x in d.get("air", [])}
cm, cr = w.get("chiang-mai", {}), w.get("chiang-rai", {})
L = [f"Date: {d['date_en']} ({d['date_th']}), edition: {slot}, data as of {d['now']}"]

if slot == "morning":
    for c in (cm, cr):
        if c:
            L.append(f"{c['en']} now: {c['temp']}°C ({c['wx_en']}), feels {c['feels']}°C, humidity {c['humidity']}%")
    if cm.get("days"):
        t = cm["days"][0]
        L.append(f"Chiang Mai today: {t['min']}–{t['max']}°C, rain chance {t['prob']}%, sunrise {t['sunrise']}, sunset {t['sunset']}")
        wk = cm["days"][:7]
        L.append("Chiang Mai 7 days: " + "; ".join(f"{x['dow_en']} {x['min']}–{x['max']}°C rain {x['prob']}%" for x in wk))
    for k in ("chiang-mai", "chiang-rai"):
        if k in a:
            L.append(f"PM2.5 {a[k]['en']}: {a[k]['pm25']} µg/m³ ({a[k]['band'].get('en', '')}) — CAMS model, not a street monitor")
elif slot == "noon":
    o = d["open_now"]["cm"]
    L.append(f"Open now within 4 km of Chiang Mai old city: {o['total']} places (" + ", ".join(f"{r['n']} {r['en'].lower()}" for r in o["rows"]) + ")")
    c = d["cinema"]
    if c["top"]:
        L.append(f"Cinemas today (Major Cineplex, Chiang Mai + Chiang Rai): {c['films']} films, {c['shows']} shows; top film {c['top'][0]['title']} ({c['top'][0]['shows']} shows)")
    f = d.get("festival")
    if f:
        L.append(f"Coming up: {f['en']} ({f['th']}) on {f['date_en']}, in {f['days']} days")
else:
    m = d.get("moon") or {}
    if m:
        L.append(f"Moon tonight: {m.get('thai_label_th')} ({m.get('phase_en')}, {round(m.get('illum', 0) * 100)}% lit)" + (", today is Wan Phra (Buddhist holy day)" if m.get("wan_phra") else ""))
    if cm.get("days"):
        L.append(f"Sunset today {cm['days'][0]['sunset']}, sunrise tomorrow {cm['days'][1]['sunrise'] if len(cm['days']) > 1 else ''}")
    c = d["cinema"]
    if c["top"]:
        L.append(f"Late cinema shows after 6pm today: {c['late']} across {c['screens']} cinemas; top film {c['top'][0]['title']}")
    for c in (cm, cr):
        if c.get("days") and len(c["days"]) > 1:
            t = c["days"][1]
            pm = (a.get(c["id"], {}).get("tomorrow") or {}).get("pm25")
            L.append(f"Tomorrow {c['en']}: {t['min']}–{t['max']}°C, {t['en']}, rain chance {t['prob']}%" + (f", PM2.5 forecast {pm}" if pm is not None else ""))
print("\n".join(L))
