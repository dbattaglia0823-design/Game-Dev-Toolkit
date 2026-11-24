#!/usr/bin/env python3
"""Validate the project inventory; optionally verify expected docs in local clones."""
from __future__ import annotations

import argparse
from datetime import date
import json
from pathlib import Path, PurePosixPath
import re

DEFAULT_REGISTRY = Path(__file__).resolve().parents[1] / "knowledge/projects/registry.json"
SHA = re.compile(r"^[a-f0-9]{40}$")
IDENTIFIER = re.compile(r"^[a-z][a-z0-9-]*$")
REPO = re.compile(r"^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$")
COVERAGE = {"present_on_main", "pending_pr"}
REQUIRED_DOCS = ("AGENTS.md", "docs/INDEX.md", "docs/HANDOFF.md", "docs/DECISIONS.md", "docs/KNOWN_ISSUES.md")


def valid_relative(path: object) -> bool:
    if not isinstance(path, str) or not path or "\\" in path:
        return False
    parsed = PurePosixPath(path)
    return not parsed.is_absolute() and all(part not in ("", ".", "..") for part in path.split("/"))


def validate(registry_path: Path = DEFAULT_REGISTRY, checkouts_root: Path | None = None,
             max_age_days: int | None = None, today: date | None = None) -> list[str]:
    issues: list[str] = []
    try:
        content = json.loads(registry_path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as error:
        return [f"{registry_path}: unable to read registry: {error}"]
    if not isinstance(content, dict) or content.get("schema_version") != 1:
        return ["registry: schema_version must equal 1"]
    owner = content.get("owner")
    projects = content.get("projects")
    if not isinstance(owner, str) or not owner or not isinstance(projects, list) or not projects:
        return ["registry: owner and nonempty projects array are required"]
    if max_age_days is not None and max_age_days < 0:
        return ["max_age_days must be nonnegative"]
    today = today or date.today()
    seen_ids, seen_repos = set(), set()
    for number, project in enumerate(projects, 1):
        prefix = f"projects[{number}]"
        if not isinstance(project, dict):
            issues.append(f"{prefix}: must be an object")
            continue
        identifier, repository = project.get("id"), project.get("repository")
        coverage = project.get("coverage")
        docs_index = project.get("docs_index")
        if not isinstance(identifier, str) or not IDENTIFIER.fullmatch(identifier):
            issues.append(f"{prefix}: invalid id")
        elif identifier in seen_ids:
            issues.append(f"{prefix}: duplicate id {identifier}")
        seen_ids.add(identifier)
        if not isinstance(repository, str) or not REPO.fullmatch(repository) or not repository.startswith(owner + "/"):
            issues.append(f"{prefix}: invalid repository")
            continue
        if repository in seen_repos:
            issues.append(f"{prefix}: duplicate repository {repository}")
        seen_repos.add(repository)
        if coverage not in COVERAGE:
            issues.append(f"{prefix}: invalid coverage")
        if not valid_relative(docs_index) or not docs_index.endswith(".md"):
            issues.append(f"{prefix}: invalid docs_index")
        if not SHA.fullmatch(str(project.get("baseline_sha", ""))):
            issues.append(f"{prefix}: invalid baseline_sha")
        try:
            checked = date.fromisoformat(str(project["last_checked"]))
            if checked > today:
                issues.append(f"{prefix}: last_checked is in the future")
            elif max_age_days is not None and (today - checked).days > max_age_days:
                issues.append(f"{prefix}: last_checked older than {max_age_days} days")
        except (KeyError, ValueError):
            issues.append(f"{prefix}: invalid last_checked date")
        if coverage == "pending_pr":
            pr_url = project.get("pr_url")
            if not isinstance(pr_url, str) or not re.fullmatch(
                rf"https://github\.com/{re.escape(repository)}/pull/[1-9][0-9]*", pr_url
            ):
                issues.append(f"{prefix}: pending_pr requires matching pr_url")
        if checkouts_root is not None and coverage == "present_on_main":
            checkout = checkouts_root / repository.split("/", 1)[1]
            if not checkout.is_dir():
                issues.append(f"{prefix}: checkout missing at {checkout}")
                continue
            for relative in set(REQUIRED_DOCS + (docs_index,)):
                target = (checkout / relative).resolve()
                if not target.is_relative_to(checkout.resolve()) or not target.is_file():
                    issues.append(f"{prefix}: missing or unsafe document {relative}")
    return issues


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--registry", type=Path, default=DEFAULT_REGISTRY)
    parser.add_argument("--checkouts-root", type=Path, help="Directory containing repo-name checkout folders")
    parser.add_argument("--max-age-days", type=int, help="Opt-in audit-age limit; not checked in normal CI")
    args = parser.parse_args()
    issues = validate(args.registry, args.checkouts_root, args.max_age_days)
    for issue in issues:
        print(issue)
    if issues:
        print(f"{len(issues)} project knowledge audit issue(s)")
        return 1
    print("Project registry metadata OK" + ("; local documentation entrypoints OK" if args.checkouts_root else " (other repositories not fetched)"))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
