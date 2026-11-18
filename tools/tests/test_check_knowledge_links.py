"""Knowledge links and skill metadata regression tests."""
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

from tools.check_knowledge_links import validate


class KnowledgeLinkTests(unittest.TestCase):
    def test_toolkit_knowledge_is_linked_correctly(self):
        root = Path(__file__).resolve().parents[2]
        self.assertEqual(validate(root), [])

    def test_missing_reference_and_bad_skill_name(self):
        with TemporaryDirectory() as folder:
            root = Path(folder)
            for name in ("knowledge", "templates/project", ".agents/skills/wrong"):
                (root / name).mkdir(parents=True)
            (root / "knowledge/index.md").write_text("[yes](ok.md)\n[bad](absent.md)\n", encoding="utf-8")
            (root / "knowledge/ok.md").write_text("# ok\n", encoding="utf-8")
            (root / ".agents/skills/wrong/SKILL.md").write_text("---\nname: other\n---\n# test\n", encoding="utf-8")
            issues = validate(root)
            self.assertEqual(len(issues), 2)
            self.assertTrue(any("broken" in x for x in issues))
            self.assertTrue(any("metadata name" in x for x in issues))


if __name__ == "__main__":
    unittest.main()
