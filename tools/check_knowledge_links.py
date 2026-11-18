#!/usr/bin/env python3
"""Check internal Markdown links and skill metadata in the shared knowledge directories."""
from __future__ import annotations

import argparse
from pathlib import Path
import re
from urllib.parse import unquote, urlsplit

LINK = re.compile(r"!?\[[^\]]*\]\(([^)\n]+)\)")
NAME = re.compile(r"(?m)^name:\s*([a-z][a-z0-9-]*)\s*$")
DEFAULT_DIRS = ("knowledge", "templates/project", ".agents/skills")


def validate(root: Path, directories: tuple[str, ...] = DEFAULT_DIRS) -> list[str]:
    root = root.resolve()
    issues: list[str] = []
    for directory_name in directories:
        directory = root / directory_name
        if not directory.is_dir():
            issues.append(f"{directory_name}: missing directory")
            continue
        for page in sorted(directory.rglob("*.md")):
            label = page.relative_to(root).as_posix()
            content = page.read_text(encoding="utf-8")
            if page.name == "SKILL.md" and label.startswith(".agents/skills/"):
                if not content.startswith("---\n"):
                    issues.append(f"{label}: missing skill YAML frontmatter")
                else:
                    meta = content.split("---", 2)[1]
                    match = NAME.search(meta)
                    if match is None or match.group(1) != page.parent.name:
                        issues.append(f"{label}: metadata name differs from folder")
            for match in LINK.finditer(content):
                raw = match.group(1).strip().split(" ", 1)[0].strip("<>")
                if not raw or raw.startswith("#"):
                    continue
                parsed = urlsplit(raw)
                if parsed.scheme or parsed.netloc or not parsed.path:
                    continue
                linked = unquote(parsed.path)
                destination = (page.parent / linked).resolve()
                if not destination.is_relative_to(root):
                    issues.append(f"{label}: link exits repository: {raw}")
                elif not destination.exists():
                    issues.append(f"{label}: broken relative link: {raw}")
    return issues


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    issues = validate(args.root)
    for issue in issues:
        print(issue)
    if issues:
        print(f"{len(issues)} knowledge validation issue(s)")
        return 1
    print("Knowledge links and skill metadata: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
