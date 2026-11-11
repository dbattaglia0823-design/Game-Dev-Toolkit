#!/usr/bin/env python3
"""Original offline engine sounds + opt-in copying of user-owned REDLINE WAV stems.
Python 3 standard library only. Acoustic approximation, never OEM recordings.
"""
from __future__ import annotations
import argparse
import json
import math
import shutil
import struct
import wave
from pathlib import Path

RATE = 22050
TAU = math.tau
LAYERS = ("exhaust_on", "exhaust_off", "intake_on", "intake_off", "mechanical")
DEFAULT_FAMILIES = ("i4_turbo", "i6_turbo", "v8_cross", "v8_super", "v10_na")
DEFAULT_RPMS = (900, 1800, 3600, 6200)
BASE = Path(__file__).resolve().parent
EFFECT_LOOPS = ("turbo_spool", "roots_whine", "centrifugal_whine", "cam_lope",
                "intake_open", "exhaust_catback", "exhaust_open", "exhaust_straight", "gear_whine")
EFFECT_SHOTS = {
    "bov_vent": 0.52, "bov_recirc": 0.45, "turbo_flutter": 0.48,
    "wastegate": 0.32, "blower_bypass": 0.34, "starter": 0.85,
    "limiter": 0.12, "shift_cut": 0.11, "exhaust_pop": 0.20,
}

def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))

