import importlib.util
import json
import tempfile
import unittest
import wave
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PACK = ROOT / "packs" / "v8-detailed-v2"
SPEC = importlib.util.spec_from_file_location("install_v8_detail", ROOT / "install_detailed_v8.py")
installer = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(installer)

class DetailedV8Tests(unittest.TestCase):
    def test_manifest_and_all_pcm(self):
        manifest = json.loads((PACK / "manifest.json").read_text())
        self.assertEqual(48000, manifest["sample_rate"])
        self.assertEqual(2, manifest["channels"])
        self.assertEqual(2, len(manifest["engines"]))
        self.assertEqual(13, len(manifest["effects"]))
        count = 0
        for name, profile in manifest["engines"].items():
            self.assertEqual(36, len(profile["rows"]))
            self.assertEqual(6, len(profile["rpms"]))
            self.assertEqual({"exterior", "interior"}, set(profile["perspectives"]))
            for p in profile["perspectives"]:
                archive = PACK / "bundles" / f"{name}_{p}.zip"
                with zipfile.ZipFile(archive) as z:
                    self.assertIsNone(z.testzip())
                    expected = {row["path"] for row in profile["rows"] if row["perspective"] == p}
                    self.assertEqual(expected, set(z.namelist()))
                    for filename in expected:
                        with z.open(filename) as f, wave.open(f, "rb") as sound:
                            self.assertEqual((sound.getnchannels(), sound.getsampwidth(), sound.getframerate()), (2,2,48000))
                            self.assertGreater(sound.getnframes(), 10000)
                            count += 1
        with zipfile.ZipFile(PACK / "bundles" / "v8-induction-and-events.zip") as z:
            self.assertEqual({x["path"] for x in manifest["effects"]}, set(z.namelist()))
            for name in z.namelist():
                with z.open(name) as f, wave.open(f, "rb") as sound:
                    self.assertEqual((sound.getnchannels(), sound.getsampwidth(), sound.getframerate()), (2,2,48000))
                    count += 1
        self.assertEqual(85, count)

    def test_install_dry_run_and_selection(self):
        with tempfile.TemporaryDirectory() as d:
            out = Path(d) / "detail"
            result = installer.install(out, ["v8_ls_race_cam"], False, dry_run=True)
            self.assertEqual(36, result["wav_count"])
            self.assertFalse(out.exists())
            result = installer.install(out, ["v8_ls_race_cam"], True)
            self.assertEqual(49, result["wav_count"])
            self.assertTrue((out / "engines/v8_ls_race_cam/interior/1400_exhaust_on.wav").is_file())
            self.assertEqual(49, installer.install(out, ["v8_ls_race_cam"], True)["wav_count"])
            installer.install(out, ["v8_coyote_dohc"], False)
            installed = json.loads((out / "manifest.json").read_text())
            self.assertEqual(2, len(installed["engines"]))
            self.assertEqual(13, len(installed["effects"]))

    def test_refuses_conflicts(self):
        with tempfile.TemporaryDirectory() as d:
            out = Path(d)
            installer.install(out, ["v8_coyote_dohc"], False)
            wav = out / "engines/v8_coyote_dohc/exterior/900_exhaust_on.wav"
            wav.write_bytes(b"corrupted")
            with self.assertRaisesRegex(ValueError, "Conflicting audio"):
                installer.install(out, ["v8_coyote_dohc"], False)
