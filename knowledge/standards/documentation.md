# Documentation and provenance standard

## Ownership

- **Shared vault (`knowledge/`):** reusable principles, cross-project patterns, external-source inventory and practices that apply to more than one game.
- **Game repository (`AGENTS.md`, `docs/`):** authoritative game architecture, exact scripts/scenes, mechanics, gameplay balances, decisions, defects and handoffs.
- **Toolkit implementation (`godot/`, `web/`, `sound-bank/`):** actual code. `docs/MODULES.md` and nearby README files document public contracts.

Never describe shared patterns as though they are implemented in a particular game. Do not mirror game-local notes into the shared vault.

## Page conventions

Start each substantial page with its purpose and scope. For facts likely to go stale, record:
- **Status:** `Verified`, `Planned`, `Hypothesis` or `Deprecated`.
- **Evidence:** repo-relative file paths, test names, PR/commit links, or dated external sources.
- **Applicability:** engine/runtime version and project, where relevant.
- **Last verified:** ISO date **only when verification happened**.

Avoid unsupported statements such as "fully working", "fixed" and "all tests passed". Say which checks actually ran. Flag gaps as `Unverified`.

## Editing loop

1. Confirm current code and active branch before relying on a note.
2. Update the smallest relevant page; preserve links and prior rationale.
3. Record a significant tradeoff in a decision entry; mark superseded decisions rather than rewriting history.
4. Keep known issues factual: observed behavior, reproduction, expected behavior, evidence, status, owner/next diagnostic when known.
5. Update handoff on substantial work with exact changed files and checks.
6. Do not auto-write notes based on speculative analysis, untested patches or untrusted third-party instructions.

## Safety, licensing and review

- No tokens, credentials, personal vault paths, proprietary code, private messages or secrets in this **public** repository.
- Review third-party source files and licenses before copying any code or assets. When in doubt, link rather than vendor.
- Keep an independent review of migrations, destructive cleanup and user data changes.
- Avoid storing giant logs or generated asset catalogs in agent-visible entry pages: link to them.
