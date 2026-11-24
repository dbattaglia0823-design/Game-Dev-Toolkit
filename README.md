# Game Development Toolkit

Reusable foundations for Godot 4 and browser games, including a function-first UI layout system, runtime adapters, a visual component showcase, tested web utilities and a Godot demonstration. The toolkit is not a full game engine.

## Shared knowledge hub and Codex workflows

The toolkit also maintains a **GitHub-hosted Markdown knowledge vault** at [knowledge/INDEX.md](knowledge/INDEX.md), reusable task-specific Codex skills at [`.agents/skills/`](.agents/skills/), and safe per-game starters in [`templates/project/`](templates/project/). These are additions to the existing UI, world, audio and runtime modules, not replacements.

- **Shared across games:** Godot/web engineering standards, test procedures, curated references and workflows.
- **Each game owns:** its code, design decisions, architecture, known defects and recent handoff in its own repository.
- **Agent usage:** read the small index, retrieve only relevant pages, inspect actual code and tests, then record verified changes.
- **Optional:** open `knowledge/` as an Obsidian vault. No plugin, MCP or external database is necessary.

To initialize a game's missing documentation without overwriting existing files, run `python3 tools/scaffold_project_knowledge.py --project-root /path/to/game --name "Game Name" --engine godot --dry-run`, review the plan, then rerun without `--dry-run`. See [onboarding instructions](templates/project/README.md).

### Project coverage and consolidation

The [cross-project directory](knowledge/projects/INDEX.md) links to each game's authoritative documentation and marks gaps separately from fully integrated work. Crownfall's onboarding is tracked as a pending PR until merged. The central vault never copies per-game mechanics, and local-only projects are not treated as connected.

Audit project-inventory metadata with `python3 tools/audit_project_knowledge.py`, or check actual docs in local clones with `python3 tools/audit_project_knowledge.py --checkouts-root /path/to/repos`. Toolkit CI validates inventory metadata, **not** the current state of independent repositories. See [knowledge maintenance policy](knowledge/workflows/maintenance.md).

### Install selected shared skills in a game checkout

Codex needs access to skill files inside its workspace. Install **only** the skills relevant to a project; copying everything increases maintenance and context noise.

    python3 tools/install_project_skills.py --list
    python3 tools/install_project_skills.py --project-root /path/to/game --skills godot-change-verification knowledge-maintenance --dry-run
    python3 tools/install_project_skills.py --project-root /path/to/game --skills godot-change-verification knowledge-maintenance

Existing skill files are never overwritten; a conflict requires manual review. Run again with `--verify` to detect missing or diverged snapshots. These are copies, not automatically synced updates. See [project onboarding](templates/project/README.md).

Validate the central vault's internal Markdown links and skill metadata with `python3 tools/check_knowledge_links.py`.

### Measure context and token usage

A controlled before/after benchmark is available in [knowledge/measurements/README.md](knowledge/measurements/README.md). Record real paired Codex task metrics using the [empty CSV template](knowledge/measurements/sessions.csv), then run `python3 tools/benchmark_knowledge_usage.py --input <measured.csv>`. The report compares only successful task pairs and never fabricates token savings. The project starter includes a review checklist for verified documentation updates.

## Open the toolkit

Visit the [GitHub Pages Tool Hub](index.html) to launch every browser-based builder, exporter, validator and demonstration from one main menu. The homepage includes quick access to the 2D Map Builder and Functional UI Builder, category navigation and tool search. Pages must publish from the repository root so `index.html` is the landing page; browser-saved work stays local unless exported.

## Functional UI Builder (recommended)

Use the [Functional UI Builder](web/builder/index.html) to design **control placement, semantics, actions and data bindings** without dictating artwork or game-specific mechanics. Export a version 2 `*.layout.json` plus `*.contract.json`, then give both to Codex for the target game.

Built-in functional presets: main menu, pause menu, inventory, upgrades, shop, settings and HUD. Runtime adapters are provided for [web](web/layout-kit/runtime.js) and [Godot 4](godot/layout-kit/ui_layout.gd). See the [layout contract](docs/UI_TEMPLATE_CONTRACT.md) and [Codex integration guide](docs/CODEX_UI_INTEGRATION.md).

The previous visual editor remains available as [Legacy Visual Studio](web/builder/legacy-studio.html) for old version 1 layout JSON files. Existing visual-only layouts are not silently converted into action-bearing templates.

## World Forge — Continuous Racing World Builder

Use [World Forge](web/map-builder/index.html) to create detailed, **non-tile-based** top-down open worlds with curved spline roads, shoulder/lanes/surfaces, freeform cities, forests, mountains, sand, beaches, oceans, scenery and gameplay markers. Adjust individual spline points, scatter vegetation, import custom PNG/WebP scenery sprites, edit biomes, and export versioned world JSON, a PNG preview or a Godot 4 ZIP with continuous road geometry and marker data. See the [World Forge guide](web/map-builder/README.md) and [Godot world adapter](godot/world-kit/README.md).

The [Legacy Tile Map Builder](web/map-builder/legacy.html) preserves all previous tile editing, maps and browser storage. World Forge version 2 geometry is intentionally distinct from old version 1 tile maps; no automatic conversion or game-save migration is performed.

