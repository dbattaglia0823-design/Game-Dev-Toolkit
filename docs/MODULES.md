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
