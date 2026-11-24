# Project knowledge directory

**Scope:** repositories owned by `dbattaglia0823-design` inspected on **2026-11-24**. This is a **navigation and coverage inventory**, not a duplicate archive of the games, not a game-feature tracker and not proof of a passing runtime check. Machine-readable status: [registry.json](registry.json).

| Project | Authoritative project docs | Status at audit | Runtime |
|---|---|---|---|
| [REDLINE](https://github.com/dbattaglia0823-design/Redline) | [docs/INDEX.md](https://github.com/dbattaglia0823-design/Redline/blob/main/docs/INDEX.md) | On `main` | Godot 4.6.3 |
| [Streetbound](https://github.com/dbattaglia0823-design/Streetbound) | [docs/INDEX.md](https://github.com/dbattaglia0823-design/Streetbound/blob/main/docs/INDEX.md) | On `main` | Godot 4.6.3 |
| [Cyber Idle](https://github.com/dbattaglia0823-design/Cyber-Idle) | [docs/INDEX.md](https://github.com/dbattaglia0823-design/Cyber-Idle/blob/main/docs/INDEX.md) | On `main` | React/TypeScript/Vite |
| [Crownfall AutoBattler](https://github.com/dbattaglia0823-design/Crownfall_AutoBattler) | [Onboarding PR #1](https://github.com/dbattaglia0823-design/Crownfall_AutoBattler/pull/1) | **Pending review/merge**, not on `main` at audit | Browser/PWA/Electron |

For each project, first read its own `AGENTS.md`, `docs/INDEX.md`, then a task-specific note and the actual code/tests. Reusable patterns live in this toolkit; mechanics, recent changes and decisions stay in the game repository.

## Unlinked or out-of-scope work

- **ZED ZONE ModKit:** Known local modding project; no accessible repository among the connected GitHub repositories. **Documentation coverage and runtime state are unverified.** Do not invent an integration or copy private logs. If added to an accessible repo later, give it its own docs and link it here.
- **Other personal/local tools (for example the Outlook broadcast helper):** Not part of this public game-development inventory. Keep private work notes, broadcast addresses, credentials and organization-specific data outside this public toolkit.

## Audit and maintenance

- The registry records paths verified in a GitHub tree survey, **not** exhaustive correctness, successful builds, CI status, or automatic Obsidian synchronization.
- `coverage: present_on_main` means expected documentation entrypoints were found on the specified repo `main` snapshot. `pending_pr` means the docs are proposed, not installed on `main`.
- After merging a project onboarding PR, change `pending_pr` to `present_on_main` only after fetching the new `main` tree. Update `baseline_sha` and `last_checked` on a real audit, never by assumption.
- Run `python3 tools/audit_project_knowledge.py` to validate the registry itself. Run `python3 tools/audit_project_knowledge.py --checkouts-root /path/to/repos` to check project entrypoints in local checked-out repositories. The toolkit CI checks **metadata only**; it cannot automatically read every other repo's latest content.
- See [knowledge maintenance](../workflows/maintenance.md) for a small, evidence-based recurring workflow. Only add a new shared skill/tool for a demonstrated recurring need.
