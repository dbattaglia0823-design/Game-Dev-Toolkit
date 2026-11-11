class_name GDTDetailedV8Bank
extends RefCounted
## Standalone 48-kHz stereo sample bank, isolated from the older 22.05-kHz bank.
const DEFAULT_ROOT := "res://assets/audio/v8_detail_v2"

var root: String = DEFAULT_ROOT
var manifest: Dictionary = {}
var _cache: Dictionary = {}

func open(root_path: String = DEFAULT_ROOT) -> bool:
    root = root_path
    _cache.clear()
    manifest = {}
    var p: String = root.path_join("manifest.json")
    if not FileAccess.file_exists(p):
        return false
    var parsed: Variant = JSON.parse_string(FileAccess.get_file_as_string(p))
    if not parsed is Dictionary or str(parsed.get("id", "")) != "v8-detailed-v2":
        return false
    manifest = parsed
    return true

func get_engine_ids() -> Array:
    return manifest.get("engines", {}).keys()

func _asset(relative: String, looping: bool) -> AudioStream:
    if not relative.begins_with("engines/") and not relative.begins_with("effects/"):
        return null
    if relative.contains("..") or relative.begins_with("/"):
        return null
    var cache_key := relative + (":loop" if looping else ":oneshot")
    if _cache.has(cache_key):
        return _cache[cache_key]
    var resource_path := root.path_join(relative)
    if not ResourceLoader.exists(resource_path, "AudioStream"):
        return null
    var resource := ResourceLoader.load(resource_path, "AudioStream")
    if resource == null:
        return null
    var playable := resource.duplicate() as AudioStream
    if playable is AudioStreamWAV:
        var wav := playable as AudioStreamWAV
        if looping:
            wav.loop_begin = 0
            wav.loop_end = roundi(wav.get_length() * wav.mix_rate)
            wav.loop_mode = AudioStreamWAV.LOOP_FORWARD
        else:
            wav.loop_mode = AudioStreamWAV.LOOP_DISABLED
    _cache[cache_key] = playable
    return playable

func effect_stream(effect_id: String) -> AudioStream:
    for entry in manifest.get("effects", []):
        if str(entry.get("id", "")) == effect_id:
            return _asset(str(entry.get("path", "")), bool(entry.get("loop", false)))
    return null

func _rows(engine_id: String, perspective: String, layer: String) -> Array:
    var engine: Dictionary = manifest.get("engines", {}).get(engine_id, {})
    var rows: Array = []
    if engine.is_empty():
        return rows
    for row in engine.get("rows", []):
        if str(row.get("perspective", "")) == perspective and str(row.get("layer", "")) == layer:
            rows.append(row)
    rows.sort_custom(func(a: Dictionary, b: Dictionary) -> bool:
        return float(a.get("actual_rpm", 0)) < float(b.get("actual_rpm", 0)))
    return rows

func _band_mix(rows: Array, rpm: float, layer_gain: float) -> Array[Dictionary]:
    var result: Array[Dictionary] = []
    if rows.is_empty() or layer_gain < 0.0001:
        return result
    var low := 0
    var high := rows.size() - 1
    if rpm <= float(rows[0].get("actual_rpm", 0)):
        high = 0
    elif rpm >= float(rows[-1].get("actual_rpm", 0)):
        low = high
    else:
        for i in range(rows.size()-1):
            if rpm <= float(rows[i+1].get("actual_rpm", 0)):
                low = i
                high = i+1
                break
    var mix_value := 0.0
    if low != high:
        var a := maxf(1.0, float(rows[low].get("actual_rpm", 1)))
        var b := maxf(a+1.0, float(rows[high].get("actual_rpm", a+1.0)))
        mix_value = clampf(log(maxf(1.0, rpm)/a) / log(b/a), 0.0, 1.0)
    var indices: Array = [low] if low == high else [low, high]
    for i in indices:
        var row: Dictionary = rows[i]
        var sound := _asset(str(row.get("path", "")), true)
        if sound == null:
            continue
        var weight := 1.0 if low == high else sqrt(1.0-mix_value) if i == low else sqrt(mix_value)
        result.append({"stream": sound, "path": row.get("path", ""),
            "gain": weight * layer_gain,
            "pitch": clampf(rpm/maxf(1.0, float(row.get("actual_rpm", 1))), 0.72, 1.30)})
    return result

func engine_mix(engine_id: String, rpm: float, engine_load: float,
                perspective: String = "exterior") -> Array[Dictionary]:
    var result: Array[Dictionary] = []
    if perspective != "interior":
        perspective = "exterior"
    var amount := clampf(engine_load, 0.0, 1.0)
    for layer in ["exhaust_on", "exhaust_off", "intake_on"]:
        var gain := 0.0
        match layer:
            "exhaust_on": gain = sqrt(amount) * 0.62
            "exhaust_off": gain = sqrt(1.0 - amount) * 0.46
            "intake_on": gain = sqrt(amount) * 0.29
        result.append_array(_band_mix(_rows(engine_id, perspective, layer), rpm, gain))
    return result

func clear_cache() -> void:
    _cache.clear()
