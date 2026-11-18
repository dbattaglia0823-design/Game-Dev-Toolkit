#!/usr/bin/env python3
"""Create missing per-game Markdown docs from Game-Dev-Toolkit templates."""
from __future__ import annotations

import argparse
from pathlib import Path

TEMPLATE_DIR = Path(__file__).resolve().parent.parent / "templates" / "project"
ENGINE_LABELS = {
    "godot": "Godot 4 (verify exact version)",
    "web": "Web / Node (verify runtime)",
    "other": "Other (verify runtime)",
}


def scaffold(project_root: Path, project_name: str, engine: str, dry_run: bool = False) -> tuple[list[str], list[str]]:
    project_root = project_root.expanduser().resolve()
    if not project_root.is_dir():
        raise ValueError(f"Target project directory does not exist: {project_root}")
    if not project_name.strip():
        raise ValueError("Project name cannot be blank")
    if engine not in ENGINE_LABELS:
        raise ValueError(f"Unsupported engine: {engine}")
    created, skipped = [], []
    replacements = {"{{PROJECT_NAME}}": project_name.strip(), "{{ENGINE}}": ENGINE_LABELS[engine]}
    for template in sorted(TEMPLATE_DIR.rglob("*.md")):
        relative = template.relative_to(TEMPLATE_DIR)
        if relative == Path("README.md"):
            continue
        destination = project_root / relative
        if destination.exists():
            skipped.append(relative.as_posix())
            continue
        content = template.read_text(encoding="utf-8")
        for placeholder, value in replacements.items():
            content = content.replace(placeholder, value)
        if not dry_run:
            destination.parent.mkdir(parents=True, exist_ok=True)
            # Exclusive creation prevents overwriting a concurrent modification.
            with destination.open("x", encoding="utf-8", newline="\n") as f:
                f.write(content)
        created.append(relative.as_posix())
    return created, skipped


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project-root", type=Path, required=True)
    parser.add_argument("--name", required=True)
    parser.add_argument("--engine", choices=sorted(ENGINE_LABELS), required=True)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    try:
        created, skipped = scaffold(args.project_root, args.name, args.engine, args.dry_run)
    except (ValueError, OSError) as exc:
        parser.error(str(exc))
    for item in created:
        print(f'{"Would create" if args.dry_run else "Created"}: {item}')
    for item in skipped:
        print(f"Skipped existing: {item}")
    print(f"{len(created)} new / {len(skipped)} preserved. Review generated content against real game code.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
