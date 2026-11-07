extends Control

const SaveScript = preload("res://addons/gdt/core/save_store.gd")
const SettingsScript = preload("res://addons/gdt/core/settings_store.gd")

var score := 0
var saves = SaveScript.new("user://gdt_demo.json", 1)
var settings = SettingsScript.new("user://gdt_demo.cfg", {"sound": true})

@onready var status_label: Label = $VBox/Status
@onready var toast = $Toast

func _ready() -> void:
    $VBox/AddScore.pressed.connect(_on_score)
    $VBox/Save.pressed.connect(_on_save)
    $VBox/Load.pressed.connect(_on_load)
    _render()

func _render() -> void:
    status_label.text = "Score: %d | Sound: %s" % [score, "on" if settings.get_setting("sound") else "off"]

func _on_score() -> void:
    score += 10
    _render()
    toast.show_message("+10 points")

func _on_save() -> void:
    toast.show_message("Saved" if saves.save_game({"score": score}) else "Save failed")

func _on_load() -> void:
    score = int(saves.load_game({"score": 0}).get("score", 0))
    _render()
    toast.show_message("Loaded")
