# Component catalog (v0.2.0 in development)

| Path | Runtime | Requirements | Validation |
|---|---|---|---|
| `web/core/config-store.js` | ES modules | Browser storage optional | Node unit tests |
| `web/core/save-store.js` | ES modules | Browser storage optional | Node unit tests |
| `web/ui/toast-manager.js` | Browser ES module | DOM | Browser demo |
| `web/ui/dialog.js` | Browser ES module | Native HTML dialog | Node controller tests; browser smoke test pending |
| `web/ui/tabs.js` | Browser ES module | DOM, ARIA tab markup | Node controller tests; browser smoke test pending |
| `web/ui/theme.css` | Browser CSS | Modern browsers | Browser demo |
| `godot/core/settings_store.gd` | Godot 4 | `ConfigFile` | Manual Godot demo |
| `godot/core/save_store.gd` | Godot 4 | `FileAccess`, JSON | Manual Godot demo |
| `godot/ui/toast_manager.gd` | Godot 4 | `CanvasLayer` and `Label` | Manual Godot demo |

### Web dialogs
Add a native `<dialog aria-labelledby="some-title">`, a close button with `data-gdt-close`, then instantiate `new DialogController(dialogElement)`. Native browser behavior handles focus trapping and Escape; dispose event listeners with `destroy()`.

### Web tabs
Within a root element, create matching ordered `[role=tab]` buttons and `[role=tabpanel]` sections with unique `id` values and paired `aria-controls` / `aria-labelledby` attributes. Instantiate `new TabsController(root)`. Arrow keys, Home and End navigate; `select(index)` changes the active panel. Dispose with `destroy()`.

| `web/showcase/index.html` | Browser preview | Modern DOM + ES modules | Manual browser test pending |
| `web/showcase/demo-data.js` | Node/browser ES module | No runtime dependencies | Node unit tests |

**Status:** Web core utilities and controller logic have Node unit tests. Browser UI and Godot modules still require target-runtime smoke testing. No claims of mobile or Godot validation until tested.

Next: responsive navigation, HUD, inventory and upgrade components, plus equivalent Godot UI where game requirements warrant.

| `web/ui/game-menu-controller.js` | Node/browser ES module | None | Node state transition tests |
| `web/menu-demo/` | Browser menu template | DOM, CSS, ConfigStore | Manual browser smoke test pending |

Menu controller emits validated transitions; actual games must connect pause and resume to their game-loop state. See `web/menu-demo/README.md`.

## Visual UI builder

| Path | Runtime | Purpose | Validation |
|---|---|---|---|
| `web/builder/model.js` | Browser/Node ES module | Versioned layout documents and templates | Node unit tests |
| `web/builder/index.html` | Browser | Interactive visual layout editor | Manual browser testing pending |

Builder exports validated JSON layouts, not executable games or Godot scenes. See `web/builder/README.md`.

## World Forge v2 — Freeform racing-world authoring

| Path | Runtime | Purpose | Validation |
|---|---|---|---|
| `web/map-builder/world-model.js` | Node / Web | Versioned continuous worlds; splines, biome polygons, scenery, markers; strict validation | Node tests |
| `web/map-builder/world-geometry.js` | Node / Web | Spline sampling, road connections, geometry hit-testing, scattering | Node tests |
| `web/map-builder/world-renderer.js` | Browser Canvas | Original stylized terrain, curved roads, buildings and vegetation | Desktop/mobile browser smoke |
| `web/map-builder/world-editor.js` | Browser | World Forge interactive editor, inspector, history and exports | Desktop/mobile browser smoke |
| `web/map-builder/world-export.js` | Node / Web | Sampled road-network metadata and Godot 4 ZIP | Node tests |
| `godot/world-kit/world_loader.gd` | Godot 4 | Continuous runtime render, surface queries and blocking geometry | Godot 4.4 headless smoke |

World Forge v2 is non-tile-based and independent of UI schemas and game saves. The legacy v1 tile authoring files below remain supported from web/map-builder/legacy.html.

## Legacy v1 tile map editor

| Path | Runtime | Purpose | Validation |
|---|---|---|---|
| `web/map-builder/model.js` | Web / Node ES module | Versioned tile map, painting, collision, markers and import validation | Node unit tests |
| `web/map-builder/starter-tiles.js` | Browser Canvas | Generated original 32-tile starter atlas | Browser smoke |
| `web/map-builder/export.js` | Web / Node ES module | Portable JSON data and Godot ZIP packaging | Node unit tests |
| `web/map-builder/editor.js` | Browser Canvas | Painting tools, pan/zoom, history, palette and inspector | Desktop/mobile browser smoke |
| `godot/map-kit/map_loader.gd` | Godot 4 | Runtime textured map renderer, static collision and marker queries | Target-game integration required |

See `web/map-builder/README.md` and `godot/map-kit/README.md`. The map schema is independent of the version 2 functional UI layout contract and of game saves.

## UI Studio v2 modules

- `web/builder/studio.js`: editor history, premade asset library, additional screen presets, layer ordering and movement helpers (unit-tested).
- `web/builder/exporters.js`: static standalone HTML and Godot 4 Control scene export generators (output-format unit-tested, target runtime smoke testing pending).
- `web/builder/editor.js`: interactive canvas, resize handle, alignment guides, layer controls and keyboard shortcuts (browser smoke testing pending).

## Functional UI Layout Kit (version 2)