def save_wav(path: Path, samples: list[float]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    peak = max((abs(s) for s in samples), default=1.0)
    gain = 0.76 / max(0.76, peak)
    pcm = b"".join(struct.pack("<h", max(-32767, min(32767, round(s * gain * 32767)))) for s in samples)
    with wave.open(str(path), "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(RATE)
        wav.writeframes(pcm)

def render_loop(family: str, rpm: int, layer: str, cylinders: int,
                cam_lope: float = 0.1, exhaust: float = 0.25) -> tuple[float, list[float]]:
    if layer not in LAYERS:
        raise ValueError(f"Unsupported layer: {layer}")
    # Multiples of 8 ensure lower firing-order harmonics tile without clicks.
    firing = max(1.0, rpm / 60.0 * max(1, cylinders) / 2.0)
    pulses = max(8, round(firing * 0.58 / 8) * 8)
    frames = round(RATE * pulses / firing)
    actual_rpm = pulses * RATE / frames * 120.0 / max(1, cylinders)
    loaded = layer.endswith("_on")
    bright = 0.55 if ("flat" in family or family.startswith("v10")) else 0.3
    if layer.startswith("intake"):
        bright += 0.20
    if layer == "mechanical":
        bright = 0.74
    if family.startswith("diesel"):
        bright -= 0.10
    cross = family in ("v8_cross", "v8_super")
    gains = (0.49, 0.18, 0.09, 0.05, 0.035) if cross else (0.40, 0.20, 0.12, 0.075, 0.045)
    if layer.startswith("intake"):
        gains = (0.18, 0.26, 0.18, 0.10, 0.055)
    elif layer == "mechanical":
        gains = (0.09, 0.11, 0.14, 0.13, 0.075)
    elif not loaded:
        gains = tuple(v * 0.57 for v in gains)
    if family == "ev":
        gains = (0.03, 0.02, 0.06, 0.10, 0.13)
    result = []
    for i in range(frames):
        x = i / frames
        phase = TAU * pulses * x
        sound = sum(g * math.sin(phase * (j+1) + 0.23 * j) * (1 + bright * 0.07 * j)
                    for j, g in enumerate(gains))
        sub = (0.12 if cross else 0.07) * math.sin(phase * 0.25 + 0.4)
        lope = max(0, cam_lope) * 0.20 * math.sin(phase * 0.125 + 0.7)
        grit = 0.05 * math.sin(TAU * 173 * x + 0.31) + 0.025 * math.sin(TAU * 291 * x)
        if layer.startswith("exhaust"):
            sound = (sound + sub + lope + grit * (0.3 + exhaust)) * (1 + exhaust * 0.16)
        elif layer.startswith("intake"):
            sound += grit * 0.8
        else:
            sound += 0.07 * math.sin(TAU * 337 * x)
        result.append(math.tanh(sound * (1.30 if loaded else 1.0)) * 0.54)
    return actual_rpm, result

def render_effect(name: str) -> list[float]:
    looping = name in EFFECT_LOOPS
    duration = 0.6 if looping else EFFECT_SHOTS[name]
    frames = round(RATE * duration)
    result = []
    for i in range(frames):
        x = i / frames
        t = i / RATE
        envelope = 1.0 if looping else (1.0-x) ** (5.5 if name == "exhaust_pop" else 1.7)
        hiss = math.sin(TAU*(353*x if looping else 1307*t)) + 0.5*math.sin(TAU*(619*x if looping else 2219*t) + 0.7)
        if name in ("turbo_spool", "roots_whine", "centrifugal_whine", "gear_whine"):
            freq = {"turbo_spool": 180, "roots_whine": 115, "centrifugal_whine": 245, "gear_whine": 138}[name]
            sound = 0.23*math.sin(TAU*freq*x) + 0.09*math.sin(TAU*freq*2*x)
        elif name == "turbo_flutter":
            gate = max(0, math.sin(TAU*(9.5-4*x)*t)) ** 4
            sound = (0.45*hiss + 0.24*math.sin(TAU*(520-240*x)*t))*gate
        elif name in ("bov_vent", "bov_recirc", "wastegate", "blower_bypass"):
            pitch = 920 if name == "bov_vent" else 490
            sound = hiss*0.34 + 0.25*math.sin(TAU*(pitch-x*330)*t)
        elif name in ("cam_lope", "exhaust_catback", "exhaust_open", "exhaust_straight", "intake_open"):
            pitch = {"cam_lope":22, "exhaust_catback":55, "exhaust_open":86,
                     "exhaust_straight":142, "intake_open":118}[name]
            sound = 0.20*math.sin(TAU*pitch*x) + (0.13 if name == "cam_lope" else 0.07)*hiss
        elif name == "starter":
            sound = 0.25*math.sin(TAU*(60+110*x)*t) + 0.25*hiss
        elif name == "exhaust_pop":
            sound = 0.65*hiss + 0.26*math.sin(TAU*135*t)
        else:
            sound = 0.27*hiss + 0.2*math.sin(TAU*235*t)
        result.append(math.tanh(sound*1.2)*envelope*0.58)
    return result

def export_family(bank: dict, out: Path, family: str, cylinders: int,
                  rpms: tuple[int,...], cam_lope: float, exhaust: float) -> None:
    if family in bank["families"]:
        return
    rows = []
    for rpm in rpms:
        files = {}
        actual = 0.0
        for layer in LAYERS:
            actual, samples = render_loop(family, rpm, layer, cylinders, cam_lope, exhaust)
            path = out / "engines" / family / f"{rpm}_{layer}.wav"
            save_wav(path, samples)
            files[layer] = f"res://assets/audio/vehicle_bank/engines/{family}/{path.name}"
        rows.append({"rpm": round(actual,2), "nominal_rpm":rpm,"files":files})
    bank["families"][family] = rows

def import_redline(bank: dict, out: Path, project_root: Path,
                   models: tuple[str,...], families: tuple[str,...]) -> None:
    root = project_root / "assets" / "audio" / "engines"
    old = load_json(root / "bank.json")
    for kind, names in (("families",families), ("vehicles",models)):
        for name in names:
            source = old.get(kind, {}).get(name)
            if source is None:
                raise ValueError(f"REDLINE {kind} does not contain {name}")
            rows = source if kind == "families" else source["rows"]
            copied = []
            for row in rows:
                files = {}
                for layer, old_path in row["files"].items():
                    rel = old_path.removeprefix("res://assets/audio/engines/")
                    src = root / rel
                    if not src.is_file():
                        raise FileNotFoundError(src)
                    dest = out / "engines" / rel
                    dest.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(src,dest)
                    files[layer] = "res://assets/audio/vehicle_bank/engines/" + rel.replace("\\","/")
                copied.append({"rpm":row["rpm"],"nominal_rpm":row["nominal_rpm"],"files":files})
            bank[kind][name] = copied if kind == "families" else {
                "family":source["family"],"rows":copied,
                "origin":"REDLINE original synthesized WAV stems; source: user-owned project"
            }

def main(argv: list[str]|None = None) -> int:
    p = argparse.ArgumentParser(description="Build Godot vehicle sound bank from original synthesis or REDLINE")
    p.add_argument("--out",type=Path,default=BASE/"generated")
    p.add_argument("--family",action="append",default=[])
    p.add_argument("--all-families",action="store_true")
    p.add_argument("--rpm",action="append",type=int,default=[])
    p.add_argument("--cam-lope",type=float,default=0.1)
    p.add_argument("--exhaust",type=float,default=0.25)
    p.add_argument("--redline-dir",type=Path)
    p.add_argument("--redline-vehicle",action="append",default=[])
    p.add_argument("--redline-family",action="append",default=[])
    args = p.parse_args(argv)
    families = load_json(BASE/"catalog.json")["families"]
    selected = list(families) if args.all_families else (args.family or list(DEFAULT_FAMILIES))
    unknown = set(selected).difference(families)
    if unknown:
        p.error("Unknown families: " + ", ".join(sorted(unknown)))
    if (args.redline_vehicle or args.redline_family) and not args.redline_dir:
        p.error("--redline-dir required with import selections")
    rpms = tuple(sorted(set(args.rpm or DEFAULT_RPMS)))
    if not rpms or any(r<400 or r>14000 for r in rpms):
        p.error("RPM must be between 400 and 14000")
    out = args.out.resolve()
    out.mkdir(parents=True,exist_ok=True)
    bank = {"format_version":1,"sample_rate":RATE,
            "origin":"Original offline synthesis; REDLINE imports labeled per vehicle",
            "families":{},"vehicles":{},"effects":{}}
    if args.redline_dir:
        import_redline(bank,out,args.redline_dir,tuple(args.redline_vehicle),tuple(args.redline_family))
    for name in selected:
        export_family(bank,out,name,int(families[name]["cylinders"]),rpms,args.cam_lope,args.exhaust)
    for name in (*EFFECT_LOOPS,*EFFECT_SHOTS):
        path = out/"effects"/f"{name}.wav"
        save_wav(path,render_effect(name))
        bank["effects"][name] = "res://assets/audio/vehicle_bank/effects/" + path.name
    for fname in ("catalog.json","modifiers.json"):
        shutil.copy2(BASE/fname,out/fname)
    (out/"bank.json").write_text(json.dumps(bank,indent=2)+"\n",encoding="utf-8")
    print(f"Exported {len(bank['families'])} families, {len(bank['vehicles'])} REDLINE vehicle banks, {len(bank['effects'])} effects to {out}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
