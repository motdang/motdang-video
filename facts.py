#!/usr/bin/env python3
"""Turn data.json into the plain-text facts the caption writer gets: only what the video's scenes show."""
import json, sys

d = json.load(open(sys.argv[1] if len(sys.argv) > 1 else "data.json"))
w = {c["id"]: c for c in d.get("weather", [])}
a = {x["id"]: x for x in d.get("air", [])}
cm, cr = w.get("chiang-mai", {}), w.get("chiang-rai", {})
L = [f"Date: {d['date_en']} ({d['date_th']}), edition: {d['slot']}, data as of {d['now']}"]


def weatherNow():
    for c in (cm, cr):
        if c:
            L.append(f"{c['en']} now: {c['temp']}°C ({c['wx_en']}), feels {c['feels']}°C, humidity {c['humidity']}%, UV {c.get('uv')}")
    if cm.get("days"):
        t = cm["days"][0]
        L.append(f"Chiang Mai today: sunrise {t['sunrise']}, sunset {t['sunset']}")

def air():
    x = a.get("chiang-mai")
    if x:
        L.append(f"PM2.5 Chiang Mai: {x['pm25']} µg/m³ ({x['band'].get('en', '')}); modelled (CAMS), not a street monitor")
        L.append("Other towns PM2.5: " + ", ".join(f"{t['en']} {t['pm25']}" for t in d["air"] if t["id"] != "chiang-mai"))

def airNorth():
    rows = sorted(d["air"], key=lambda r: -r["pm25"])
    L.append("PM2.5 across the north (µg/m³, modelled): " + ", ".join(f"{r['en']} {r['pm25']}" for r in rows))
    if rows:
        L.append(f"Cleanest: {rows[-1]['en']}; haziest: {rows[0]['en']}")

def forecast7():
    if cm.get("days"):
        L.append("Chiang Mai 7 days: " + "; ".join(f"{x['dow_en']} {x['min']}–{x['max']}°C rain {x['prob']}%" for x in cm["days"][:7]))

def openNow():
    o = d["open_now"]["cm"]
    L.append(f"Open now within 4 km of Chiang Mai old city: {o['total']} places (" + ", ".join(f"{r['n']} {r['en'].lower()}" for r in o["rows"]) + ")")

def cinema():
    c = d["cinema"]
    if not c["top"]:
        return
    if d["slot"] == "evening":
        L.append(f"Cinema shows after 6pm today: {c['late']} (Major Cineplex, {c['screens']} cinemas in Chiang Mai + Chiang Rai); {c['films']} films showing")
    else:
        L.append(f"Cinemas today (Major Cineplex, Chiang Mai + Chiang Rai): {c['films']} films, {c['shows']} shows, {c['screens']} cinemas")
    L.append("Top films by shows today: " + "; ".join(f"{f['title']} ({f['shows']} shows)" for f in c["top"][:4]))

def festival():
    f = d.get("festival")
    if f:
        L.append(f"Coming up: {f['en']} ({f['th']}) on {f['date_en']}, in {f['days']} days")

def sky():
    m = d.get("moon") or {}
    if m:
        L.append(f"Moon tonight: {m.get('thai_label_th')} ({m.get('phase_en')}, {round(m.get('illum', 0) * 100)}% lit)" + (", today is Wan Phra (Buddhist holy day)" if m.get("wan_phra") else ""))
    if len(cm.get("days", [])) > 1:
        L.append(f"Sunset today {cm['days'][0]['sunset']}, sunrise tomorrow {cm['days'][1]['sunrise']}")

def tomorrow():
    for c in (cm, cr):
        if len(c.get("days", [])) > 1:
            t = c["days"][1]
            pm = (a.get(c["id"], {}).get("tomorrow") or {}).get("pm25")
            L.append(f"Tomorrow {c['en']}: {t['min']}–{t['max']}°C, {t['en']}, rain chance {t['prob']}%" + (f", PM2.5 forecast {pm}" if pm is not None else ""))

def events():
    e = d.get("events") or {}
    L.append(f"Events: {e.get('today', 0)} listed {'tonight' if d['slot'] == 'evening' else 'today'}, {e.get('week', 0)} in the next 7 days (motdang.net/events)")
    for x in e.get("list", []):
        L.append(f"- {x['time'] or 'all day'} {x['title']}" + (f" @ {x['venue']}" if x['venue'] else ""))

def fight():
    for v in d.get("fights", []):
        L.append(f"Muay Thai tonight: {v['en']} ({v['th']}) {v['start']}–{v['end']}" + (f", tickets from {v['from']} baht" if v.get("from") else ""))

def money():
    m = d.get("money") or {}
    if m.get("fx"):
        L.append(f"Mid rates (Bank of Thailand, {m.get('fx_date')}): " + ", ".join(f"1 {r['code']} = {r['thb']:.2f} baht" for r in m["fx"]))
    g = m.get("gold") or {}
    if g.get("barSell"):
        L.append(f"Gold bar sell {g['barSell']:,.0f} baht, change from previous day {g.get('changeFromPrevDay', 0):+,.0f}")
    if m.get("crypto"):
        L.append("Crypto (CoinGecko): " + ", ".join(f"{c['sym']} {c['thb']:,} baht ({c['chg24']:+.2f}% 24h)" for c in m["crypto"]))
    L.append("Reference only, not investment advice")

def dayColour():
    x = d.get("day") or {}
    L.append(f"Day colour for {x.get('en')}: {x.get('colour_en')} ({x.get('colour_th')})" + (f"; Buddha posture of the day: {x.get('buddha_en')}" if x.get("buddha_en") else ""))
    v = d.get("verse")
    if v:
        L.append(f"Verse of the day {v['ref']}: " + " ".join(v["en"]))

def hotsprings():
    h = d.get("hotsprings") or {}
    L.append(f"Hot springs in the northern register: {h.get('total')}; by province: " + ", ".join(f"{p['en']} {p['n']}" for p in h.get("provs", [])))
    for x in h.get("hot", []):
        L.append(f"- {x['name']} (amphoe {x['amphoe']}): {round(x['temp'])}°C")

def seven():
    s = (d.get("seven") or {})
    c, cv = s.get("census") or {}, s.get("coverage") or {}
    L.append(f"Mot Dang's map counts {c.get('seven_eleven')} 7-Elevens among {c.get('convenience')} convenience stores; median distance from a mapped place to the nearest one: {cv.get('median_m')} m (OpenStreetMap)")

def elephants():
    e = d.get("elephants") or {}
    L.append(f"Elephant venues in the register: {e.get('n')}; {e.get('noride')} state no riding, {e.get('noshow')} state no shows")
    for v in e.get("list", []):
        L.append(f"- {v['en']}")

def lottery():
    l = d.get("lottery") or {}
    if l:
        L.append(f"Government lottery result for {l.get('date_en')}: " + "; ".join(f"{p['en']} {' '.join(p['numbers'])}" for p in l.get("prizes", [])) + f". Next draw {l.get('next_en')}. Official record, not a tip.")

for k in d.get("body", []):
    fn = globals().get(k)
    if fn:
        fn()
print("\n".join(L))
