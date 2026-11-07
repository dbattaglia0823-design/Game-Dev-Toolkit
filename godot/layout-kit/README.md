# Godot 4 Functional UI Layout Adapter

Attach `ui_layout.gd` to a `Control` node in a Godot 4 project. Export a **version 2 functional JSON** layout from the browser editor, place it in `res://ui/templates/`, and call `load_from_file("res://ui/templates/your.layout.json")`.

The adapter dynamically constructs unstyled Control nodes (Button, Panel, Label, ProgressBar, CheckBox, HSlider, LineEdit, ScrollContainer and GridContainer), uses `set_data(Dictionary)` to bind game state, and emits `action_requested(action_id: String, payload: Dictionary)` for all interactive actions.

Example wiring:

```gdscript
extends Node

@onready var ui_layout = $UILayout

func _ready() -> void:
    ui_layout.action_requested.connect(_handle_ui_action)
    ui_layout.load_from_file("res://ui/templates/inventory.layout.json")
    ui_layout.set_data({"inventory": {"items": [{"name": "Test item"}]}})

func _handle_ui_action(action_id: String, payload: Dictionary) -> void:
    if action_id == "inventory.select":
        print("Selected index:", payload.get("index"))
```

**Important:** The imported coordinates reflect the 800×500 design viewport. Apply scale/anchors, focus navigation, accessibility, theme resources, animations and mobile adaptations in the consuming game. The adapter does not replace any inventory, race, shop or save system.

This script has been reviewed and committed but has **not been runtime-validated in Godot** through this environment. Before relying on it, import into Godot 4, test JSON loading, controls and signals, and verify its behavior alongside the game's existing architecture.
