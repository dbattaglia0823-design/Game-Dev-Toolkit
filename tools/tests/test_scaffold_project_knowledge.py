"""Non-destructive onboarding tests."""
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

from tools.scaffold_project_knowledge import TEMPLATE_DIR, scaffold


class ScaffoldTests(unittest.TestCase):
    def test_creates_all_expected_game_docs(self):
        with TemporaryDirectory() as directory:
            root = Path(directory)
            created, skipped = scaffold(root, "Streetbound", "godot")
            self.assertIn("AGENTS.md", created)
            self.assertIn("docs/INDEX.md", created)
            self.assertIn("docs/HANDOFF.md", created)
            self.assertFalse(skipped)
            self.assertEqual(len(created), len(list(TEMPLATE_DIR.rglob("*.md"))) - 1)
            result = (root / "docs" / "INDEX.md").read_text(encoding="utf-8")
            self.assertIn("Streetbound", result)
            self.assertIn("Godot 4", result)
            self.assertNotIn("{{PROJECT_NAME}}", result)

    def test_existing_docs_preserved(self):
        with TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "AGENTS.md").write_text("original rules\n", encoding="utf-8")
            (root / "docs").mkdir()
            (root / "docs" / "DECISIONS.md").write_text("original decisions\n", encoding="utf-8")
            created, skipped = scaffold(root, "Game", "web")
            self.assertIn("AGENTS.md", skipped)
            self.assertIn("docs/DECISIONS.md", skipped)
            self.assertIn("docs/INDEX.md", created)
            self.assertEqual((root / "AGENTS.md").read_text(encoding="utf-8"), "original rules\n")
            self.assertEqual((root / "docs" / "DECISIONS.md").read_text(encoding="utf-8"), "original decisions\n")

    def test_dry_run_does_not_write(self):
        with TemporaryDirectory() as directory:
            root = Path(directory)
            created, skipped = scaffold(root, "Game", "other", dry_run=True)
            self.assertTrue(created)
            self.assertFalse(skipped)
            self.assertEqual(list(root.iterdir()), [])

    def test_nonexistent_target_rejected(self):
        with TemporaryDirectory() as directory:
            with self.assertRaises(ValueError):
                scaffold(Path(directory) / "missing", "Game", "web")


if __name__ == "__main__":
    unittest.main()
