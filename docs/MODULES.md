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
