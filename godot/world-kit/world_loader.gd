extends Node2D
## GDT World Forge v2: runtime renderer and geometry reader for freeform racing worlds.
## Attach to Node2D, set world_path, or call load_world(path) directly.
## This does NOT spawn cars, compute traffic AI, or generate a 3D elevation mesh.
class_name GDTRacingWorld

@export_file("*.json") var world_path: String = ""
@export_flags_2d_physics var blocking_layer: int = 1
@export var build_collision: bool = true
@export var draw_markers: bool = false

var world_data: Dictionary = {}
var _solid_body: StaticBody2D
var _road_cache: Dictionary = {}

const BIOME_COLORS = {
    "grass": Color("#728e61"), "forest": Color("#456d50"), "mountain": Color("#838578"),
    "rock": Color("#9e9580"), "beach": Color("#d9c28d"), "ocean": Color("#417f9a"),
    "lake": Color("#5b9aa9"), "city": Color("#95958b"),
    "desert": Color("#bd9e71"), "farmland": Color("#9b9d68")
}
const ROAD_COLORS = {
    "asphalt": Color("#3d4550"), "concrete": Color("#777a7c"), "dirt": Color("#a18359"),
    "gravel": Color("#888476"), "track": Color("#4b505a")
}

func _ready() -> void:
    if world_path != "":
        load_world(world_path)

func load_world(path: String) -> bool:
    if not FileAccess.file_exists(path):
        push_error("World file does not exist: " + path)
        return false
    return load_world_json(FileAccess.get_file_as_string(path))

func load_world_json(source: String) -> bool:
    var decoded: Variant = JSON.parse_string(source)
    if typeof(decoded) != TYPE_DICTIONARY:
        push_error("Racing world must be a JSON object")
        return false
    if decoded.get("format", "") != "gdt.racing-world" or int(decoded.get("version", -1)) != 2:
        push_error("Unsupported racing world format; the v1 tile loader is separate")
        return false
    if typeof(decoded.get("world", null)) != TYPE_DICTIONARY:
        return false
    var info: Dictionary = decoded["world"]
    var w: int = int(info.get("width", 0))
    var h: int = int(info.get("height", 0))
    if w < 600 or h < 600 or w > 24000 or h > 24000:
        push_error("World bounds are invalid")
        return false
    for key in ["roads", "regions", "props", "markers"]:
        if typeof(decoded.get(key, null)) != TYPE_ARRAY:
            return false
    world_data = decoded
    _road_cache.clear()
    for road in world_data.get("roads", []):
        if typeof(road) != TYPE_DICTIONARY:
            continue
        var data: Dictionary = road
        _road_cache[str(data.get("id", ""))] = _sample_path(data.get("points", []), bool(data.get("smooth", true)))
    _build_blockers()
    queue_redraw()
    return true

func get_world_size() -> Vector2:
    if world_data.is_empty():
        return Vector2.ZERO
    var world: Dictionary = world_data["world"]
    return Vector2(float(world["width"]), float(world["height"]))

func get_markers(marker_type: String = "") -> Array:
    var results: Array = []
    for entry in world_data.get("markers", []):
        if marker_type == "" or str(entry.get("type", "")) == marker_type:
            results.append(entry.duplicate(true))
    return results

func marker_position(marker: Dictionary) -> Vector2:
    return Vector2(float(marker.get("x", 0)), float(marker.get("y", 0)))

func get_road_paths() -> Array:
    var result: Array = []
    for road in world_data.get("roads", []):
        var id: String = str(road.get("id", ""))
        result.append({"id": id, "surface": road.get("surface", "asphalt"),
            "roadClass": road.get("roadClass", "city"), "width": road.get("width", 36),
            "lanes": road.get("lanes", 2), "points": _road_cache.get(id, PackedVector2Array())})
    return result

func road_near(position: Vector2) -> Dictionary:
    var roads: Array = world_data.get("roads", [])
    for i in range(roads.size() - 1, -1, -1):
        var road: Dictionary = roads[i]
        var path: PackedVector2Array = _road_cache.get(str(road.get("id", "")), PackedVector2Array())
        var width: float = float(road.get("width", 0))
        for j in range(1, path.size()):
            var nearest: Vector2 = Geometry2D.get_closest_point_to_segment(position, path[j - 1], path[j])
            if nearest.distance_to(position) <= width * 0.5:
                return road.duplicate(true)
    return {}

func get_surface_at(position: Vector2) -> String:
    var near: Dictionary = road_near(position)
    if not near.is_empty():
        return str(near.get("surface", "asphalt"))
    var regions: Array = world_data.get("regions", [])
    for i in range(regions.size() - 1, -1, -1):
        var region: Dictionary = regions[i]
        if Geometry2D.is_point_in_polygon(position, _make_polygon(region.get("points", []))):
            return str(region.get("biome", "grass"))
    if world_data.is_empty():
        return "grass"
    return str((world_data["world"] as Dictionary).get("base", "grass"))