## Phase 1: Integration validation

Open the [Integration Validator](web/validator/index.html) to check exported layouts against schema rules, action-handler mappings, sample data bindings, off-canvas controls and accessible target sizes. The report distinguishes structural validity from actual target-game readiness.

Automated checks cover Node unit tests, Chromium desktop/mobile smoke tests and a Godot 4 headless adapter fixture. See [validation instructions](docs/VALIDATION.md) for limits and status.

## Multiple menu layouts — 57 choices

Choose among **three distinct compositions for each of 19 menu types**, with layouts for main/pause menus, inventory, equipment, shop, settings, HUD, skill trees, crafting, quests, garage, dealership, race selection and more. Browse by **menu type** in the [Template Library](web/catalog/index.html), switch variants above the preview, then export to the builder, validator or Codex integration ZIP. All variants preserve action/data contracts and let Codex customize visuals. See [menu variants guide](docs/MENU_VARIANTS.md).

## Connected skill-tree editing

The [Functional UI Builder](web/builder/index.html?preset=skill-tree) supports **circle/rounded/rectangular buttons** and **two-click node connections**. Lines follow moved or resized buttons, survive saved JSON, and render in the Web and Godot adapters. These express UI relationships, not gameplay prerequisites. See [skill tree connections](docs/SKILL_TREE_CONNECTIONS.md).

## Phase 4 — One-click integration packages

Use the [Integration Package Builder](web/package/index.html) to select templates, choose **Web** or **Godot 4**, and download a ZIP with the layouts, action/data contracts, validation reports, engine adapters, and a Codex handoff guide. Import a custom edited layout or send the current builder screen directly. [Export and integration instructions](docs/INTEGRATION_PACKAGES.md).

## Phase 3 — Expanded Functional Template Library

The [template catalog](web/catalog/index.html) includes **19 reusable structural layouts**: character stats, crafting, skill trees, quest logs, career events, leaderboards, garages, dealerships, race selection, and earlier main menu/inventory/settings/shop layouts. Preview, filter, export, and open a template directly in the builder or validator. See [template contracts](docs/TEMPLATE_LIBRARY.md).

## Phase 2 — Reusable UI behaviors

Functional templates can now use standalone [search/selection, equipment, navigation, and confirmation controllers](docs/BEHAVIORS.md). The [interactive behavior demonstration](web/layout-kit/behaviors-demo/index.html) exercises these workflows. The toolkit defines **where controls go and how UI interactions are routed**, while the consuming game owns gameplay rules, real inventory changes, purchases and visuals.

## Game menu templates

Explore the [interactive menu templates](web/menu-demo/index.html) for main menu, pause, settings, gameplay and game-over screens. Reuse the [menu state controller](web/ui/game-menu-controller.js) without coupling to the mock gameplay timer. See [integration notes](web/menu-demo/README.md).

## Visual UI showcase

Open [the browser-based component gallery](web/showcase/index.html) to preview reusable buttons, navigation, dialogs, inventory layouts, upgrade cards and HUD patterns. See [showcase documentation](web/showcase/README.md) for browser testing and optional GitHub Pages setup. Inventory, upgrades and HUD are illustrative UI demos, not production game mechanics.

## Start here

- **Web:** open `web/demo/index.html` in a browser; run `cd web && npm test` (Node 20+).
- **Godot:** import `godot/demo/project.godot` in Godot 4.3+ and run the project. Core scripts are in `godot/core/` and UI scripts in `godot/ui/`.
- **Existing game:** choose one module, read its documentation, copy it into the correct engine, and run a compatibility check. Do not replace save formats or working systems blindly.

## Included

| Module | Platform | Purpose |
|---|---|---|
| ConfigStore | Web | Validated settings persisted in storage with in-memory fallback |
| SaveStore | Web | Versioned JSON save with backups and migration hook |
| ToastManager | Web | Single visible accessible notification with automatic expiry |
| Theme | Web | Dark glass visual tokens, responsive UI example |
| SettingsStore | Godot | ConfigFile settings with defaults |
| SaveStore | Godot | Versioned JSON save with backup and migration hook |
| ToastManager | Godot | Single visible message label (no stacked notifications) |
| Functional UI Layout Kit | Web / Godot | Semantic layout templates, data binding and action events |
| Functional UI Builder | Web | Arrange and export version 2 layouts and action contracts |

## Design rules

1. Keep UI themes independent from game state and mechanics.
2. Maintain stable public interfaces and configuration options.
3. Declare engine version, dependencies and manual/automated tests for each module.
4. Treat game save migrations as high risk; back up before replacement.
5. Reuse only compatible components; do not pull the whole toolkit into every game.

See [integration guide](docs/INTEGRATION.md), [module catalog](docs/MODULES.md), and [agent instructions](AGENTS.md).

## Published editor

The browser editor is served from `web/builder/index.html` by GitHub Pages. Browser-local saves are not automatically committed to the repository; export JSON for use in existing projects. The old appearance-focused editor is kept at `web/builder/legacy-studio.html`.
