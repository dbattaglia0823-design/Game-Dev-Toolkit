# Development task lifecycle

Adapted from documentation-first game vaults and Codex development playbooks, without copying their code.

1. **Scope:** restate the request in a testable way; identify target game/engine, touched systems and acceptance criteria. For clear tasks, act without unnecessary questions.
2. **Discover:** read game `AGENTS.md`, `docs/INDEX.md` and the specific system note. Inspect code, tests, recent changes and open PRs. Search shared knowledge only for reusable techniques.
3. **Plan:** identify the minimal safe change, dependencies, high-risk migrations and verification commands. Preserve existing systems where possible.
4. **Implement:** change code and tests on a reviewable branch. Don't overwrite unrelated project work or import unreviewed external scripts.
5. **Verify:** run available checks and describe both passing and missing evidence; test player-visible behavior where possible.
6. **Document:** update architecture/decisions/issues only with verified facts; create a concise handoff referencing paths, commits, tests and next work.
7. **Deliver:** link the PR, note failed or unrun checks, and distinguish code complete from merged/deployed.

**Where to store learnings:** a cross-project technique goes in this toolkit; a game's exact wiring and balance stay in that game's own docs. Avoid appending a transcript to the central vault.