func _make_polygon(points: Array) -> PackedVector2Array:
    var packed := PackedVector2Array()
    for entry in points:
        packed.append(Vector2(float(entry.get("x", 0)), float(entry.get("y", 0))))
    return packed

func _sample_path(points: Array, smooth: bool) -> PackedVector2Array:
    var output := PackedVector2Array()
    if points.size() < 2:
        return output
    var vectors: Array[Vector2] = []
    for entry in points:
        vectors.append(Vector2(float(entry.get("x", 0)), float(entry.get("y", 0))))
    output.append(vectors[0])
    for i in range(vectors.size() - 1):
        var p0: Vector2 = vectors[maxi(0,i - 1)]
        var p1: Vector2 = vectors[i]
        var p2: Vector2 = vectors[i + 1]
        var p3: Vector2 = vectors[mini(vectors.size() - 1,i + 2)]
        var length: float = p1.distance_to(p2)
        var steps: int = clampi(ceili(length / 11.0), 2, 80) if smooth and vectors.size() > 2 else 1
        for j in range(1,steps + 1):
            var t: float = float(j) / float(steps)
            if not smooth or vectors.size() == 2:
                output.append(p1.lerp(p2,t))
                continue
            var d01: float = maxf(0.00001,sqrt(p0.distance_to(p1)))
            var d12: float = maxf(0.00001,sqrt(length))
            var d23: float = maxf(0.00001,sqrt(p2.distance_to(p3)))
            var m1: Vector2 = (p2 - p0) * d12 / (d01 + d12)
            var m2: Vector2 = (p3 - p1) * d12 / (d12 + d23)
            var t2: float = t * t
            var t3: float = t2 * t
            output.append((2.0 * t3 - 3.0 * t2 + 1.0) * p1 +
                (t3 - 2.0 * t2 + t) * m1 +
                (-2.0 * t3 + 3.0 * t2) * p2 +
                (t3 - t2) * m2)
    return output

func _line(path: PackedVector2Array, width: float, color: Color) -> void:
    if path.size() > 1:
        draw_polyline(path,color,maxf(width,0.5),true)

func _offset_path(path: PackedVector2Array, amount: float) -> PackedVector2Array:
    var result := PackedVector2Array()
    for i in range(path.size()):
        var previous: Vector2 = path[maxi(0,i - 1)]
        var following: Vector2 = path[mini(path.size() - 1,i + 1)]
        var direction: Vector2 = (following - previous).normalized()
        result.append(path[i] + Vector2(-direction.y,direction.x) * amount)
    return result

func _dashes(path: PackedVector2Array, width: float, color: Color) -> void:
    var cursor: float = 0.0
    for i in range(1, path.size()):
        var a: Vector2 = path[i - 1]
        var b: Vector2 = path[i]
        var length: float = a.distance_to(b)
        if length < 0.001:
            continue
        var pos: float = 0.0
        while pos < length:
            var phase: float = fposmod(cursor + pos, 31.0)
            var remaining: float = minf(length - pos,(16.0 - phase) if phase < 16.0 else (31.0 - phase))
            if phase < 16.0:
                draw_line(a.lerp(b,pos / length),a.lerp(b,(pos + remaining) / length),color,width,true)
            pos += maxf(remaining,0.0001)
        cursor += length

func _draw_road(road: Dictionary, lines: bool) -> void:
    var path: PackedVector2Array = _road_cache.get(str(road.get("id", "")),PackedVector2Array())
    if path.size() < 2:
        return
    var width: float = float(road.get("width",36))
    var shoulder: float = float(road.get("shoulder",5))
    var surface: String = str(road.get("surface","asphalt"))
    if not lines:
        _line(path,width + shoulder * 2.0 + 7.0,Color(0.1,0.16,0.15,0.36))
        _line(path,width + shoulder * 2.0,Color("#a69e8c"))
        _line(path,width + 3.0,Color("#22282b"))
        _line(path,width,ROAD_COLORS.get(surface,Color("#3d4550")))
        return
    if not bool(road.get("markings",true)) or surface == "gravel" or surface == "dirt":
        return
    var lanes: int = int(road.get("lanes",2))
    if lanes == 1:
        _dashes(path,1.5,Color("#eddfb7"))
    elif str(road.get("roadClass","")) == "highway":
        _line(_offset_path(path,-1.6),1.8,Color("#f1c96b"))
        _line(_offset_path(path,1.6),1.8,Color("#f1c96b"))
    else:
        _dashes(path,1.8,Color("#f0ddad"))
    _line(_offset_path(path,-width / 2.0 + 2.8),1.6,Color("#e0e5dc"))
    _line(_offset_path(path,width / 2.0 - 2.8),1.6,Color("#e0e5dc"))

func _draw_region(region: Dictionary) -> void:
    var poly: PackedVector2Array = _make_polygon(region.get("points",[]))
    if poly.size() < 3:
        return
    var biome: String = str(region.get("biome","grass"))
    draw_colored_polygon(poly,BIOME_COLORS.get(biome,Color("#728e61")))
    if biome == "ocean" or biome == "lake":
        var shore := poly.duplicate()
        shore.append(poly[0])
        _line(shore,10.0,Color(0.75,0.93,0.89,0.42))
    if biome == "beach":
        var outline := poly.duplicate()
        outline.append(poly[0])
        _line(outline,5.0,Color("#e5d5a8"))

