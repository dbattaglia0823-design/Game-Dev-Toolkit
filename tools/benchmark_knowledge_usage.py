#!/usr/bin/env python3
"""Compare measured Codex task runs, paired by task, without inventing token usage."""
from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path
from statistics import median

REQUIRED = ("task_id", "variant", "input_tokens", "output_tokens", "tool_calls", "elapsed_seconds", "success")
COUNTS = ("input_tokens", "output_tokens", "tool_calls")
METRICS = ("total_tokens", "tool_calls", "elapsed_seconds")


def parse_rows(path: Path) -> dict[str, dict[str, dict]]:
    if not path.is_file():
        raise ValueError(f"Missing CSV file: {path}")
    result: dict[str, dict[str, dict]] = {}
    with path.open(encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        if not reader.fieldnames or any(field not in reader.fieldnames for field in REQUIRED):
            raise ValueError(f"CSV requires columns: {', '.join(REQUIRED)}")
        for line, row in enumerate(reader, 2):
            if not row["task_id"] or row["variant"] not in ("baseline", "knowledge"):
                raise ValueError(f"line {line}: need task_id and variant baseline/knowledge")
            task_id = row["task_id"].strip()
            if not task_id:
                raise ValueError(f"line {line}: blank task_id")
            variant = row["variant"]
            if variant in result.get(task_id, {}):
                raise ValueError(f"line {line}: duplicate task_id/variant: {task_id}/{variant}")
            try:
                amounts = {field: int(row[field]) for field in COUNTS}
                elapsed = float(row["elapsed_seconds"])
            except (ValueError, TypeError, KeyError) as exc:
                raise ValueError(f"line {line}: invalid numeric measurements") from exc
            if min(amounts.values()) < 0 or not (0 < elapsed < float("inf")):
                raise ValueError(f"line {line}: counts must be nonnegative, elapsed_seconds finite and positive")
            success = row["success"].strip().lower()
            if success not in ("true", "false"):
                raise ValueError(f"line {line}: success must be true or false")
            result.setdefault(task_id, {})[variant] = {
                **amounts, "total_tokens": amounts["input_tokens"] + amounts["output_tokens"],
                "elapsed_seconds": elapsed, "success": success == "true",
            }
    return result


def evaluate(rows: dict[str, dict[str, dict]]) -> dict:
    paired = {key: variants for key, variants in rows.items()
              if "baseline" in variants and "knowledge" in variants}
    missing = sorted(key for key in rows if key not in paired)
    if not paired:
        raise ValueError("No paired baseline/knowledge tasks found; no savings can be calculated")
    details = []
    for task_id, variants in sorted(paired.items()):
        before, after = variants["baseline"], variants["knowledge"]
        details.append({
            "task_id": task_id,
            "baseline": before,
            "knowledge": after,
            "quality_maintained": bool(before["success"] and after["success"]),
            "metric_deltas": {
                field: after[field] - before[field] for field in METRICS
            },
        })
    completed_both = [x for x in details if x["quality_maintained"]]
    summary = {}
    for metric in METRICS:
        baseline_med = median(x["baseline"][metric] for x in completed_both) if completed_both else None
        knowledge_med = median(x["knowledge"][metric] for x in completed_both) if completed_both else None
        summary[metric] = {
            "baseline_median": baseline_med,
            "knowledge_median": knowledge_med,
            "relative_change_percent": round((knowledge_med - baseline_med) / baseline_med * 100, 2)
            if baseline_med is not None and baseline_med > 0 else None,
        }
    return {
        "paired_tasks": len(paired),
        "both_succeeded": len(completed_both),
        "baseline_successes": sum(x["baseline"]["success"] for x in details),
        "knowledge_successes": sum(x["knowledge"]["success"] for x in details),
        "unpaired_tasks": missing,
        "exploratory_only": len(completed_both) < 5,
        "summary_for_successful_pairs_only": summary,
        "tasks": details,
    }


def markdown(report: dict) -> str:
    lines = [
        "# Knowledge-hub usage benchmark",
        "",
        f"Paired task runs: **{report['paired_tasks']}**; both successful: **{report['both_succeeded']}**.",
        f"Baseline successes: {report['baseline_successes']}; knowledge successes: {report['knowledge_successes']}.",
        "",
    ]
    if report["exploratory_only"]:
        lines.append("**Exploratory only:** fewer than five successful task pairs; avoid general token-saving claims.")
        lines.append("")
    lines += ["| Metric | Baseline median | Knowledge median | Relative change |", "|---|---:|---:|---:|"]
    for key, label in (("total_tokens", "Total tokens"), ("tool_calls", "Tool calls"), ("elapsed_seconds", "Elapsed seconds")):
        row = report["summary_for_successful_pairs_only"][key]
        change = row["relative_change_percent"]
        lines.append(f"| {label} | {row['baseline_median'] if row['baseline_median'] is not None else 'n/a'} | {row['knowledge_median'] if row['knowledge_median'] is not None else 'n/a'} | {str(change)+'%' if change is not None else 'n/a'} |")
    lines.append("")
    lines.append("Changes are observational only. Test success, tool availability, cache state, model settings and task difficulty must be controlled.")
    if report["unpaired_tasks"]:
        lines.append("Unpaired tasks omitted from comparison: " + ", ".join(report["unpaired_tasks"]))
    return "\n".join(lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, required=True, help="CSV with real Codex usage data")
    parser.add_argument("--report", type=Path, help="Optional Markdown report output")
    parser.add_argument("--json", type=Path, help="Optional JSON report output")
    args = parser.parse_args()
    try:
        report = evaluate(parse_rows(args.input))
    except ValueError as error:
        parser.error(str(error))
    result = markdown(report)
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(result, encoding="utf-8")
    else:
        print(result, end="")
    if args.json:
        args.json.parent.mkdir(parents=True, exist_ok=True)
        args.json.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
