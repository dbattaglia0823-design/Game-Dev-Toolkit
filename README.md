# Game Development Toolkit

Reusable, engine-specific foundations for Godot 4 and browser games. **Version 0.1.0** is deliberately small: functioning web utilities, a browser demo, and documented Godot scripts with demo scene. It is not a universal game engine.

## Visual UI builder

Use the [browser-based UI builder](web/builder/index.html) to assemble layouts from preset panels, buttons, text, image placeholders and progress bars. Customize each item and export a portable JSON layout. See [builder documentation](web/builder/README.md). This is a layout editor; engine-specific conversion is planned, not yet implemented.

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

## Design rules

1. Keep UI themes independent from game state and mechanics.
2. Maintain stable public interfaces and configuration options.
3. Declare engine version, dependencies and manual/automated tests for each module.
4. Treat game save migrations as high risk; back up before replacement.
5. Reuse only compatible components; do not pull the whole toolkit into every game.

See [integration guide](docs/INTEGRATION.md), [module catalog](docs/MODULES.md), and [agent instructions](AGENTS.md).

## Publishing

Create an empty repository on GitHub, then upload the contents of this folder (not the ZIP itself). Optional: mark your separate starter-game repositories as GitHub templates. This toolkit can be private.
