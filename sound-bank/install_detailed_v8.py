#!/usr/bin/env python3
"""Install a standalone V8 detailed sound pack into any game. No changes to v1 indexes."""
from __future__ import annotations
import argparse
import copy
import io
import json
import wave
import zipfile
from pathlib import Path, PurePosixPath

ROOT = Path(__file__).resolve().parent
PACK = ROOT / "packs" / "v8-detailed-v2"
RATE = 48000
MAX_WAV = 2_000_000

def safe_member(name: str) -> None:
    path = PurePosixPath(name)
    if (not name.startswith(("engines/", "effects/")) or
            path.is_absolute() or ".." in path.parts or
            path.suffix != ".wav" or str(path) != name):
        raise ValueError(f"Unsafe pack member: {name}")

def read_wavs(archive: Path, required: set[str]) -> list[tuple[str, bytes]]:
    if not archive.is_file():
        raise FileNotFoundError(archive)
    with zipfile.ZipFile(archive) as zf:
        names = zf.namelist()
        if len(names) != len(set(names)) or set(names) != required:
            raise ValueError(f"{archive.name}: missing/extra or duplicate WAVs")
        if zf.testzip() is not None:
            raise ValueError(f"{archive.name}: CRC failure")
        assets: list[tuple[str, bytes]] = []
        for name in sorted(required):
            safe_member(name)
            info = zf.getinfo(name)
            if info.compress_type != zipfile.ZIP_STORED or info.file_size > MAX_WAV:
                raise ValueError(f"{archive.name}: unsupported WAV data")
            data = zf.read(name)
            with wave.open(io.BytesIO(data), "rb") as w:
                if (w.getnchannels(), w.getsampwidth(), w.getframerate()) != (2, 2, RATE):
                    raise ValueError(f"Not 48kHz 16-bit stereo: {name}")
                if w.getnframes() < 3000:
                    raise ValueError(f"Truncated WAV: {name}")
            assets.append((name, data))
        return assets

def install(out: Path, engines: list[str] | None = None,
            include_effects: bool = True, overwrite: bool = False,
            dry_run: bool = False) -> dict:
    manifest = json.loads((PACK / "manifest.json").read_text(encoding="utf-8"))
    all_names = sorted(manifest["engines"])
    selected = sorted(set(engines or all_names))
    if set(selected) - set(all_names):
        raise ValueError(f"Unknown V8 engine IDs: {sorted(set(selected)-set(all_names))}")
    chosen = copy.deepcopy(manifest)
    chosen["engines"] = {k: manifest["engines"][k] for k in selected}
    chosen["effects"] = list(manifest["effects"]) if include_effects else []
    wavs: list[tuple[str, bytes]] = []
    for name in selected:
        rows = manifest["engines"][name]["rows"]
        for perspective in manifest["engines"][name]["perspectives"]:
            expected = {r["path"] for r in rows if r["perspective"] == perspective}
            wavs += read_wavs(PACK / "bundles" / f"{name}_{perspective}.zip", expected)
    if include_effects:
        expected = {x["path"] for x in manifest["effects"]}
        wavs += read_wavs(PACK / "bundles" / "v8-induction-and-events.zip", expected)
    for filename, data in wavs:
        destination = out / filename
        if destination.exists() and destination.read_bytes() != data and not overwrite:
            raise ValueError(f"Conflicting audio: {destination}")
    index = out / "manifest.json"
    if index.exists():
        old = json.loads(index.read_text(encoding="utf-8"))
        if old.get("id") != manifest["id"] or old.get("sample_rate") != RATE:
            raise ValueError("Existing installation is not this pack")
        for key in ("engines",):
            for name, value in old[key].items():
                if name in chosen[key] and chosen[key][name] != value and not overwrite:
                    raise ValueError(f"Conflicting engine definition: {name}")
                chosen[key][name] = value if name not in chosen[key] else chosen[key][name]
        if old.get("effects") and not include_effects:
            chosen["effects"] = old["effects"]
        if old.get("effects") and include_effects and old["effects"] != chosen["effects"] and not overwrite:
            raise ValueError("Conflicting effect definition")
    report = {"pack": manifest["id"], "installed_engines": selected,
              "wav_count": len(wavs), "effects": len(chosen["effects"]),
              "destination": str(out), "dry_run": dry_run}
    if dry_run:
        return report
    out.mkdir(parents=True, exist_ok=True)
    for filename, data in wavs:
        destination = out / filename
        destination.parent.mkdir(parents=True, exist_ok=True)
        if not destination.exists() or destination.read_bytes() != data:
            destination.write_bytes(data)
    index.write_text(json.dumps(chosen, indent=2) + "\n", encoding="utf-8")
    return report

def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="Install portable 48kHz V8 WAV sounds")
    parser.add_argument("--out", type=Path, required=True,
                        help="Target game's assets/audio/v8_detail_v2")
    parser.add_argument("--engine", action="append", default=[])
    parser.add_argument("--without-effects", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--overwrite", action="store_true")
    args = parser.parse_args(argv)
    print(json.dumps(install(args.out, args.engine, not args.without_effects,
                             args.overwrite, args.dry_run), indent=2))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
