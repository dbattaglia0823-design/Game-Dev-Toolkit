# Measure knowledge-hub effectiveness

**Status:** Measurement protocol; no before/after runs collected yet and no established token/time savings.

## Run controlled pairs

Compare the **same task** at an equivalent starting commit, with comparable model, reasoning effort, tool permissions, tests and cache conditions.

1. **Baseline:** normal access to source code without the new knowledge index or selected skills.
2. **Knowledge:** same source access plus project index, selected Codex skills and targeted shared vault retrieval.
3. Use separate disposable branches or worktrees; measure success with the same actual acceptance checks, not only a model's prose.

## Required measurements

Only enter **real numbers** from the Codex UI, API or other trustworthy telemetry. If token metrics are unavailable, do not guess them.

| CSV column | Meaning |
|---|---|
| task_id | Same identifier for an equivalent paired task |
| variant | baseline or knowledge |
| input_tokens | Measured input tokens, consistent accounting between variants |
| output_tokens | Measured output tokens |
| tool_calls | Actual agent tool call count |
| elapsed_seconds | Actual task time in seconds |
| success | true only when acceptance criteria and tests were met |

The intentionally empty [sessions.csv](sessions.csv) is just a header. Add actual paired measurements in your local/private copy, then run:

    python3 tools/benchmark_knowledge_usage.py --input knowledge/measurements/sessions.csv --report /tmp/knowledge-benchmark.md --json /tmp/knowledge-benchmark.json

The script refuses incomplete pairs, separately counts task failures, and reports median token/tool/time differences only for pairs where both versions succeeded. Fewer than five successful pairs are labelled exploratory.

**Suggested task mix:** Godot racing AI, wheel/hub alignment, game UI, React crafting queues, and cross-project onboarding. Repeat runs when possible. A faster but incorrect run does not count as an optimization.

## Maintenance and security

Do not commit raw Codex transcripts, private file paths, secret values, or sensitive usage logs to this public repo. The benchmark can be run locally against private observations. Models and context accounting can change, so never claim persistent savings without reproducible measurements.
