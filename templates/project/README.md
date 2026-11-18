# Per-game knowledge starter

These Markdown files are starter templates, not a game, addon, database or replacement for existing instructions.

From a local Game-Dev-Toolkit checkout, first preview:

    python3 tools/scaffold_project_knowledge.py --project-root /path/to/game --name "My Game" --engine godot --dry-run

Then rerun without `--dry-run` after checking the target path. Use `--engine web` for browser games, `--engine other` otherwise.

The script creates **missing** Markdown files only, never overwrites existing project documentation. Run it against your local game checkout and review the new files before committing them to the game's repository.

If `AGENTS.md` already exists, it is intentionally skipped. Incorporate any useful routing guidance into the original by hand. Generated files are unverified placeholders; map the actual code, engine version, CI, save schemas and assets before treating them as documentation of a working feature.

Expected project structure:

    AGENTS.md
    docs/
      INDEX.md
      OVERVIEW.md
      ARCHITECTURE.md
      ASSETS.md
      TESTING.md
      DECISIONS.md
      KNOWN_ISSUES.md
      WORK_LOG.md
      HANDOFF.md

Shared technical practices live in [the central knowledge vault](../../knowledge/INDEX.md), not duplicated in each game. Hosted Codex must have explicit access to the toolkit repo for those files; a link alone is not a file mount.
