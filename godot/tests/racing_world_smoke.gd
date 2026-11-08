extends SceneTree

var failures: Array[String] = []

func _initialize() -> void:
    call_deferred("_run")

func _expect(condition: bool, detail: String) -> void:
    if not condition:
        failures.append(detail)
        push_error(detail)

func _run() -> void:
    var loader: Script = load("res://world-kit/world_loader.gd")
    _expect(loader != null, "World Forge v2 script should compile")
    if loader == null:
        quit(1)
        return
    var world: Node2D = loader.new()
    root.add_child(world)
    _expect(world.call("load_world","res://tests/racing-world-smoke.json"), "Must load a v2 freeform world")
    _expect(world.call("get_world_size") == Vector2(1000,800), "World dimensions preserved")
    _expect((world.get("_sprite_textures") as Dictionary).size() == 1, "Embedded PNG scenery sprite decoded")
    var routes: Array = world.call("get_road_paths")
    _expect(routes.size() == 2, "Two exported road paths")
    if routes.size() > 0:
        var points: PackedVector2Array = routes[0]["points"]
        _expect(points.size() > 10, "Curved road must have sampled geometry")
        _expect(points[0] == Vector2(100,130), "Road must start at authored point")
        _expect(points[points.size() - 1] == Vector2(625,250), "Road must end at authored point")
    var near: Dictionary = world.call("road_near",Vector2(100,130))
    _expect(str(near.get("id","")) == "road-1", "Hit test road at start point")
    _expect(world.call("get_surface_at",Vector2(100,130)) == "asphalt", "Road surface must take precedence")
    _expect(world.call("get_surface_at",Vector2(900,400)) == "ocean", "Ocean biome surface detection")
    _expect(world.call("get_surface_at",Vector2(80,700)) == "forest", "Forest surface detection")
    var markers: Array = world.call("get_markers","player_spawn")
    _expect(markers.size() == 1, "Gameplay marker query")
    if markers.size() > 0:
        _expect(world.call("marker_position",markers[0]) == Vector2(105,132), "Marker uses continuous position")
    var blockers: StaticBody2D = world.get_node_or_null("WorldBlocking")
    _expect(blockers != null, "World collision body exists")
    if blockers != null:
        _expect(blockers.get_child_count() >= 3, "Ocean and solid scenery produce collision shapes")
    var v1: String = "{\"format\":\"gdt.topdown-map\",\"version\":1}"
    _expect(not world.call("load_world_json",v1), "Must reject old tile map schema")
    world.queue_free()
    if failures.is_empty():
        print("GDT_WORLD_FORGE_SMOKE_PASS")
        quit(0)
    else:
        print("GDT_WORLD_FORGE_SMOKE_FAIL ",failures.size())
        quit(1)
