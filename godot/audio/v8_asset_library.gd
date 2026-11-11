class_name GDTV8AssetLibrary
extends RefCounted
## Standalone audio pack. Copy sound-bank/library/v8 to
## res://assets/audio/v8/ inside the target Godot project.
## The caller owns players/crossfades. Cache the manifest and streams at vehicle equip.
const DEFAULT_ROOT := "res://assets/audio/v8"

static func _manifest(root: String) -> Dictionary:
    var path := root.path_join("manifest.json")
    if not FileAccess.file_exists(path):
        return {}
    var data: Variant = JSON.parse_string(FileAccess.get_file_as_string(path))
    return data if data is Dictionary else {}

static func _stream(root: String, library_path: String) -> AudioStream:
    const PREFIX := "sound-bank/library/v8/"
    if not library_path.begins_with(PREFIX):
        return null
    var relative := library_path.trim_prefix(PREFIX)
    if relative.contains("..") or relative.begins_with("/"):
        return null
    var asset := root.path_join(relative)
    if not ResourceLoader.exists(asset, "AudioStream"):
        return null
    return ResourceLoader.load(asset, "AudioStream")

static func engine_rows(manifest: Dictionary, variant: String, layer: String) -> Array:
    var output: Array = []
    for row in manifest.get("rows", []):
        if str(row.get("variant", "")) == variant and str(row.get("layer", "")) == layer:
            output.append(row)
    output.sort_custom(func(a: Dictionary, b: Dictionary) -> bool:
        return float(a.get("actual_rpm", 0.0)) < float(b.get("actual_rpm", 0.0)))
    return output

static func rpm_mix(rows: Array, rpm: float, root: String = DEFAULT_ROOT) -> Array[Dictionary]:
    ## Equal-power two-region mix. Use cached streams and smoothly ramp gains.
    var output: Array[Dictionary] = []
    if rows.is_empty():
        return output
    var lower := 0
    var upper := rows.size() - 1
    for i in range(rows.size() - 1):
        if rpm <= float(rows[i+1].get("actual_rpm", 0.0)):
            lower = i
            upper = i + 1
            break
    if rpm <= float(rows[0].get("actual_rpm", 0.0)):
        lower = 0
        upper = 0
    elif rpm >= float(rows[-1].get("actual_rpm", 0.0)):
        lower = rows.size() - 1
        upper = lower
    var blend := 0.0
    if lower != upper:
        var a := maxf(1.0, float(rows[lower].get("actual_rpm", 0)))
        var b := maxf(a + 1.0, float(rows[upper].get("actual_rpm", 0)))
        blend = clampf(log(maxf(rpm, 1.0) / a) / log(b / a), 0.0, 1.0)
    var indices := [lower] if lower == upper else [lower, upper]
    for i in indices:
        var row: Dictionary = rows[i]
        var sound := _stream(root, str(row.get("path", "")))
        if sound == null:
            continue
        var weight := 1.0 if lower == upper else sqrt(1.0 - blend) if i == lower else sqrt(blend)
        output.append({"stream": sound,
                       "gain": weight,
                       "pitch": clampf(rpm / maxf(1, float(row.get("actual_rpm", 1))), 0.70, 1.35),
                       "path": row.get("path", "")})
    return output

static func engine_mix(variant: String, rpm: float, engine_load: float,
                       root: String = DEFAULT_ROOT, manifest: Dictionary = {}) -> Array[Dictionary]:
    if manifest.is_empty():
        manifest = _manifest(root)
    var result: Array[Dictionary] = []
    var on := sqrt(clampf(engine_load, 0.0, 1.0))
    var off := sqrt(1.0 - clampf(engine_load, 0.0, 1.0))
    for layer in ["power", "coast"]:
        var gain := on if layer == "power" else off
        for row in rpm_mix(engine_rows(manifest, variant, layer), rpm, root):
            row["gain"] *= gain
            result.append(row)
    return result

static func exhaust_mix(exhaust_id: String, rpm: float,
                        root: String = DEFAULT_ROOT, manifest: Dictionary = {}) -> Array[Dictionary]:
    if manifest.is_empty():
        manifest = _manifest(root)
    var rows: Array = []
    for row in manifest.get("exhaust_rows", []):
        if str(row.get("id", "")) == exhaust_id:
            rows.append(row)
    rows.sort_custom(func(a: Dictionary, b: Dictionary) -> bool:
        return float(a.get("actual_rpm", 0)) < float(b.get("actual_rpm", 0)))
    return rpm_mix(rows, rpm, root)

static func effect(effect_id: String, root: String = DEFAULT_ROOT,
                   manifest: Dictionary = {}) -> AudioStream:
    if manifest.is_empty():
        manifest = _manifest(root)
    for entry in manifest.get("effects", []):
        if str(entry.get("id", "")) == effect_id:
            return _stream(root, str(entry.get("path", "")))
    return null
