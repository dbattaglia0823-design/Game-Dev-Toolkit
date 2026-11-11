#!/usr/bin/env python3
"""Install a self-contained sound-bank pack into any Godot 4 game.

Python 3 stdlib only. Validates archive members, PCM WAV headers, CRC and
existing bank collisions before copying anything. Original files remain in
Game-Dev-Toolkit; target game receives only the selected audio.
"""
from __future__ import annotations

import argparse
import io
import json
import wave
import zipfile
from pathlib import Path, PurePosixPath

ROOT = Path(__file__).resolve().parent
GODOT_ROOT = "res://assets/audio/vehicle_bank/"


def read_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def expected_member(path: str) -> str:
    if not path.startswith(GODOT_ROOT):
        raise ValueError(f"Unexpected bank asset root: {path}")
    member = path[len(GODOT_ROOT):]
    part = PurePosixPath(member)
    if (part.is_absolute() or ".." in part.parts or
            member.startswith("/") or part.suffix != ".wav" or
            str(part) != member):
        raise ValueError(f"Unsafe bank asset path: {member}")
    return member


def validated_audio(zipped: Path, required: set[str], rate: int):
    with zipfile.ZipFile(zipped) as archive:
        members = {n for n in archive.namelist() if not n.endswith("/")}
        if members != required or len(members) != len(archive.namelist()):
            raise ValueError(f"{zipped.name}: missing/unexpected WAV paths: "
                             f"{sorted(members ^ required)}")
        bad_crc = archive.testzip()
        if bad_crc:
            raise ValueError(f"{zipped.name}: CRC failure: {bad_crc}")
        for name in sorted(required):
            info = archive.getinfo(name)
            if info.file_size > 2_000_000 or info.compress_type != zipfile.ZIP_STORED:
                raise ValueError(f"{zipped.name}: unsupported WAV entry: {name}")
            data = archive.read(name)
            with wave.open(io.BytesIO(data), "rb") as wav:
                if (wav.getnchannels(), wav.getsampwidth(), wav.getframerate()) != (1, 2, rate):
                    raise ValueError(f"{name}: not 16-bit mono {rate} Hz")
                if wav.getnframes() < 3000:
                    raise ValueError(f"{name}: truncated WAV")
            yield name, data


def merge_dict(old: dict, add: dict, section: str, overwrite: bool) -> dict:
    target = old.setdefault(section, {})
    for key, value in add.items():
        if key in target and target[key] != value and not overwrite:
            raise ValueError(f"Existing {section} {key!r} differs; use --overwrite to replace")
        target[key] = value
    return old


def install(pack: str, output: Path, engines: list[str] | None = None,
            include_effects: bool = True, overwrite: bool = False,
            dry_run: bool = False) -> dict:
    source = ROOT / "packs" / pack
    if not (source / "pack.json").is_file():
        raise ValueError(f"Unknown pack: {pack}")
    info = read_json(source / "pack.json")
    bank = read_json(source / "bank.json")
    extra = read_json(source / "catalog-extension.json")
    if info["id"] != pack:
        raise ValueError("Pack ID mismatch")
    all_engines = list(bank["families"])
    selected = list(dict.fromkeys(engines or all_engines))
    if set(selected) - set(all_engines):
        raise ValueError(f"Unknown engine IDs: {sorted(set(selected) - set(all_engines))}")
    index_path = output / "bank.json"
    catalog_path = output / "catalog.json"
    modifier_path = output / "modifiers.json"
    current_index = read_json(index_path) if index_path.exists() else {
        "format_version": 1, "sample_rate": info["sample_rate"],
        "families": {}, "vehicles": {}, "effects": {}
    }
    if current_index.get("sample_rate") not in (None, info["sample_rate"]):
        raise ValueError("Incompatible sample rates; do not combine with this bank")
    current_catalog = read_json(catalog_path) if catalog_path.exists() else read_json(ROOT / "catalog.json")
    selected_banks = {k: bank["families"][k] for k in selected}
    selected_effects = bank["effects"] if include_effects else {}
    merge_dict(current_index, selected_banks, "families", overwrite)
    merge_dict(current_index, selected_effects, "effects", overwrite)
    merge_dict(current_catalog, {k:extra["families"][k] for k in selected}, "families", overwrite)
    merge_dict(current_catalog, {k:v for k,v in extra["vehicles"].items() if v["family"] in selected}, "vehicles", overwrite)
    if not modifier_path.exists():
        modifiers = read_json(ROOT / "modifiers.json")
    else:
        modifiers = None

    to_copy = []
    for engine in selected:
        rows = bank["families"][engine]
        expected = {expected_member(value) for row in rows for value in row["files"].values()}
        zipped = source / "bundles" / (engine + ".zip")
        to_copy.extend(validated_audio(zipped, expected, info["sample_rate"]))
    if include_effects:
        expected = {expected_member(value) for value in bank["effects"].values()}
        to_copy.extend(validated_audio(source / "bundles" / "v8-effects.zip",
                                       expected, info["sample_rate"]))
    # Check every destination before writing to avoid partial installs on collision.
    for name, data in to_copy:
        dest = output / name
        if dest.exists() and dest.read_bytes() != data and not overwrite:
            raise ValueError(f"Existing audio differs: {dest}")
    result = {"pack": pack, "engines": selected,
              "effects": len(selected_effects), "audio_files": len(to_copy),
              "destination": str(output), "dry_run": dry_run}
    if dry_run:
        return result
    for name, data in to_copy:
        dest = output / name
        dest.parent.mkdir(parents=True, exist_ok=True)
        if not dest.exists() or dest.read_bytes() != data:
            dest.write_bytes(data)
    output.mkdir(parents=True, exist_ok=True)
    index_path.write_text(json.dumps(current_index, indent=2) + "\n", encoding="utf-8")
    catalog_path.write_text(json.dumps(current_catalog, indent=2) + "\n", encoding="utf-8")
    if modifiers is not None:
        modifier_path.write_text(json.dumps(modifiers, indent=2) + "\n", encoding="utf-8")
    return result


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="Install reusable vehicle WAV stems into a Godot game")
    parser.add_argument("--pack", default="v8-performance-v1")
    parser.add_argument("--out", required=True, type=Path,
                        help="Target game's assets/audio/vehicle_bank directory")
    parser.add_argument("--engine", action="append", default=[], help="Select one or more banks")
    parser.add_argument("--without-effects", action="store_true")
    parser.add_argument("--overwrite", action="store_true",
                        help="Allow replacing different WAVs or bank mappings")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args(argv)
    report = install(args.pack, args.out, args.engine, not args.without_effects,
                     args.overwrite, args.dry_run)
    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
