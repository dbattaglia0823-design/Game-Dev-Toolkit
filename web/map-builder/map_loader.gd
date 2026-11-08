extends Node2D
## Game Development Toolkit top-down map adapter for Godot 4.3+.
## Attach to a Node2D, set map_path, or call load_from_file(path).
## Draws embedded PNG/JPEG/WebP atlases without changing existing game saves.
## Collision uses horizontal runs of StaticBody2D rectangle shapes.
class_name GDTTopDownMap

@export_file("*.json") var map_path: String = ""
@export_flags_2d_physics var blocking_layer: int = 1
@export var create_collision: bool = true

var map_data: Dictionary = {}
var _textures: Dictionary = {}
var _collision_body: StaticBody2D

func _ready() -> void:
    if map_path != "":
        load_from_file(map_path)

func load_from_file(path: String) -> bool:
    if not FileAccess.file_exists(path):
        push_error("Map not found: " + path)
        return false
    return load_from_json(FileAccess.get_file_as_string(path))

func load_from_json(source: String) -> bool:
    var parsed: Variant = JSON.parse_string(source)
    if typeof(parsed) != TYPE_DICTIONARY:
        push_error("Map JSON must be an object")
        return false
    if parsed.get("format", "") != "gdt.topdown-map" or parsed.get("version", 0) != 1:
        push_error("Unsupported map format/version")
        return false
    var width: int = int(parsed.get("width", 0))
    var height: int = int(parsed.get("height", 0))
    var tile_size: int = int(parsed.get("tileSize", 0))
    if width < 1 or width > 128 or height < 1 or height > 128 or tile_size < 8 or tile_size > 64:
        push_error("Invalid map dimensions")
        return false
    var textures: Dictionary = {}
    for atlas in parsed.get("tilesets", []):
        if typeof(atlas) != TYPE_DICTIONARY:
            return false
        var src: String = str(atlas.get("src", ""))
        if not src.begins_with("data:image/"):
            push_error("Export a Godot package to embed all atlas images")
            return false
        var comma: int = src.find(",")
        if comma < 0:
            return false
        var header: String = src.substr(0, comma)
        var bytes: PackedByteArray = Marshalls.base64_to_raw(src.substr(comma + 1))
        var img: Image = Image.new()
        var status: Error = ERR_FILE_UNRECOGNIZED
        if header.begins_with("data:image/png"):
            status = img.load_png_from_buffer(bytes)
        elif header.begins_with("data:image/jpeg"):
            status = img.load_jpg_from_buffer(bytes)
        elif header.begins_with("data:image/webp"):
            status = img.load_webp_from_buffer(bytes)
        if status != OK:
            push_error("Could not decode atlas: " + str(atlas.get("name", "")))
            return false
        img.convert(Image.FORMAT_RGBA8)
        textures[str(atlas.get("id", ""))] = ImageTexture.create_from_image(img)
    map_data = parsed
    _textures = textures
    _rebuild_collision()
    queue_redraw()
    return true

func _draw() -> void:
    if map_data.is_empty():
        return
    var width: int = int(map_data["width"])
    var size: int = int(map_data["tileSize"])
    var atlases: Dictionary = {}
    for atlas in map_data.get("tilesets", []):
        atlases[str(atlas.get("id", ""))] = atlas
    for layer in map_data.get("layers", []):
        if not layer.get("visible", true):
            continue
        var opacity: float = clampf(float(layer.get("opacity", 1.0)), 0.0, 1.0)
        var cells: Array = layer.get("tiles", [])
        for i in range(cells.size()):
            var cell: Variant = cells[i]
            if typeof(cell) != TYPE_DICTIONARY:
                continue
            var sheet_id: String = str(cell.get("set", ""))
            if not _textures.has(sheet_id) or not atlases.has(sheet_id):
                continue
            var atlas: Dictionary = atlases[sheet_id]
            var cols: int = int(atlas.get("width", 0)) / size
            if cols <= 0:
                continue
            var index: int = int(cell.get("index", -1))
            if index < 0:
                continue
            var source_rect := Rect2(Vector2(index % cols, index / cols) * size, Vector2.ONE * size)
            var target_rect := Rect2(Vector2(i % width, i / width) * size, Vector2.ONE * size)
            draw_texture_rect_region(_textures[sheet_id], target_rect, source_rect, Color(1, 1, 1, opacity))

func get_map_size_cells() -> Vector2i:
    return Vector2i(int(map_data.get("width", 0)), int(map_data.get("height", 0)))

func world_to_cell(world_position: Vector2) -> Vector2i:
    var size: int = maxi(1, int(map_data.get("tileSize", 32)))
    return Vector2i(floori(world_position.x / size), floori(world_position.y / size))

func cell_to_local_center(cell: Vector2i) -> Vector2:
    var size: int = int(map_data.get("tileSize", 32))
    return (Vector2(cell) + Vector2(0.5, 0.5)) * size

func is_blocked(cell: Vector2i) -> bool:
    var w: int = int(map_data.get("width", 0))
    var h: int = int(map_data.get("height", 0))
    if cell.x < 0 or cell.y < 0 or cell.x >= w or cell.y >= h:
        return true
    var grid: Array = map_data.get("collision", [])
    var index: int = cell.y * w + cell.x
    return index >= grid.size() or int(grid[index]) != 0

func get_markers(marker_type: String = "") -> Array:
    var result: Array = []
    for marker in map_data.get("objects", []):
        if marker_type == "" or str(marker.get("type", "")) == marker_type:
            result.append(marker.duplicate(true))
    return result

func marker_position(marker: Dictionary) -> Vector2:
    return cell_to_local_center(Vector2i(int(marker.get("x", 0)), int(marker.get("y", 0))))

func _rebuild_collision() -> void:
    if is_instance_valid(_collision_body):
        _collision_body.queue_free()
    _collision_body = null
    if not create_collision or map_data.is_empty():
        return
    var width: int = int(map_data.get("width", 0))
    var height: int = int(map_data.get("height", 0))
    var size: int = int(map_data.get("tileSize", 32))
    var grid: Array = map_data.get("collision", [])
    if grid.size() != width * height:
        return
    _collision_body = StaticBody2D.new()
    _collision_body.name = "MapBlocking"
    _collision_body.collision_layer = blocking_layer
    _collision_body.collision_mask = 0
    add_child(_collision_body)
    for y in range(height):
        var x: int = 0
        while x < width:
            if int(grid[y * width + x]) == 0:
                x += 1
                continue
            var start: int = x
            while x < width and int(grid[y * width + x]) != 0:
                x += 1
            var run: int = x - start
            var rectangle := RectangleShape2D.new()
            rectangle.size = Vector2(run * size, size)
            var shape := CollisionShape2D.new()
            shape.shape = rectangle
            shape.position = Vector2((start + run / 2.0) * size, (y + 0.5) * size)
            _collision_body.add_child(shape)
