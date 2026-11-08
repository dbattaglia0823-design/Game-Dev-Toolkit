# Godot 4 Top-Down Map Loader

This standalone runtime adapter loads version 1 \`gdt.topdown-map\` JSON produced by \`web/map-builder/\`. It does not depend on other toolkit modules. Godot 4.3+ is recommended.

Copy \`map_loader.gd\` and the editor's exported \`*.map.json\` into \`res://\`. Attach \`map_loader.gd\` to a Node2D and set \`map_path\`. You can also call \`load_from_file("res://maps/level.map.json")\`.

The loader renders all visible tile layers in their file order using texture regions. It decodes embedded PNG/JPEG/WebP atlases (including the exported starter atlas), creates a StaticBody2D with horizontal rectangle runs for blocked cells, and exposes \`is_blocked(Vector2i)\`, \`world_to_cell(Vector2)\`, \`cell_to_local_center(Vector2i)\`, \`get_markers(type)\` and \`marker_position(marker)\`. The default blocking physics layer is 1; configure the player collision mask accordingly.

Markers are metadata, not automatic NPCs, exits, spawning or triggers. Implement marker behavior in the target game. Map data is independent of save data. No automatic navigation mesh, animation, occlusion, tile collision geometry beyond blocked cells, or seamless streaming is included.

Use **Godot 4 ZIP** in the browser editor for the self-contained map and precise integration instructions. Raw map JSON exported by the editor is also portable. This adapter is distinct from \`godot/layout-kit/ui_layout.gd\`, which handles functional UI layouts.
