class_name GDTVehicleSoundBank
extends RefCounted
## Config lookup and RPM-layer mix targets. Caller owns actual AudioStreamPlayers.
## Place generated bank at res://assets/audio/vehicle_bank.
const ROOT = "res://assets/audio/vehicle_bank"
const LAYERS = ["exhaust_on", "exhaust_off", "intake_on", "intake_off", "mechanical"]

static func _json(path: String) -> Dictionary:
    if not FileAccess.file_exists(path):
        return {}
    var parsed: Variant = JSON.parse_string(FileAccess.get_file_as_string(path))
    return parsed if parsed is Dictionary else {}

static func catalog() -> Dictionary:
    return _json(ROOT + "/catalog.json")

static func modifiers() -> Dictionary:
    return _json(ROOT + "/modifiers.json")

static func index() -> Dictionary:
    return _json(ROOT + "/bank.json")

static func profile(vehicle_id: String, choices: Dictionary = {}) -> Dictionary:
    var vehicle: Dictionary = catalog().get("vehicles", {}).get(vehicle_id, {}).duplicate(true)
    if vehicle.is_empty():
        return {}
    var definitions := modifiers()
    var cam: Dictionary = definitions.get("cam", {}).get(str(choices.get("cam", "stock")), {})
    var exhaust: Dictionary = definitions.get("exhaust", {}).get(str(choices.get("exhaust", "stock")), {})
    var intake: Dictionary = definitions.get("intake", {}).get(str(choices.get("intake", "stock")), {})
    var induction_id := str(choices.get("induction", "stock"))
    if induction_id == "stock":
        induction_id = str(vehicle.get("induction", "naturally_aspirated"))
        if induction_id == "turbo":
            induction_id = "single_turbo"
    var induction: Dictionary = definitions.get("induction", {}).get(induction_id, {})
    if induction.is_empty():
        induction_id = "naturally_aspirated"
        induction = definitions.get("induction", {}).get(induction_id, {})
    var boost: Dictionary = definitions.get("boost", {}).get(str(choices.get("boost", "stock")), {"gain": 1.0})
    vehicle["cam_lope"] = clampf(float(vehicle.get("cam_lope", 0.1)) + float(cam.get("lope", 0.0)), 0.0, 1.0)
    vehicle["roughness"] = clampf(float(vehicle.get("roughness", 0.2)) + float(cam.get("roughness", 0.0)), 0.0, 1.0)
    vehicle["exhaust_gain"] = float(exhaust.get("gain", 1.0))
    vehicle["exhaust_brightness"] = float(exhaust.get("brightness", 0.0))
    vehicle["intake_gain"] = float(intake.get("gain", 1.0))
    vehicle["boost_audio_gain"] = float(boost.get("gain", 1.0))
    vehicle["induction"] = induction_id
    vehicle["turbo_release"] = str(choices.get("turbo_release", "vent_to_atmosphere"))
    vehicle["textures"] = {
        "exhaust": exhaust.get("texture"),
        "intake": intake.get("texture"),
        "induction": induction.get("texture"),
        "cam": "cam_lope" if float(vehicle.get("cam_lope", 0.0)) >= 0.30 else null
    }
    return vehicle

static func rows_for(vehicle: Dictionary, bank: Dictionary) -> Array:
    var id := str(vehicle.get("source_id", ""))
    if str(vehicle.get("source", "")) == "Redline" and bank.get("vehicles", {}).has(id):
        return bank["vehicles"][id].get("rows", [])
    return bank.get("families", {}).get(str(vehicle.get("family", "")), [])

static func stream(path: String) -> AudioStream:
    if not path.begins_with(ROOT + "/"):
        return null
    if not ResourceLoader.exists(path, "AudioStream"):
        return null
    return load(path) as AudioStream

static func mix_recipe(vehicle: Dictionary, rpm: float, throttle: float,
                       bank: Dictionary = {}) -> Array[Dictionary]:
    ## Equal-power two-band weights, separate power/coast, with per-layer pitch.
    ## Smooth gains with an envelope in the calling vehicle audio controller.
    if bank.is_empty():
        bank = index()
    var rows := rows_for(vehicle, bank)
    var output: Array[Dictionary] = []
    if rows.is_empty():
        return output
    var lower := 0
    var upper := rows.size() - 1
    for i in range(rows.size() - 1):
        if rpm <= float(rows[i + 1].rpm):
            lower = i
            upper = i + 1
            break
    if rpm <= float(rows[0].rpm):
        lower = 0
        upper = 0
    elif rpm >= float(rows[-1].rpm):
        lower = rows.size() - 1
        upper = lower
    var blend := 0.0
    if lower != upper:
        var a := maxf(1.0, float(rows[lower].rpm))
        var b := maxf(a + 1.0, float(rows[upper].rpm))
        blend = clampf(log(maxf(1.0, rpm) / a) / log(b / a), 0.0, 1.0)
    var pedal := clampf(throttle, 0.0, 1.0)
    var visited: Dictionary = {}
    for entry in [lower, upper]:
        if visited.has(entry):
            continue
        visited[entry] = true
        var weight := 1.0 if lower == upper else (sqrt(1.0 - blend) if entry == lower else sqrt(blend))
        if weight < 0.005:
            continue
        var row: Dictionary = rows[entry]
        for layer in LAYERS:
            var path := str(row.get("files", {}).get(layer, ""))
            var sample := stream(path)
            if sample == null:
                continue
            var gain := sqrt(pedal) if layer.ends_with("_on") else sqrt(1.0 - pedal)
            if layer.begins_with("exhaust"):
                gain *= float(vehicle.get("exhaust_gain", 1.0))
            elif layer.begins_with("intake"):
                gain *= float(vehicle.get("intake_gain", 1.0)) * 0.62
            else:
                gain = 0.45
            output.append({"stream":sample,"path":path,"layer":layer,
                           "gain":gain * weight,
                           "pitch":clampf(rpm / maxf(1.0, float(row.rpm)), 0.70, 1.35)})
    return output

static func texture_stream(vehicle: Dictionary, kind: String,
                           bank: Dictionary = {}) -> AudioStream:
    if bank.is_empty():
        bank = index()
    var effect_name: Variant = vehicle.get("textures", {}).get(kind)
    if effect_name == null:
        return null
    return stream(str(bank.get("effects", {}).get(str(effect_name), "")))

static func event_stream(vehicle: Dictionary, event: String,
                         bank: Dictionary = {}) -> AudioStream:
    if bank.is_empty():
        bank = index()
    var name := event
    if event == "boost_release":
        if str(vehicle.get("induction", "")).contains("supercharger"):
            name = "blower_bypass"
        elif str(vehicle.get("induction", "")) != "naturally_aspirated":
            var release := str(vehicle.get("turbo_release", "vent_to_atmosphere"))
            name = str(modifiers().get("turbo_release", {}).get(release, {}).get("event", "bov_vent"))
        else:
            return null
    return stream(str(bank.get("effects", {}).get(name, "")))
