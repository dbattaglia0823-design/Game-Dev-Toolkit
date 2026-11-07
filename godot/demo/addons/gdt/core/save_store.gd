extends RefCounted
class_name GDTSaveStore
## Versioned local JSON. When upgrading, supply a migration callback in game code.

var path: String
var version: int

func _init(save_path: String = "user://gdt_save.json", schema_version: int = 1) -> void:
    path = save_path
    version = maxi(1, schema_version)

func save_game(data: Dictionary) -> bool:
    var text := JSON.stringify({"version": version, "data": data})
    if FileAccess.file_exists(path):
        var old := FileAccess.get_file_as_string(path)
        var backup := FileAccess.open(path + ".bak", FileAccess.WRITE)
        if backup == null:
            return false
        backup.store_string(old)
        backup.close()
    var file := FileAccess.open(path, FileAccess.WRITE)
    if file == null:
        return false
    file.store_string(text)
    file.close()
    return true

func load_game(fallback: Dictionary = {}) -> Dictionary:
    for candidate in [path, path + ".bak"]:
        if not FileAccess.file_exists(candidate):
            continue
        var parsed: Variant = JSON.parse_string(FileAccess.get_file_as_string(candidate))
        if typeof(parsed) != TYPE_DICTIONARY:
            continue
        if parsed.get("version", -1) != version:
            continue # Migrations require game-specific handling.
        var payload: Variant = parsed.get("data")
        if typeof(payload) == TYPE_DICTIONARY:
            return payload
    return fallback.duplicate(true)
