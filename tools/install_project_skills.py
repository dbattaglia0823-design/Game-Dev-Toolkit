#!/usr/bin/env python3
"""Install explicitly selected Codex skills without overwriting existing game files."""
from __future__ import annotations

import argparse
from dataclasses import dataclass, field
from pathlib import Path
import re

SKILLS_DIR = Path(__file__).resolve().parent.parent / ".agents" / "skills"
SKILL_NAME = re.compile(r"[a-z][a-z0-9]*(?:-[a-z0-9]+)*\Z")


@dataclass
class InstallResult:
    created: list[str] = field(default_factory=list)
    unchanged: list[str] = field(default_factory=list)
    conflicts: list[str] = field(default_factory=list)
    missing: list[str] = field(default_factory=list)


def available_skills() -> list[str]:
    return sorted(p.parent.name for p in SKILLS_DIR.glob("*/SKILL.md")
                  if p.is_file() and SKILL_NAME.fullmatch(p.parent.name))


def install(project_root: Path, skill_names: list[str], *, dry_run: bool = False,
            verify_only: bool = False) -> InstallResult:
    root = project_root.expanduser().resolve()
    if not root.is_dir():
        raise ValueError(f"Project directory does not exist: {root}")
    if not skill_names:
        raise ValueError("Select one or more skills")
    known = set(available_skills())
    result = InstallResult()
    for name in dict.fromkeys(skill_names):
        if not SKILL_NAME.fullmatch(name) or name not in known:
            raise ValueError(f"Unknown skill: {name}. Available: {', '.join(sorted(known))}")
        source = SKILLS_DIR / name / "SKILL.md"
        relative = Path(".agents") / "skills" / name / "SKILL.md"
        destination = root / relative
        key = relative.as_posix()
        if any(p.is_symlink() for p in (root / ".agents", root / ".agents" / "skills",
                                        destination.parent, destination)):
            result.conflicts.append(key + " (symlink in destination)")
            continue
        if destination.exists():
            if destination.is_file() and destination.read_bytes() == source.read_bytes():
                result.unchanged.append(key)
            else:
                result.conflicts.append(key + " (existing file differs)")
        elif verify_only:
            result.missing.append(key)
        else:
            if not dry_run:
                destination.parent.mkdir(parents=True, exist_ok=True)
                with destination.open("xb") as output:
                    output.write(source.read_bytes())
            result.created.append(key)
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project-root", type=Path)
    parser.add_argument("--skills", nargs="+")
    parser.add_argument("--list", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--verify", action="store_true")
    args = parser.parse_args()
    if args.list:
        print("\n".join(available_skills()))
        return 0
    if args.project_root is None or not args.skills:
        parser.error("--project-root and --skills are required unless --list is used")
    try:
        report = install(args.project_root, args.skills, dry_run=args.dry_run, verify_only=args.verify)
    except (ValueError, OSError) as exc:
        parser.error(str(exc))
    for item in report.created:
        print(("Would install: " if args.dry_run else "Installed: ") + item)
    for item in report.unchanged:
        print("Unchanged: " + item)
    for item in report.conflicts:
        print("Conflict (preserved): " + item)
    for item in report.missing:
        print("Missing: " + item)
    if report.conflicts or report.missing:
        print("Review conflicts or missing skill snapshots manually.")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
