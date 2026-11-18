# Context and token budget

**Goal:** reduce repeated discovery and context volume without hiding necessary evidence. A Markdown vault does not make tokens free: each file an agent reads still enters its context.

## Retrieval protocol

1. Read the project's `AGENTS.md` and one small `docs/INDEX.md` page.
2. Identify the exact system affected and retrieve its one or two notes.
3. Inspect real source code and tests; use narrow searches rather than dumping entire folders.
4. Bring in one relevant shared standard or skill only if needed.
5. Summarize verified findings in the project handoff; link to long logs and artifacts rather than pasting them.
6. Stop retrieving when the task is grounded. Do not read every note as a ritual.

## Keep files targeted

- Index pages: routes and one-sentence summaries, not copied documentation.
- Architecture pages: component-to-path mappings and contracts, not huge source excerpts.
- Handoffs: most recent actionable context; archive or trim obsolete details.
- Skills: a narrow trigger, a reproducible workflow and validation gates, with links to deeper references.
- Shared knowledge: reusable guidance, not all project facts.

## How to measure

For similar tasks record: start state, tool calls, input/output tokens **when exposed by the platform**, elapsed active time, files inspected, tests executed and successful completion. Compare comparable tasks before/after. Do not invent savings percentages or imply these notes automatically synchronize to every Codex environment.

Hosted agents must be given explicit access to the toolkit repo or a synced copy. A GitHub URL in `AGENTS.md` is a pointer, not a guarantee the agent fetched it.
