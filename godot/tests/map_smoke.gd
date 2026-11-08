extends SceneTree

var failures: Array[String] = []

func _initialize() -> void:
    call_deferred("_run")

func _expect(condition: bool, message: String) -> void:
    if not condition:
        failures.append(message)
        push_error(message)

func _run() -> void:
    var script_source: Script = load("res://map-kit/map_loader.gd")
    _expect(script_source != null, "Map runtime must compile")
    if script_source == null:
        quit(1)
        return
    var map: Node2D = script_source.new()
    root.add_child(map)
    _expect(map.call("load_from_file", "res://tests/map-smoke.json"), "Embedded PNG map must load")
    _expect(map.call("get_map_size_cells") == Vector2i(2,2), "Map dimensions must be preserved")
    _expect(map.call("is_blocked",Vector2i(1,0)), "Blocked cells must be reported")
    _expect(not map.call("is_blocked",Vector2i(0,0)), "Walkable cells must remain free")
    _expect(map.call("is_blocked",Vector2i(9,9)), "Out-of-bounds cells are blocked")
    _expect(map.call("world_to_cell",Vector2(47,5)) == Vector2i(1,0), "World to cell coordinates must match")
    var markers: Array = map.call("get_markers", "player_spawn")
    _expect(markers.size() == 1, "Player markers must be queryable")
    if markers.size() == 1:
        _expect(map.call("marker_position",markers[0]) == Vector2(16,16), "Marker positions must use cell centers")
    var collision_body: StaticBody2D = map.get_node_or_null("MapBlocking")
    _expect(collision_body != null, "Static collision body must be generated")
    if collision_body != null:
        _expect(collision_body.get_child_count() == 2, "Separated blockers must produce two shapes")
    map.queue_free()
    if failures.is_empty():
        print("GDT_MAP_SMOKE_PASS")
        quit(0)
    else:
        print("GDT_MAP_SMOKE_FAIL ",failures.size())
        quit(1)
