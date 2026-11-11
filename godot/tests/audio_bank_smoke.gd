extends SceneTree
## Smoke-check the portable audio resolver/driver without importing a game's WAVs.
func _initialize() -> void:
    var bank: Dictionary = GDTVehicleSoundBank.index()
    assert(bank.is_empty())
    var voice := GDTVehicleSoundBank.profile("unknown:vehicle")
    assert(voice.is_empty())
    var player := GDTVehicleSoundPlayer.new()
    player.initial_vehicle_id = ""
    root.add_child(player)
    assert(not player.equip_vehicle("unknown:vehicle"))
    player.set_drive_state(3500.0, 0.84, 0.62, 8.0, true)
    player.notify_shift()
    player.play_event("exhaust_pop")
    player.queue_free()
    print("Portable vehicle audio class smoke passed")
    quit()
