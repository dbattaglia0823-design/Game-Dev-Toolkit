class_name GDTVehicleSoundPlayer
extends Node
## Drop-in, non-positional Godot 4 player for the toolkit's installable WAV banks.
## Copy this and vehicle_sound_bank.gd into a game. Call equip_vehicle once,
## then set_drive_state each physics update. No engine or gameplay mutations.
@export var initial_vehicle_id := "toolkit:v8_ls_ohv"
@export var output_bus: StringName = &"Master"
@export_range(0.0, 1.0, 0.01) var master_gain := 0.7
@export var interior_view := false

const VOICE_COUNT := 12
const EVENT_COUNT := 3
const SMOOTH_TIME := 0.035
var _bank: Dictionary = {}
var _profile: Dictionary = {}
var _rows: Array = []
var _slots: Array[Dictionary] = []
var _cached_streams: Dictionary = {}
var _event_players: Array[AudioStreamPlayer] = []
var _spool: AudioStreamPlayer
var _next_event := 0
var _event_cooldown := 0.0
var _last_throttle := 0.0
var _last_boost := 0.0
var _state := {"rpm": 900.0, "throttle": 0.0, "load": 0.0,
    "boost": 0.0, "running": false}

func _ready() -> void:
    for i in VOICE_COUNT:
        var player := AudioStreamPlayer.new()
        player.bus = output_bus
        player.volume_db = -80.0
        add_child(player)
        _slots.append({"player":player, "path":"", "gain":0.0,
            "target":0.0, "pitch":1.0})
    for i in EVENT_COUNT:
        var effect := AudioStreamPlayer.new()
        effect.bus = output_bus
        effect.volume_db = -18.0
        add_child(effect)
        _event_players.append(effect)
    _spool = AudioStreamPlayer.new()
    _spool.bus = output_bus
    _spool.volume_db = -80.0
    add_child(_spool)
    if not initial_vehicle_id.is_empty():
        equip_vehicle(initial_vehicle_id)

func _loop_stream(path: String) -> AudioStream:
    if path.is_empty():
        return null
    if _cached_streams.has(path):
        return _cached_streams[path]
    var loaded: AudioStream = GDTVehicleSoundBank.stream(path)
    if loaded == null:
        return null
    if loaded is AudioStreamWAV:
        var wav := loaded.duplicate() as AudioStreamWAV
        wav.loop_mode = AudioStreamWAV.LOOP_FORWARD
        wav.loop_begin = 0
        wav.loop_end = wav.data.size() / (4 if wav.stereo else 2)
        loaded = wav
    _cached_streams[path] = loaded
    return loaded

func equip_vehicle(vehicle_id: String, modifications: Dictionary = {}) -> bool:
    _bank = GDTVehicleSoundBank.index()
    _profile = GDTVehicleSoundBank.profile(vehicle_id, modifications)
    _rows = GDTVehicleSoundBank.rows_for(_profile, _bank)
    _cached_streams.clear()
    for slot in _slots:
        var p: AudioStreamPlayer = slot.player
        p.stop()
        slot.path = ""
        slot.gain = 0.0
        slot.target = 0.0
    if is_instance_valid(_spool):
        _spool.stop()
    if _rows.is_empty():
        return false
    for row in _rows:
        for path in row.get("files", {}).values():
            _loop_stream(str(path))
    var induction := str(_profile.get("induction", "naturally_aspirated"))
    var spool_name := ""
    if induction == "twin_turbo":
        spool_name = "v8_twin_turbo_spool_loop"
    elif induction.contains("turbo"):
        spool_name = "v8_turbo_spool_loop"
    elif induction == "centrifugal_supercharger":
        spool_name = "v8_centrifugal_whine_loop"
    elif induction == "twin_screw_supercharger":
        spool_name = "v8_twin_screw_whine_loop"
    elif induction.contains("supercharger"):
        spool_name = "v8_roots_whine_loop"
    var spool_path := GDTVehicleSoundBank.effect_path(_bank, spool_name)
    _spool.stream = _loop_stream(spool_path)
    if _spool.stream != null:
        _spool.play()
    _last_throttle = 0.0
    _last_boost = 0.0
    return true

func set_drive_state(rpm: float, throttle: float, engine_load: float,
        boost_psi: float = 0.0, engine_running: bool = true) -> void:
    var pedal := clampf(throttle, 0.0, 1.0)
    var boost := maxf(0.0, boost_psi)
    var induction := str(_profile.get("induction", "naturally_aspirated"))
    if (_last_throttle > 0.58 and pedal < 0.25 and _last_boost >= 2.5
            and _event_cooldown <= 0.0 and induction.contains("turbo")):
        play_event("boost_release")
    _last_throttle = pedal
    _last_boost = boost
    _state = {"rpm":maxf(0.0,rpm), "throttle":pedal,
        "load":clampf(engine_load,0.0,1.0),
        "boost":boost, "running":engine_running}