| Path | Purpose | Test status |
|---|---|---|
| `web/layout-kit/schema.js` | Strict semantic UI layout contract and manifest | Node unit tests |
| `web/layout-kit/presets.js` | Seven game-agnostic screen templates | Node unit tests |
| `web/layout-kit/runtime.js` | Browser data binding + named action dispatch | Browser example; smoke test pending |
| `web/layout-kit/runtime.css` | Optional neutral preview styling | Browser example; smoke test pending |
| `web/builder/wireframe.js` | Browser functional layout editor | Browser smoke test pending |
| `godot/layout-kit/ui_layout.gd` | Godot 4 nodes, bindings and action signals | Godot runtime smoke test pending |

See `docs/UI_TEMPLATE_CONTRACT.md` and `docs/CODEX_UI_INTEGRATION.md`. The legacy `web/builder/legacy-studio.html` preserves earlier appearance-first v1 layouts.

## Phase 1 Validation

- `web/layout-kit/validator.js`: raw layout diagnostics, missing handler/data checks, viewport/touch target warnings.
- `web/validator/`: browser-based diagnostics/report export.
- `web/e2e/smoke.mjs`: desktop 2560×1440 and mobile 390×844 headless Chromium validation.
- `godot/tests/integration_smoke.gd`: Godot 4 headless fixture and action/binding tests.

## Phase 2 — Functional UI Behaviors

- `web/layout-kit/behaviors.js`: framework-free searchable collection, stable selection, equipment display slots, history and confirmation queue.
- `web/layout-kit/workflow.js`: action routing between layout runtime and host game.
- `web/layout-kit/confirmation-dialog.js`: optional accessible native browser dialog adapter.
- `web/layout-kit/behaviors-demo/`: working functional reference screen.
- `godot/layout-kit/ui_behaviors.gd`: equivalent Godot 4 headless UI behaviors.
- `web/layout-kit/presets.js`: equipment, searchable list and confirmation presets.

See `docs/BEHAVIORS.md` for integration boundaries and action conventions.

## Phase 3 — Functional Screen Templates

- `web/layout-kit/phase3-presets.js`: nine new theme-free RPG, economy, racing and progression layouts.
- `web/layout-kit/catalog.js`: categorized template metadata and discovery.
- `web/layout-kit/sample-data.js`: neutral data previews for every template, no game state.
- `web/catalog/`: searchable catalog, live bindings and action preview, direct builder and validator links.
- `web/tests/phase3-templates.test.js`: schema, contract, layout geometry, neutral sample binding and completeness tests.

See `docs/TEMPLATE_LIBRARY.md` for action/binding mappings and handoff instructions.

## Phase 4 — Integration Packages

- `web/package/index.html` and `package-ui.js`: multiselect presets, custom layout import, target engine options and browser download.
- `web/package/package-builder.js`: tested packaging, validation, contract and Codex guide generation, dependency inclusion.
- `web/package/zip.js`: no-dependency ZIP store writer with CRC32 and path validation.
- `web/tests/package-builder.test.js`: archive integrity, runtime source, engine options and invalid input.

See `docs/INTEGRATION_PACKAGES.md`.

## Skill tree geometry (v2)

- `web/layout-kit/connections.js`: circle/rectangle link endpoint geometry.
- `web/layout-kit/schema.js`: shape and optional connection graph persistence.
- `web/builder/wireframe.js`: two-click node connections, live redraw, delete/undo/redo.
- `web/layout-kit/runtime.js`: SVG connections and button shape metadata.
- `godot/layout-kit/ui_layout.gd`: Line2D connections and StyleBoxFlat circle/rounded buttons.

See `docs/SKILL_TREE_CONNECTIONS.md`.

## Menu layout variants (57 layouts)

- `web/layout-kit/variant-presets.js`: two purposefully rearranged functional compositions per original UI menu type, with original contracts preserved.
- `web/layout-kit/variant-options.js`: editor and validator variant selectors.
- `web/layout-kit/catalog.js`: family-aware catalog metadata, filters and variant labels.
- `web/tests/menu-variants.test.js`: 57-layout structural, contract and persistence checks.

See `docs/MENU_VARIANTS.md`.


## Vehicle Sound Bank (phase 1)

| Path | Runtime | Purpose | Validation |
|---|---|---|---|
| sound-bank/catalog.json | Data | 118 vehicle profiles + 27 family audio designs | Python unit tests |
| sound-bank/modifiers.json | Data | Camshaft, exhaust, intake, boost and induction options | Source review |
| sound-bank/build_bank.py | Python 3 stdlib | Generated WAV stems; optionally import REDLINE's synthesized bank | Python unit tests |
| sound-bank/previews/ | Original WAV | 16 reference auditions (not OEM recordings) | WAV format |
| godot/audio/vehicle_sound_bank.gd | Godot 4 | Profile and RPM-layer audio mix recipe | In-game validation pending |

See [Vehicle Sound Bank](../sound-bank/README.md) for generation, integration and recording-licensing constraints.

## Installable V8 Performance Sound Pack

| Path | Runtime | Purpose | Validation |
|---|---|---|---|
| sound-bank/packs/v8-performance-v1/bundles/ | Stored original WAV archives | 12 V8 banks, 144 RPM-layer stems, 18 effects | CRC and PCM tests |
| sound-bank/install_pack.py | Python stdlib | Extract selected WAVs and merge target game's sound index | Python tests |
| sound-bank/packs/v8-performance-v1/render.mjs | Node 20+ | Reproducible original engine/effect waveform source | Node tests |
| sound-bank/packs/v8-performance-v1/build_archives.mjs | Node 20+ | Regenerate versioned ZIP sound assets | Node tests |
| godot/audio/vehicle_sound_player.gd | Godot 4 | Cached in-game RPM crossfades and boost/shift events | Headless smoke tests |

See [V8 pack integration](../sound-bank/packs/v8-performance-v1/README.md). Fully reusable source and binary assets; original synthesis, not OEM recordings. Install only the needed engines into the target game.
