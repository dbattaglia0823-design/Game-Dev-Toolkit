# Godot 4 Freeform Racing World Adapter

Attach world_loader.gd to a Node2D in Godot 4.3+ and set world_path to a World Forge version 2 JSON file (or call load_world(path) directly). Open [the browser editor](../../web/map-builder/index.html) for authored roads, scenery and biomes.

The loader reads **gdt.racing-world version 2**; the original tile map adapter (godot/map-kit/map_loader.gd) continues to handle **gdt.topdown-map version 1** separately.

- Draws continuous roads with smooth sampled splines, shoulders, center markings and road edges; it does not construct a TileMapLayer.
- Draws stylized region polygons (forest, mountain, rock, sand, water, city) and simplified top-down scenery.
- Builds StaticBody2D blocking polygons for ocean/lake regions and rectangle collision shapes for trees, rocks, buildings and barriers. Set blocking_layer and vehicle collision masks in the consuming game.
- get_markers(type) returns independent gameplay markers with properties; marker_position(marker) returns continuous Vector2 coordinates.
- get_road_paths() returns sampled road centerlines, width, lanes, and material. road_near(point) returns a road dictionary if on-road. get_surface_at(point) prefers road surfaces, then biome regions.
- The ZIP includes a separate navigation JSON with road centerlines and intersection/endpoint hints for your AI systems.

There is no vehicle controller, traffic planner, accurate bridge/overpass height, navigation pathfinder, procedural 3D terrain, animated sprites or region streaming. Elevation values in regions are metadata only. Curved road continuity is visual/semantic and needs game-side collision, AI, and race waypoint testing.

CI runs godot/tests/racing_world_smoke.gd on Godot 4.4.1 to verify world loading, sampled paths, markers, biome queries and blocking shapes.