func _draw_prop(entry: Dictionary) -> void:
    var position := Vector2(float(entry.get("x",0)),float(entry.get("y",0)))
    var scale_value: float = float(entry.get("scale",1))
    draw_set_transform(position,deg_to_rad(float(entry.get("rotation",0))),Vector2.ONE * scale_value)
    var kind: String = str(entry.get("type","rock"))
    if kind in ["oak","pine","palm","bush"]:
        draw_circle(Vector2(8,10),23,Color(0.16,0.25,0.19,0.4))
        var color := Color("#4f915a")
        if kind == "pine":
            color = Color("#326a4d")
        elif kind == "palm":
            color = Color("#4ba17a")
        elif kind == "bush":
            color = Color("#517d56")
        draw_circle(Vector2.ZERO,24 if kind != "bush" else 17,color)
        draw_circle(Vector2(-7,-7),11,color.lightened(0.2))
    elif kind in ["house","building","warehouse","garage","gas_station","parking"]:
        var dim := Vector2(66,54)
        if kind == "building":
            dim = Vector2(76,87)
        elif kind == "warehouse" or kind == "garage":
            dim = Vector2(110,75)
        elif kind == "parking":
            dim = Vector2(135,100)
        draw_rect(Rect2(-dim / 2.0 + Vector2(8,11),dim),Color(0.12,0.2,0.19,0.55))
        draw_rect(Rect2(-dim / 2.0,dim),Color("#cac7b3"))
        draw_rect(Rect2(-dim / 2.0 + Vector2(5,5),dim - Vector2(10,10)),
            Color("#ab6f59") if kind == "house" else Color("#86969a"))
    elif kind in ["rock","boulder"]:
        draw_circle(Vector2(5,5),24 if kind == "boulder" else 14,Color("#89918c"))
        draw_circle(Vector2(-4,-6),10 if kind == "boulder" else 5,Color("#cbc8b7"))
    elif kind == "barrier":
        draw_rect(Rect2(-28,-6,56,12),Color("#cb6254"))
    elif kind == "dock":
        draw_rect(Rect2(-20,-55,40,110),Color("#89683f"))
    elif kind == "streetlight":
        draw_circle(Vector2.ZERO,5,Color("#e7d9a5"))
    elif kind == "sign":
        draw_rect(Rect2(-15,-14,30,15),Color("#e0d8aa"))
    draw_set_transform(Vector2.ZERO,0.0,Vector2.ONE)

func _draw() -> void:
    if world_data.is_empty():
        return
    var size: Vector2 = get_world_size()
    var world: Dictionary = world_data["world"]
    draw_rect(Rect2(Vector2.ZERO,size),BIOME_COLORS.get(str(world.get("base","grass")),Color("#728e61")))
    for region in world_data.get("regions",[]):
        _draw_region(region)
    for road in world_data.get("roads",[]):
        _draw_road(road,false)
    for road in world_data.get("roads",[]):
        _draw_road(road,true)
    for item in world_data.get("props",[]):
        _draw_prop(item)
    if draw_markers:
        for marker in world_data.get("markers",[]):
            draw_circle(marker_position(marker),9.0,Color("#ffd180"))

func _build_blockers() -> void:
    if is_instance_valid(_solid_body):
        _solid_body.queue_free()
    _solid_body = null
    if not build_collision or world_data.is_empty():
        return
    _solid_body = StaticBody2D.new()
    _solid_body.name = "WorldBlocking"
    _solid_body.collision_layer = blocking_layer
    _solid_body.collision_mask = 0
    add_child(_solid_body)
    for region in world_data.get("regions",[]):
        if not str(region.get("biome","")) in ["ocean","lake"]:
            continue
        var poly: PackedVector2Array = _make_polygon(region.get("points",[]))
        if poly.size() < 3:
            continue
        var collision := CollisionPolygon2D.new()
        collision.build_mode = CollisionPolygon2D.BUILD_SOLIDS
        collision.polygon = poly
        _solid_body.add_child(collision)
    for item in world_data.get("props",[]):
        var kind: String = str(item.get("type",""))
        if not kind in ["oak","pine","palm","rock","boulder","house","building","warehouse","garage","gas_station","barrier"]:
            continue
        var width: float = 35.0
        var height: float = 32.0
        if kind in ["house","building","warehouse","garage","gas_station"]:
            width = 75.0
            height = 65.0
        if kind == "warehouse" or kind == "garage":
            width = 110.0
        var scale_value: float = float(item.get("scale",1.0))
        var shape := RectangleShape2D.new()
        shape.size = Vector2(width,height) * scale_value
        var node := CollisionShape2D.new()
        node.shape = shape
        node.position = Vector2(float(item.get("x",0)),float(item.get("y",0)))
        node.rotation = deg_to_rad(float(item.get("rotation",0)))
        _solid_body.add_child(node)
