import importlib.util
import json
import tempfile
import unittest
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("vehicle_bank_builder", ROOT / "build_bank.py")
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)

class VehicleSoundBankTests(unittest.TestCase):
    def test_catalog(self):
        catalog = json.loads((ROOT / "catalog.json").read_text(encoding="utf-8"))
        vehicles = catalog["vehicles"]
        self.assertEqual(118, len(vehicles))
        self.assertEqual(30, sum(v["source"] == "Redline" for v in vehicles.values()))
        self.assertEqual(88, sum(v["source"] == "Streetbound" for v in vehicles.values()))
        self.assertEqual(27, len(catalog["families"]))
        for vehicle in vehicles.values():
            self.assertIn(vehicle["family"], catalog["families"])

    def test_wav_pcm_and_loop_seam(self):
        rpm, samples = builder.render_loop("v8_cross", 900, "exhaust_on", 8, 0.6, 0.8)
        self.assertLess(abs(rpm - 900), 1.0)
        self.assertGreater(len(samples), 10000)
        self.assertLess(abs(samples[0] - samples[-1]), 0.2)
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "example.wav"
            builder.save_wav(p, samples)
            with wave.open(str(p), "rb") as wav:
                self.assertEqual((wav.getnchannels(), wav.getsampwidth(), wav.getframerate()), (1, 2, 22050))
                self.assertGreater(wav.getnframes(), 10000)

    def test_export_index(self):
        with tempfile.TemporaryDirectory() as tmp:
            self.assertEqual(0, builder.main(["--out", tmp, "--family", "i4_turbo", "--rpm", "900"]))
            bank = json.loads((Path(tmp) / "bank.json").read_text())
            self.assertEqual(1, len(bank["families"]))
            self.assertEqual(18, len(bank["effects"]))
            row = bank["families"]["i4_turbo"][0]
            self.assertEqual(set(builder.LAYERS), set(row["files"]))
            self.assertTrue((Path(tmp) / "effects" / "bov_vent.wav").is_file())

if __name__ == "__main__":
    unittest.main()
