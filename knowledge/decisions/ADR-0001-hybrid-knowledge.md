# ADR-0001: Hybrid shared and game-local knowledge

- **Status:** Accepted for toolkit structure
- **Date:** 2026-11-18
- **Scope:** Game-Dev-Toolkit documentation and reusable agent workflows

## Context

Multiple games share tools and engineering practices, but their scripts, mechanics and decisions differ. A single giant vault leads to stale duplicates and large context loads; project-only notes duplicate reusable research.

## Decision

1. Store the **shared** cross-project vault as Markdown under `knowledge/` in Game-Dev-Toolkit.
2. Keep each game's **source of truth** in that game's own repository: `AGENTS.md` and `docs/` (architecture, decisions, known issues, handoff).
3. Ship project templates and an opt-in scaffold script; never overwrite existing files.
4. Store reusable Codex skills under `.agents/skills/`, with short metadata and narrowly scoped workflows.
5. Keep Obsidian and local MCP optional. Hosted agents need explicit access to shared repo content; links are not mounts.
6. Update only verified facts after implementation and validate documentation/tooling with CI.

## Consequences

- Less accidental cross-game context mixing and easier Git review.
- The same Markdown works with GitHub and Obsidian without plugin lock-in.
- Central updates are **not** automatically synchronized to a game; consumers must read the current shared source.
- Token reductions are hypotheses until compared across similar tasks; selective retrieval is required.
