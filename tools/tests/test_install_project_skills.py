"""Non-destructive selected-skill installation tests."""
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

from tools.install_project_skills import SKILLS_DIR, available_skills, install


class SkillInstallTests(unittest.TestCase):
    def test_list_install_and_idempotence(self):
        self.assertIn("knowledge-maintenance", available_skills())
        with TemporaryDirectory() as folder:
            root = Path(folder)
            result = install(root, ["knowledge-maintenance", "knowledge-maintenance"])
            rel = ".agents/skills/knowledge-maintenance/SKILL.md"
            self.assertEqual(result.created, [rel])
            self.assertEqual((root / rel).read_bytes(), (SKILLS_DIR / "knowledge-maintenance" / "SKILL.md").read_bytes())
            again = install(root, ["knowledge-maintenance"])
            self.assertEqual(again.unchanged, [rel])
            self.assertEqual(again.created, [])

    def test_dry_run_and_verify_missing(self):
        with TemporaryDirectory() as folder:
            root = Path(folder)
            result = install(root, ["racing-ai-audit"], dry_run=True)
            self.assertEqual(len(result.created), 1)
            self.assertEqual(list(root.iterdir()), [])
            verify = install(root, ["racing-ai-audit"], verify_only=True)
            self.assertEqual(len(verify.missing), 1)

    def test_existing_conflict_preserved(self):
        with TemporaryDirectory() as folder:
            root = Path(folder)
            target = root / ".agents/skills/knowledge-maintenance/SKILL.md"
            target.parent.mkdir(parents=True)
            target.write_text("local instructions\n", encoding="utf-8")
            report = install(root, ["knowledge-maintenance"])
            self.assertEqual(len(report.conflicts), 1)
            self.assertEqual(target.read_text(encoding="utf-8"), "local instructions\n")

    def test_invalid_skill_rejected(self):
        with TemporaryDirectory() as folder:
            with self.assertRaises(ValueError):
                install(Path(folder), ["../escape"])
            with self.assertRaises(ValueError):
                install(Path(folder), ["unavailable"])


if __name__ == "__main__":
    unittest.main()
