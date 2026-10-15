#!/usr/bin/env python3
"""Synthesise an original 45 s soundtrack (no samples, no licensing issues).
usage: music.py out.wav [variant 0-2] [transition times comma-separated]"""
import sys, numpy as np, wave
SR = 44100
out = sys.argv[1] if len(sys.argv) > 1 else "music.wav"
var = int(sys.argv[2]) if len(sys.argv) > 2 else 0
trans = [float(x) for x in (sys.argv[3] if len(sys.argv) > 3 else "4.2,8.6,17.8,27.2,37.0").split(",")]
DUR = 45.0
N = int(SR * DUR)
L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(7 + var)
BPM = [100, 92, 84][var % 3]
beat = 60 / BPM
# pentatonic, three moods: bright morning, busy noon, warm evening
ROOT = [60, 62, 57][var % 3]
SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21]
PROG = [[0, 4, 7], [-3, 0, 4], [5, 9, 12], [7, 11, 14]]  # I vi IV V (triads in semitones)
f = lambda m: 440 * 2 ** ((m - 69) / 12)

def add(sig, t, pan=0.5, gain=1.0):
    i = int(t * SR)
    if i >= N: return
    sig = sig[: N - i] * gain
    L[i:i + len(sig)] += sig * (1 - pan) * 2 ** .5 * .7
    R[i:i + len(sig)] += sig * pan * 2 ** .5 * .7

def env(n, a=.005, d=.3):
    t = np.arange(n) / SR
    return np.minimum(t / a, 1) * np.exp(-t / d)

def pluck(freq, dur=.9, bright=.5):
    n = int(SR * dur); p = max(2, int(SR / freq))
    buf = rng.uniform(-1, 1, p); y = np.zeros(n)
    for i in range(n):
        y[i] = buf[i % p]
        buf[i % p] = .5 * (buf[i % p] + buf[(i + 1) % p]) * (.994 + bright * .004)
    return y * env(n, .002, dur * .6)

def marimba(freq, dur=.6):
    t = np.arange(int(SR * dur)) / SR
    return (np.sin(2 * np.pi * freq * t) + .35 * np.sin(2 * np.pi * freq * 4 * t) * np.exp(-t * 18)) * env(len(t), .002, .22)

def pad(freqs, dur):
    t = np.arange(int(SR * dur)) / SR
    s = sum(np.sin(2 * np.pi * fr * t + np.sin(2 * np.pi * .3 * t) * .6) + .4 * np.sin(2 * np.pi * fr * 2.003 * t) for fr in freqs)
    a = np.minimum(t / .8, 1) * np.minimum((dur - t) / .8, 1)
    return s * a / len(freqs)

def kick():
    t = np.arange(int(SR * .35)) / SR
    return np.sin(2 * np.pi * (45 + 90 * np.exp(-t * 30)) * t) * np.exp(-t * 9)

def shaker():
    n = int(SR * .06); x = rng.uniform(-1, 1, n)
    x = np.diff(np.concatenate([[0], x]))
    return x * env(n, .003, .02)

def whoosh(dur=.7):
    n = int(SR * dur); x = rng.normal(0, 1, n); t = np.arange(n) / SR
    y = np.zeros(n); a = 0
    for i in range(n):  # sweeping one-pole lowpass
        c = .02 + .5 * (t[i] / dur)
        a += c * (x[i] - a); y[i] = a
    return y * np.sin(np.pi * t / dur) ** 2

def ding(freq):
    t = np.arange(int(SR * 2.2)) / SR
    return sum(np.sin(2 * np.pi * freq * h * t) * np.exp(-t * (2 + h)) / h for h in (1, 2.76, 5.4)) * .6

bars = int(DUR / (beat * 4)) + 1
for b in range(bars):
    t0 = b * beat * 4
    ch = PROG[b % 4]
    add(pad([f(ROOT - 12 + c) for c in ch], beat * 4 + .8), t0, .5, .16)
    add(marimba(f(ROOT - 24 + ch[0]), 1.2) * 1.3, t0, .5, .55)
    add(marimba(f(ROOT - 24 + ch[0] + 7), .8), t0 + beat * 2.5, .5, .35)
    for k in range(4):
        if t0 > 4 and t0 < 41.5:
            add(kick(), t0 + k * beat, .5, .55 if k % 2 == 0 else .3)
        for h in range(2):
            add(shaker(), t0 + k * beat + h * beat / 2 + beat / 4, .65, .12 + .06 * h)
    # melody: 8 eighth-notes per bar from pentatonic, seeded
    for k in range(8):
        if rng.random() < (.55 if 4 < t0 < 40 else .3):
            note = ROOT + SCALE[rng.integers(2, 9)]
            add(pluck(f(note), .8), t0 + k * beat / 2, .3 + .4 * rng.random(), .22)
    if b % 2 == 1:
        add(marimba(f(ROOT + 12 + ch[2]), .5), t0 + beat * 3.5, .7, .18)

for tt in trans:
    add(whoosh(.75), max(0, tt - .45), .5, .28)
add(ding(f(ROOT + 24)), 4.75, .5, .35)
add(ding(f(ROOT + 19)), 37.35, .5, .35)

mix = np.stack([L, R], 1)
fade = np.ones(N); fl = int(SR * 2.5); fade[-fl:] = np.linspace(1, 0, fl); fade[:int(SR * .3)] = np.linspace(0, 1, int(SR * .3))
mix *= fade[:, None]
mix = np.tanh(mix * 1.1)
mix /= np.abs(mix).max() / .89
with wave.open(out, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype("<i2").tobytes())
print("wrote", out)
