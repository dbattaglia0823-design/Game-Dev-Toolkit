extends SceneTree
## Parse/instantiate v2 scripts even when no sound pack has been installed.
func _initialize() -> void:
    var bank := GDTDetailedV8Bank.new()
    assert(not bank.open())
    assert(bank.engine_mix("v8_ls_race_cam", 1200.0, 0.4).is_empty())
    assert(bank.effect_stream("bov_vent") == null)
    var player := GDTDetailedV8Player.new()
    root.add_child(player)
    assert(not player.configure("v8_ls_race_cam"))
    player.set_drive_state(3500.0, 0.83, 0.74, 11.0)
    player.notify_shift()
    player.queue_free()
    print("V8 detailed library unloaded-resource smoke passed")
    quit()
