---
name: project-onboarding
description: Use when safely adding per-game AI instructions and a documented project knowledge index without destroying existing files.
---

# Project onboarding

1. Inspect the game's existing `AGENTS.md`, source tree, engine/runtime and tests; don't assume an empty repo.
2. From a local Game-Dev-Toolkit checkout, review `templates/project/README.md`.
3. Preview `python3 tools/scaffold_project_knowledge.py --project-root <path> --name "<game>" --engine godot --dry-run` (or `web`/`other`).
4. Run without dry-run only after checking paths. Never overwrite an existing `AGENTS.md` or project notes; integrate routing manually if skipped.
5. Map real scenes/scripts, entrypoints, saves, dependencies, asset source and CI into the project docs. Use verified paths and links.
6. Record incomplete knowledge as unverified, not as an implemented feature.
7. Do not copy the entire central vault into each game; fetch only the shared pages relevant to a task.
8. Update the target game's latest handoff with checks actually run and next work.

**Completion gate:** navigable game-local index, existing instructions preserved, evidence-backed architecture and actionable handoff.
