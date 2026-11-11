import json
import unittest
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "library" / "v8"

class TestStandaloneV8Assets(unittest.TestCase):
    def test_manifest_and_audio_files(self):
        manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
        rows, effects = manifest["rows"], manifest["effects"]
        self.assertEqual(16, len(rows))
        self.assertEqual(14, len(effects))
        self.assertEqual(4, len({x["variant"] for x in rows}))
        for entry in rows + effects:
            path = ROOT.parents[2] / entry["path"]
            self.assertTrue(path.is_file(), f"Missing {path}")
            with wave.open(str(path), "rb") as reader:
                self.assertEqual(reader.getnchannels(), 1)
                self.assertEqual(reader.getsampwidth(), 2)
                self.assertEqual(reader.getframerate(), 16000)
                self.assertGreater(reader.getnframes(), 100)
            self.assertIn("loop", entry)
        for row in rows:
            self.assertGreater(row["actual_rpm"], 0)
            self.assertIn(row["layer"], ("power", "coast"))
