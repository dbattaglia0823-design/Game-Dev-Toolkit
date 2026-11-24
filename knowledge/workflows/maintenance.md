# Knowledge maintenance and consolidation

**Purpose:** keep small, trustworthy notes instead of growing a second archive of game history.

## Ownership

1. **Game repository** owns source, `AGENTS.md`, `docs/INDEX.md`, architecture, decisions, reproducible issues and a concise `docs/HANDOFF.md`.
2. **Shared toolkit** owns reusable engineering standards, narrow agent skills, onboarding templates, module contracts and [project navigation/coverage](../projects/INDEX.md).
3. **Public GitHub** is not the place for private local Obsidian plugins, customer/agency information, secrets, player saves or proprietary modding logs.

## Development and documentation gate

At every substantial implementation PR, an agent or reviewer should:
- Read the current game's index and actual changed code; identify the authoritative note for the subsystem.
- Run relevant commands/tests and record exact evidence. Do not confuse static checks, unit tests, CI, visual validation, device testing and playable functionality.
- Update **only affected** architecture or system docs, plus the concise latest handoff. Record decisions when a tradeoff changed; list only reproduced defects as issues.
- If no docs need changes, record why in the PR. Avoid transcript dumps and daily notes without consequences.
- Store reusable techniques centrally **only after** they recur or clearly generalize, with links back to evidence. Do not copy entire project docs or agent skills into the shared vault.

## Periodic audit

Monthly or after major project changes:
1. Run `python3 tools/check_knowledge_links.py` and `python3 tools/audit_project_knowledge.py` in the toolkit.
2. With the project checkouts available, run `python3 tools/audit_project_knowledge.py --checkouts-root /path/to/repos --max-age-days 45` and review findings. Age is a **review prompt**, not proof of a stale feature or defect.
3. In each active project, compare handoff/index against current code, pending PRs and real CI. Update the inventory's SHA and audit date only after verification.
4. Verify optional installed skill snapshots against the toolkit; copying a skill is not an automatic update.
5. Keep performance claims grounded: [usage measurements](../measurements/README.md) require real comparable paired sessions, not invented results.

**Stop rule:** When every accessible game has a routing index, a current actionable handoff and an evidence-driven review loop, stop expanding the knowledge infrastructure. Add functionality only when needed by actual work.
