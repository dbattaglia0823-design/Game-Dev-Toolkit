"""Project registry audit tests (no network access required)."""
from datetime import date
import json
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

from tools.audit_project_knowledge import validate


class ProjectRegistryTests(unittest.TestCase):
    def setUp(self):
        self.temp = TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.registry = self.root / "registry.json"
        self.entry = {
            "id": "example", "repository": "sample/Example", "runtime": "Web",
            "coverage": "present_on_main", "docs_index": "docs/INDEX.md",
            "last_checked": "2026-11-24", "baseline_sha": "a" * 40
        }
        self.write([self.entry])

    def write(self, projects):
        self.registry.write_text(json.dumps({"schema_version": 1, "owner": "sample", "projects": projects}), encoding="utf-8")

    def check(self, **kwargs):
        return validate(self.registry, today=date(2026, 11, 24), **kwargs)

    def test_valid_metadata_without_clone(self):
        self.assertEqual(self.check(), [])

    def test_detect_missing_docs_in_local_checkout(self):
        checkout = self.root / "repos/Example"
        checkout.mkdir(parents=True)
        self.assertTrue(any("missing or unsafe document" in s for s in self.check(checkouts_root=self.root / "repos")))
        for name in ("AGENTS.md", "docs/INDEX.md", "docs/HANDOFF.md", "docs/DECISIONS.md", "docs/KNOWN_ISSUES.md"):
            path = checkout / name
            path.parent.mkdir(exist_ok=True)
            path.write_text("verified locally\n", encoding="utf-8")
        self.assertEqual(self.check(checkouts_root=self.root / "repos"), [])

    def test_duplicates_and_invalid_traversal_rejected(self):
        dup = dict(self.entry, docs_index="../elsewhere.md")
        self.write([self.entry, dup])
        issues = self.check()
        self.assertTrue(any("duplicate id" in s for s in issues))
        self.assertTrue(any("duplicate repository" in s for s in issues))
        self.assertTrue(any("invalid docs_index" in s for s in issues))

    def test_pending_pr_does_not_claim_main_coverage(self):
        pending = dict(self.entry, coverage="pending_pr", pr_url="https://github.com/sample/Example/pull/1")
        self.write([pending])
        self.assertEqual(self.check(checkouts_root=self.root / "repos"), [])
        self.write([dict(pending, pr_url="https://github.com/sample/Wrong/pull/2")])
        self.assertTrue(any("matching pr_url" in s for s in self.check()))

    def test_opt_in_review_age(self):
        self.assertEqual(validate(self.registry, today=date(2026, 11, 24), max_age_days=0), [])
        self.assertTrue(any("older" in s for s in validate(self.registry, today=date(2026, 11, 25), max_age_days=0)))


if __name__ == "__main__":
    unittest.main()
