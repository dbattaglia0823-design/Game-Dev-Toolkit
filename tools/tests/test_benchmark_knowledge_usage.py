"""Quality-aware paired context benchmark regression tests."""
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

from tools.benchmark_knowledge_usage import parse_rows, evaluate, markdown

HEADER = "task_id,variant,input_tokens,output_tokens,tool_calls,elapsed_seconds,success\n"


class BenchmarkTests(unittest.TestCase):
    def _parse(self, text):
        with TemporaryDirectory() as folder:
            path = Path(folder) / "runs.csv"
            path.write_text(text, encoding="utf-8")
            return parse_rows(path)

    def test_paired_metrics_and_quality(self):
        rows = self._parse(HEADER +
            "task-a,baseline,1000,200,10,60,true\n"
            "task-a,knowledge,700,180,7,40,true\n"
            "task-b,baseline,900,100,5,40,true\n"
            "task-b,knowledge,750,120,4,34,false\n")
        report = evaluate(rows)
        self.assertEqual(report["paired_tasks"], 2)
        self.assertEqual(report["both_succeeded"], 1)
        self.assertEqual(report["knowledge_successes"], 1)
        self.assertEqual(report["summary_for_successful_pairs_only"]["total_tokens"]["relative_change_percent"], -26.67)
        self.assertIn("Exploratory", markdown(report))

    def test_unpaired_tasks_excluded(self):
        rows = self._parse(HEADER +
            "task-a,baseline,100,25,3,8,true\n"
            "task-a,knowledge,100,25,3,8,true\n"
            "task-b,baseline,100,25,3,8,true\n")
        report = evaluate(rows)
        self.assertEqual(report["unpaired_tasks"], ["task-b"])

    def test_rejects_fake_or_invalid_measurements(self):
        for value in (
            "a,baseline,-1,20,1,2,true\n",
            "a,baseline,1,20,1,0,true\n",
            "a,baseline,1,20,1,2,maybe\n",
            "a,baseline,1,20,1,inf,true\n",
        ):
            with self.subTest(value=value):
                with self.assertRaises(ValueError):
                    self._parse(HEADER + value)

    def test_rejects_duplicates_and_unpaired_only(self):
        with self.assertRaises(ValueError):
            self._parse(HEADER + "a,baseline,1,1,1,1,true\n" + "a,baseline,1,1,1,1,true\n")
        with self.assertRaises(ValueError):
            evaluate(self._parse(HEADER + "a,baseline,1,1,1,1,true\n"))


if __name__ == "__main__":
    unittest.main()
