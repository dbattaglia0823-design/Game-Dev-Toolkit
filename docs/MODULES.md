# Component catalog (v0.1.0)

| Path | Runtime | Requirements | Validation |
|---|---|---|---|
| `web/core/config-store.js` | ES modules | Browser storage optional | Node unit tests |
| `web/core/save-store.js` | ES modules | Browser storage optional | Node unit tests |
| `web/ui/toast-manager.js` | Browser ES module | DOM | Browser demo |
| `web/ui/theme.css` | Browser CSS | CSS modern browsers | Browser demo |
| `godot/core/settings_store.gd` | Godot 4 | `ConfigFile` | Manual Godot demo |
| `godot/core/save_store.gd` | Godot 4 | `FileAccess`, JSON | Manual Godot demo |
| `godot/ui/toast_manager.gd` | Godot 4 | `CanvasLayer` and `Label` | Manual Godot demo |

**Status:** Web core utilities are unit-tested; browser UI and Godot modules require target-runtime smoke testing. Do not assume Godot headless validation has occurred.

Next modules (not implemented): input abstraction, audio manager, HUD, upgrade graph, inventory, and engine-specific gameplay systems. Add after concrete game integration requirements are known.
