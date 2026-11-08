# World Forge — Freeform 2D Open-World Map Builder

Open [World Forge](index.html) from the Toolkit GitHub Pages homepage. This is a continuous world geometry editor for top-down racing games, **not a tile editor**. For existing version 1 maps, use the [Legacy Tile Editor](legacy.html); old saves and files remain independent.

The visual direction uses an original illustrated top-down style. WORKS: Motorsport Factory is a general perspective and legibility reference, not an asset source. No copyrighted assets or game data were reused.

## Features

- **Spline road drawing:** Click centerline points, finish the road, then select and drag its handles to create smooth curves. City roads, highways, country lanes, mountain passes, circuits and service roads, with asphalt, racing asphalt, concrete, dirt and gravel. Set continuous world-unit road width, 1–6 lanes, shoulders and lane markings. Join road endpoints by clicking near existing endpoints.
- **Freeform biomes:** Draw and reshape polygon terrain regions: grass, forests, mountains, rock, beaches, ocean, lakes, cities, desert and farmland. Overlap regions and adjust their ordering.
- **Scenery:** Place trees, conifers, palms, bushes, rocks, houses, office buildings, warehouses, racing garages, fuel stations, signs, parking areas, barriers, streetlights and docks. Import your own top-down PNG/WebP scenery sprites (up to 950 KB each) and attach them to individual objects as an artwork override; images are embedded in the world JSON and Godot ZIP. Scatter vegetation inside selected land regions while avoiding roads.
- **Gameplay markers:** Player/traffic spawns, race starts, checkpoints, finish, garage, dealership, fuel, mission and fast-travel points, with editable JSON properties.
- **Editing and navigation:** Select any existing road and use **Insert on curve**, **Extend start**, or **Extend end** to add road control points. Shift-click directly on a selected curve or double-click near it, drag control handles, edit point X/Y numerically, or Alt-drag to move an entire road or terrain shape. Duplicate and nudge placed scenery, terrain, roads and markers; rotate and resize scenery; edit marker properties, entity draw order and visibility. Includes pan/zoom, minimap, undo/redo and browser-local recovery.
- **Continuous scenery painting:** Enable **Hold and drag to scatter** under Scenery to paint while holding the left mouse button, even when stationary. Adjust brush radius, density, spacing, random size/rotation, road avoidance and water avoidance. Enable **Erase scenery with brush** to remove nearby objects. An entire press-and-drag stroke is one undo step; canceled strokes are restored.
- **Export:** World JSON, flattened PNG preview, and Godot 4 ZIP including the vector world loader, road centerlines and junction hints, marker metadata and integration guide.

The included Coastal Ridge example has a city, forests, mountains, lake, sand and ocean, winding road networks, buildings, nature and race markers.

## Draw a road

1. Choose **Draw road (R)**, road class, surface, width, lane count and shoulder.
2. Click to create the centerline. Add points around bends. Click near existing road endpoints to snap.
3. Press **Enter**, double-click, right-click or **Finish shape** to save.
4. Switch to **Select (V)** and click an existing road or select it in the Entities list. Click **+ Insert on curve** in the Inspector, then click anywhere along that road's visible centerline to add a point. Alternatively Shift-click the selected road, or double-click the curve. The new point is selected automatically.
5. To extend an existing road without creating a disconnected road, use **Extend start** or **Extend end** in the Inspector and click the new endpoint. Drag handles or edit their X/Y numbers; choose **Remove point** to simplify a curve.
6. Use Alt-drag to move an entire selected road or terrain shape without changing its geometry. Duplicate creates a separate editable copy; Move/Nudge buttons adjust its world position.
7. Edit width, material, lanes, shoulder, curve smoothing and markings on the right-side inspector.

For a coast, choose **Terrain (T)** and Beach or Ocean, click the polygon boundary, then press Enter. Select the resulting region and drag its outline to refine the shoreline. Use **Scatter selected region** to populate land with biome-appropriate trees/rocks/palms. Roads and polygon shapes are based on floating-point world coordinates; there is no snapped grid.

Keyboard: V select, R road, T terrain, P scenery, M marker, H pan, Enter finish, Esc cancel, Delete remove selected, Shift-click selected road to insert a point, Alt-drag selected shape to move it, Space or middle-button drag pan, mouse wheel zoom, Ctrl/Cmd+D duplicate, Ctrl/Cmd+Z undo, Ctrl/Cmd+Y or Ctrl/Cmd+Shift+Z redo.

## Versioned world data

World Forge exports JSON with format name **gdt.racing-world**, version **2**. It contains world dimensions and seed, then arrays of roads (control points and material), regions (polygon points, biome, elevation), props (positions, rotation and scale) and markers (positions and JSON properties). There are no tilesets, tile indices or cell grids in version 2.

Limits: 600–24,000 world units per axis, 180 roads with up to 100 points each, 220 regions, 4,000 props, 400 markers, and an 8 MB import size. Invalid and old-format imports are rejected instead of silently migrated. Separate browser storage keys protect old map saves. Always export a portable JSON backup; saving in the browser does not commit changes to GitHub.

## Godot 4 integration

The exported ZIP contains editable world JSON, a sampled road-centerline network with junction hints, a GDScript Node2D runtime adapter, a manifest and CODEX_IMPORT.md. The loader draws stylized freeform terrain, roads and props, builds collision for bodies of water and solid scenery, and supports marker, road-path and terrain-surface queries.

This is a **level authoring tool**, not a full game engine. The consuming game must implement vehicle physics, traffic routing, race progression, streaming/chunk loading, proper production sprites/3D assets, animation, elevation geometry and advanced intersections. Height values are metadata, not an actual elevation mesh. Sampled road junctions are hints for an AI routing implementation, not a solved navigation network. Keep map geometry separate from player save files.

## Verification

Run npm test from web/ for model/schema/export tests. CI runs browser smoke tests at desktop/mobile sizes and a Godot 4.4 headless loader fixture. Test the exported world inside your target racing game before shipping.

See also [Godot world loader](../../godot/world-kit/README.md) and [Legacy tile map guide](LEGACY_TILES.md).