func notify_shift(downshift: bool = false) -> void:
    play_event("shift_cut")
    if _last_boost >= 2.5 and str(_profile.get("induction", "")).contains("turbo"):
        play_event("boost_release")
    elif downshift and float(_state["rpm"]) > 3500.0:
        play_event("exhaust_pop")

func play_event(name: String) -> void:
    if _profile.is_empty() or _event_players.is_empty():
        return
    var requested := name
    if requested == "boost_release" and _event_cooldown > 0.0:
        return
    if requested == "boost_release":
        var induction := str(_profile.get("induction", ""))
        if not induction.contains("turbo") and not induction.contains("supercharger"):
            return
    var stream := GDTVehicleSoundBank.event_stream(_profile, requested, _bank)
    if stream == null:
        return
    var voice := _event_players[_next_event % _event_players.size()]
    _next_event += 1
    voice.stop()
    voice.stream = stream
    voice.volume_db = -15.0 + linear_to_db(maxf(0.03,master_gain))
    voice.play()
    if name == "boost_release":
        _event_cooldown = 0.18

func _process(delta: float) -> void:
    _event_cooldown = maxf(0.0, _event_cooldown-delta)
    if _rows.is_empty():
        return
    var rpm := float(_state["rpm"])
    var throttle := float(_state["throttle"])
    var engine_load := float(_state["load"])
    var running: bool = bool(_state["running"])
    var gain_scale := master_gain * (0.53 if interior_view else 1.0)
    var mix := clampf(throttle*0.30 + engine_load*0.70, 0.0, 1.0)
    var lower := 0
    var upper := _rows.size()-1
    if rpm <= float(_rows[0].rpm):
        upper = 0
    elif rpm >= float(_rows[-1].rpm):
        lower = upper
    else:
        for i in range(_rows.size()-1):
            if rpm <= float(_rows[i+1].rpm):
                lower = i
                upper = i+1
                break
    var blend := 0.0
    if lower != upper:
        var a := maxf(1.0,float(_rows[lower].rpm))
        var b := maxf(a+1.0,float(_rows[upper].rpm))
        blend = clampf(log(maxf(1.0,rpm)/a)/log(b/a),0.0,1.0)
    for slot in _slots:
        slot.target = 0.0
    var desired: Dictionary = {}
    for i in [lower,upper]:
        if desired.has("__%d" % i):
            continue
        desired["__%d" % i] = true
        var row: Dictionary = _rows[i]
        var weight := 1.0 if lower == upper else (sqrt(1-blend) if i == lower else sqrt(blend))
        for layer in row.get("files", {}).keys():
            var path := str(row["files"][layer])
            if not _cached_streams.has(path):
                continue
            var channel_gain := sqrt(mix) if str(layer).ends_with("_on") else sqrt(1-mix)
            if str(layer).begins_with("intake"):
                channel_gain = sqrt(throttle) * float(_profile.get("intake_gain",1.0))*0.55
            elif str(layer).begins_with("exhaust"):
                channel_gain *= float(_profile.get("exhaust_gain",1.0))
            else:
                channel_gain = 0.3
            var amplitude := (weight*channel_gain*gain_scale) if running else 0.0
            desired[path] = {"level":amplitude,"pitch":clampf(rpm/maxf(1.0,float(row.rpm)),0.70,1.35)}
    desired.erase("__%d" % lower)
    desired.erase("__%d" % upper)
    for path in desired.keys():
        var chosen: Dictionary = {}
        for slot in _slots:
            if slot.path == path:
                chosen = slot
                break
        if chosen.is_empty():
            for slot in _slots:
                if slot.path == "" or (float(slot.gain)<0.008 and float(slot.target)==0.0):
                    chosen = slot
                    break
        if chosen.is_empty():
            continue
        if chosen.path != path:
            var player: AudioStreamPlayer = chosen.player
            player.stop()
            player.stream = _cached_streams[path]
            player.volume_db = -80.0
            player.play()
            chosen.path = path
            chosen.gain = 0.0
        chosen.target = float(desired[path].level)
        chosen.pitch = float(desired[path].pitch)
    var alpha := 1.0-exp(-maxf(delta,0.0)/SMOOTH_TIME)
    for slot in _slots:
        slot.gain = lerpf(float(slot.gain),float(slot.target),alpha)
        var player: AudioStreamPlayer = slot.player
        if float(slot.gain)<0.0004 and float(slot.target)==0.0:
            player.stop()
            slot.path = ""
        elif player.stream != null:
            player.volume_db = linear_to_db(maxf(0.00001,float(slot.gain)))
            player.pitch_scale = float(slot.pitch)
    if is_instance_valid(_spool) and _spool.stream != null:
        var boost_gain := clampf(float(_state["boost"])/16.0,0.0,1.0)
        var vol := boost_gain*gain_scale*0.45*float(_profile.get("boost_audio_gain",1.0)) if running else 0.0
        var target_db := linear_to_db(maxf(0.00001,vol))
        _spool.volume_db = lerpf(_spool.volume_db,target_db,alpha)
        _spool.pitch_scale = clampf(0.7+rpm/9000.0,0.7,1.65)
