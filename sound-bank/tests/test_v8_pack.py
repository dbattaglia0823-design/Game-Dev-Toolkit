import importlib.util
import json
import tempfile
import unittest
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("sound_pack_install", ROOT / "install_pack.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class V8ArchiveTests(unittest.TestCase):
    def test_full_pack_crc_and_pcm(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / "audio"
            report = module.install("v8-performance-v1", out, dry_run=True)
            self.assertEqual(12, len(report["engines"]))
            self.assertEqual(144 + 18, report["audio_files"])
            self.assertFalse(out.exists())

    def test_partial_install_and_repeatability(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / "audio"
            a = module.install("v8-performance-v1", out, ["v8_ls_race_cam"])
            self.assertEqual(30, a["audio_files"])
            self.assertEqual(1, len(json.loads((out / "bank.json").read_text())["families"]))
            with wave.open(str(out / "engines/v8_ls_race_cam/1050_exhaust_on.wav"), "rb") as wav:
                self.assertEqual(wav.getnchannels(),1)
                self.assertEqual(wav.getframerate(),22050)
            b = module.install("v8-performance-v1", out, ["v8_ls_race_cam"])
            self.assertEqual(a["audio_files"],b["audio_files"])
            self.assertIn("toolkit:v8_ls_race_cam",json.loads((out / "catalog.json").read_text())["vehicles"])

    def test_reject_overwriting_modified_audio(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / "audio"
            module.install("v8-performance-v1", out, ["v8_ls_ohv"], include_effects=False)
            file = out / "engines/v8_ls_ohv/750_exhaust_on.wav"
            file.write_bytes(b"modified")
            with self.assertRaisesRegex(ValueError,"Existing audio differs"):
                module.install("v8-performance-v1", out, ["v8_ls_ohv"], include_effects=False)
