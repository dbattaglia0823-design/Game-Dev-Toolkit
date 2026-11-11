class_name GDTDetailedV8Player
extends Node
## Non-positional demo/controller for the independently stored stereo V8 library.
## Call set_drive_state() at your physics update rate; no gameplay parameters changed.
@export var sound_root: String = "res://assets/audio/v8_detail_v2"
@export var engine_id: String = "v8_ls_race_cam"
@export_enum("exterior", "interior") var perspective: String = "exterior"
@export_enum("naturally_aspirated", "single_turbo", "twin_turbo", "roots", "twin_screw", "centrifugal") var induction: String = "naturally_aspirated"
@export_enum("bov_vent", "bov_recirc", "flutter_soft", "flutter_hard") var release_sound: String = "bov_vent"
@export_range(0.0, 1.0, 0.01) var output_gain: float = 0.65

var bank := GDTDetailedV8Bank.new()
var _slots: Array[Dictionary] = []
var _spool: AudioStreamPlayer
var _air: AudioStreamPlayer
var _shot: AudioStreamPlayer
var _rpm := 900.0
var _throttle := 0.0
var _engine_load := 0.0
var _boost_psi := 0.0
var _cooldown := 0.0
var _last_throttle := 0.0
var _last_boost := 0.0
var _ready_audio := false

func _ready() -> void:
    _ready_audio = bank.open(sound_root)
    for i in 8:
        var source := AudioStreamPlayer.new()
        source.volume_db = -80.0
        add_child(source)
        _slots.append({"player": source, "path": "", "gain": 0.0, "desired": 0.0})
    _spool = AudioStreamPlayer.new()
    _air = AudioStreamPlayer.new()
    _shot = AudioStreamPlayer.new()
    add_child(_spool)
    add_child(_air)
    add_child(_shot)
    for p in [_spool, _air, _shot]:
        p.volume_db = -80.0
    _select_induction_streams()

func configure(new_engine: String, new_perspective: String = "exterior",
               new_induction: String = "naturally_aspirated") -> bool:
    if not _ready_audio:
        return false
    if not bank.manifest.get("engines", {}).has(new_engine):
        return false
    engine_id = new_engine
    perspective = "interior" if new_perspective == "interior" else "exterior"
    induction = new_induction
    for slot in _slots:
        slot.path = ""
        slot.gain = 0.0
        slot.desired = 0.0
        var p: AudioStreamPlayer = slot.player
        p.stop()
    _select_induction_streams()
    return true

func _select_induction_streams() -> void:
    if _spool == null:
        return
    var name := ""
    match induction:
        "single_turbo": name = "single_turbo_spool"
        "twin_turbo": name = "twin_turbo_spool"
        "roots": name = "roots_blower"
        "twin_screw": name = "twin_screw_blower"
        "centrifugal": name = "centrifugal_blower"
    _spool.stop()
    _air.stop()
    _spool.stream = bank.effect_stream(name) if not name.is_empty() else null
    _air.stream = bank.effect_stream("compressor_air") if induction in ["single_turbo", "twin_turbo"] else null
    if _spool.stream:
        _spool.play()
    if _air.stream:
        _air.play()

func set_drive_state(rpm: float, throttle: float, load_value: float,
                     boost_psi: float) -> void:
    _rpm = maxf(0.0, rpm)
    _throttle = clampf(throttle, 0.0, 1.0)
    _engine_load = clampf(load_value, 0.0, 1.0)
    _boost_psi = maxf(0.0, boost_psi)
    if _throttle < _last_throttle - 0.30 and _last_boost > 2.0:
        _release_boost()
    _last_throttle = _throttle
    _last_boost = _boost_psi

func notify_shift() -> void:
    if _boost_psi > 2.0:
        _release_boost()

func _release_boost() -> void:
    if induction not in ["single_turbo", "twin_turbo"] or _cooldown > 0.0:
        return
    var stream := bank.effect_stream(release_sound)
    if stream == null:
        return
    _shot.stop()
    _shot.stream = stream
    _shot.volume_db = linear_to_db(maxf(0.01, output_gain * minf(1.0, _last_boost / 12.0) * 0.55))
    _shot.play()
    _cooldown = 0.22

func _process(dt: float) -> void:
    if not _ready_audio:
        return
    _cooldown = maxf(0.0, _cooldown - dt)
    for slot in _slots:
        slot.desired = 0.0
    var targets := bank.engine_mix(engine_id, _rpm, _engine_load, perspective)
    for item in targets:
        var selected: Dictionary = {}
        for slot in _slots:
            if slot.path == str(item.path):
                selected = slot
                break
        if selected.is_empty():
            for slot in _slots:
                if slot.path == "":
                    selected = slot
                    break
        if selected.is_empty():
            continue
        if str(selected.path) != str(item.path):
            var new_player: AudioStreamPlayer = selected.player
            new_player.stop()
            new_player.stream = item.stream
            new_player.volume_db = -80.0
            new_player.pitch_scale = float(item.pitch)
            new_player.play()
            selected.path = str(item.path)
            selected.gain = 0.0
        selected.desired = maxf(float(selected.desired), float(item.gain) * output_gain)
        var p: AudioStreamPlayer = selected.player
        p.pitch_scale = lerpf(p.pitch_scale, float(item.pitch), 1.0 - exp(-dt / 0.028))
    for slot in _slots:
        slot.gain = lerpf(float(slot.gain), float(slot.desired), 1.0 - exp(-dt / 0.032))
        var p: AudioStreamPlayer = slot.player
        if slot.gain < 0.00012 and slot.desired == 0.0:
            p.stop()
            slot.path = ""
        else:
            p.volume_db = linear_to_db(maxf(0.00001, float(slot.gain)))
    var compressor := clampf(_boost_psi / 18.0, 0.0, 1.0)
    var turbo := induction in ["single_turbo", "twin_turbo"]
    var blower := induction in ["roots", "twin_screw", "centrifugal"]
    if _spool.playing:
        var active := compressor if turbo else clampf(_rpm / 7000.0, 0.0, 1.0) if blower else 0.0
        _spool.volume_db = linear_to_db(maxf(0.00001, active * output_gain * 0.32))
        _spool.pitch_scale = clampf(_rpm / 3200.0, 0.68, 1.55)
    if _air.playing:
        _air.volume_db = linear_to_db(maxf(0.00001, compressor * _throttle * output_gain * 0.17))
