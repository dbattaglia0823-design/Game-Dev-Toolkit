# Visual UI Studio v2

Open [Visual UI Builder](index.html), or use `/web/builder/index.html` on the project's GitHub Pages site.

## Design tools

- Drag components to move them; drag the blue bottom-right handle to resize.
- Snap to a 10-unit grid (toggleable) and see vertical/horizontal center alignment guides near other objects.
- **Layers** inspector shows elements from front to back. Use Bring forward / Send backward to change draw order.
- **Undo/Redo** buttons or Ctrl/Cmd+Z and Ctrl/Cmd+Y; Shift+Ctrl/Cmd+Z redoes.
- **Copy/Paste** buttons or Ctrl/Cmd+C / Ctrl/Cmd+V while the canvas (not a text field) has focus.
- Arrow keys nudge a selected element one unit; Shift+arrow nudges ten.
- Select assets from the premade palette: glass and dark panels, primary/secondary buttons, headers, navigation backgrounds, Unicode icons, progress, and artwork placeholders.
- Background presets: six customizable solid-color schemes.
- Whole-screen presets: Blank, Main Menu, Game HUD, Inventory, Upgrades, Shop, and Settings.
- Work on 800×500 design coordinates; preview scales to available monitor size without changing export positions.

## Save and export

**Save in browser** stores the current design in browser-local storage. **Export JSON** produces the full editable document (schema version 1); **Import JSON** restores an editable document.

**Export Web HTML** produces a standalone HTML file containing visual layout, text, panels, styled buttons, a progress bar, and placeholders, with embedded CSS. Buttons have no event handlers: connect real game actions in the consuming game. The exported layout scales below 800px width.

**Export Godot Scene** produces a Godot 4 `.tscn` scene with a root `Control`, static `Panel`, `Button`, `Label`, `ColorRect`, and `ProgressBar` nodes and inlined `StyleBoxFlat` resources. Import the scene into your Godot project, then wire signals, responsive anchors, game logic and fonts as needed. Generated images are placeholders, and some CSS effects are not transferable automatically. The Godot exporter requires an actual Godot runtime smoke test before it should be treated as production-ready.

## Important limitations

- This is a visual UI layout editor, not a full game maker. It does not export behavioral logic or assets.
- Existing JSON version 1 layouts remain compatible.
- No external image uploads, full constraint-based responsive layout, arbitrary fonts, user-created reusable collections, or animation timeline yet.
- Snap currently uses the grid; alignment guides are visual aids, not magnetic object snapping.
- Premade backgrounds are solid-color presets, not raster artwork.
- Editor clipboard is internal to the browser page, not system-wide.
- Exported web UI is an independent fixed-coordinate screen, not a complete website or CSS component framework.

## Validation

Run `cd web && npm test`. Automated tests cover history, screen templates, ordering, JSON model and exporter output shape. They do not prove browser drag/resize correctness or parsing inside Godot. Before shipping a game, smoke-test the exported files in the actual browser/device and Godot version.
