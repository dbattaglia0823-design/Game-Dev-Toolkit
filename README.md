# Game Development Toolkit

Reusable foundations for Godot 4 and browser games, including a function-first UI layout system, runtime adapters, a visual component showcase, tested web utilities and a Godot demonstration. The toolkit is not a full game engine.

## Functional UI Builder (recommended)

Use the [Functional UI Builder](web/builder/index.html) to design **control placement, semantics, actions and data bindings** without dictating artwork or game-specific mechanics. Export a version 2 `*.layout.json` plus `*.contract.json`, then give both to Codex for the target game.

Built-in functional presets: main menu, pause menu, inventory, upgrades, shop, settings and HUD. Runtime adapters are provided for [web](web/layout-kit/runtime.js) and [Godot 4](godot/layout-kit/ui_layout.gd). See the [layout contract](docs/UI_TEMPLATE_CONTRACT.md) and [Codex integration guide](docs/CODEX_UI_INTEGRATION.md).

The previous visual editor remains available as [Legacy Visual Studio](web/builder/legacy-studio.html) for old version 1 layout JSON files. Existing visual-only layouts are not silently converted into action-bearing templates.

## 2D Top-Down Map Builder

Use the [2D Map Builder](web/map-builder/index.html) to paint tile-based worlds for top-down games. It includes a starter pixel-art atlas, custom sprite-sheet import, ordered tile layers, collision painting, gameplay markers, undo/redo, zoom/pan, local saves and portable JSON/PNG/Godot 4 ZIP export. Maps are distinct from functional UI layouts and game saves. See the [map editor guide](web/map-builder/README.md) and [Godot map loader](godot/map-kit/README.md).

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
