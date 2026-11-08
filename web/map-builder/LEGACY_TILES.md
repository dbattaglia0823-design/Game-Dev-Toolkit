# Legacy Tile Map Builder (v1)

Open [legacy.html](legacy.html) through the toolkit's GitHub Pages site or a local HTTP server (ES modules need HTTP). This is a **separate tile-map and level-data editor**, not part of the functional UI layout builder.

## Included

- Orthogonal tile maps up to 128×128 cells, using a configurable 16/32/48/64px grid (8–64px is supported by JSON).
- A generated, original 32-tile starter atlas and PNG/JPEG/WebP sprite-sheet import (grid-aligned images, up to 512 tiles/atlas).
- Ordered layers with visibility, locks, names, opacity and reordering.
- Brush, erase, contiguous flood fill, line, rectangle, tile eyedropper and camera pan/zoom.
- Independent blocked/walkable collision grid, with a live red collision overlay.
- Object/gameplay marker placement, drag-to-move, deletion, JSON properties and common types (player/enemy spawn, exit, NPC, trigger, loot).
- History with one undo operation per stroke, redo and a 35-step bound.
- Autosave/recovery and explicit local Save/Load; portable standalone JSON, flattened PNG preview and Godot 4 integration ZIP.

The included example illustrates how tiles, blockers and markers coexist. Exporting a PNG creates an **image**, not a playable level. Exported JSON and ZIP include the generated starter artwork as embedded PNG data; they don't depend on external tileset URLs.

## Quick start

1. Open the editor. Explore **Forest crossing**, then choose **New map** for a blank level.
2. Use the left panel to select a tile and a tile layer, paint in the center, and create terrain layers as needed.
3. Use **Block** and **Unblock** to define physics-obstacle cells independently of artwork.
4. Choose **Marker** to place spawns, exits, items, NPCs or triggers. Add game-specific metadata in the inspector's JSON properties.
5. Save locally for editing sessions; download **Map JSON** for source control. Use **Godot 4 ZIP** for a ready-to-copy adapter and instructions.

Keyboard shortcuts: B brush, E erase, F fill, L line, R rectangle, I picker, C block, X unblock, O marker, H pan, Space/middle-button drag pan, wheel zoom, Ctrl/Cmd+Z undo and Ctrl/Cmd+Y or Shift+Z redo. Right-click picks a tile. Delete removes a selected marker when focus isn't in a text input.

## Data contract

The editor uses \`format: "gdt.topdown-map"\` and \`version: 1\`. The file contains width/height/tileSize, embedded tilesets with integer atlas indices, ordered tile layers with row-major \`tiles\` arrays, a separate row-major 0/1 \`collision\` array, and an \`objects\` list of IDs, cell coordinates, type, name and JSON properties.

JSON import validates bounds, identifiers, tile references, image media types and total counts. It does not modify functional UI layout documents or existing game save files. Maps are browser-local unless you download the JSON or ZIP; they are **not committed to GitHub automatically**.

## Godot 4 usage

The ZIP includes \`maps/<name>.map.json\`, \`runtime/map_loader.gd\`, \`manifest.json\` and \`CODEX_IMPORT.md\`. Attach the loader to a Node2D, set \`map_path\` to the map JSON, and connect player/AI/NPC code to the markers and collision queries. The renderer draws texture regions and builds horizontal runs of rectangle collision shapes. It does not generate a TileMapLayer scene, navigation regions, animated tiles, lighting, scripts for markers, or game logic.

Tests: \`cd web && npm test\`; browser smoke checks run for desktop/mobile via \`web/e2e/smoke.mjs\` in CI. Test in your actual game and device before relying on collisions or marker behavior.
