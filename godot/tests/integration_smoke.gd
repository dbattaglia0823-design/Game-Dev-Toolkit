extends SceneTree

var failures: Array[String] = []
var actions: Array[Dictionary] = []

func _initialize() -> void:
	call_deferred("_run")

func _expect(condition: bool, message: String) -> void:
	if not condition:
		failures.append(message)
		push_error(message)

func _on_action(action_id: String, payload: Dictionary) -> void:
	actions.append({"id": action_id, "payload": payload})

func _run() -> void:
	var ui_script: Script = load("res://layout-kit/ui_layout.gd")
	_expect(ui_script != null, "Adapter script should load")
	if ui_script == null:
		quit(1)
		return
	var ui: Node = ui_script.new()
	root.add_child(ui)
	ui.connect("action_requested", Callable(self, "_on_action"))
	_expect(ui.call("load_from_file","res://tests/inventory.layout.json"), "Fixture must load")
	_expect((ui.get("controls") as Dictionary).size() == 5, "All five fixture controls should be created")
	ui.call("set_data",{
		"inventory": {"title": "Backpack", "items": [{"name":"Sword"}, {"name":"Potion"}]},
		"hud": {"health": 72},
		"settings": {"sound": true}
	})
	var heading: Label = (ui.get("controls") as Dictionary).get("heading") as Label
	_expect(heading != null and heading.text == "Backpack", "Text binding should update")
	var bar: ProgressBar = (ui.get("controls") as Dictionary).get("health") as ProgressBar
	_expect(bar != null and is_equal_approx(bar.value,72.0), "Progress value should update")
	var grid: ScrollContainer = (ui.get("controls") as Dictionary).get("grid") as ScrollContainer
	var entries: GridContainer = grid.get_node("Entries") as GridContainer
	_expect(entries.get_child_count() == 2, "Grid should populate from data")
	var equip: Button = (ui.get("controls") as Dictionary).get("equip") as Button
	equip.pressed.emit()
	_expect(actions.size() == 1 and actions[0]["id"] == "inventory.equip", "Button action dispatch should work")
	var first: Button = entries.get_child(0) as Button
	first.pressed.emit()
	_expect(actions.size() == 2 and actions[1]["id"] == "inventory.select", "Collection item action should work")
	_expect(int(actions[1]["payload"].get("index",-1)) == 0, "Selected index should be preserved")
	ui.set_data({"inventory":{"title":"Updated","items":[{"name":"Shield"}]},"hud":{"health":50},"settings":{"sound":false}})
	_expect(entries.get_child_count() == 1, "Grid refresh should replace prior items")
	var toggle: CheckBox = (ui.get("controls") as Dictionary).get("sound") as CheckBox
	_expect(not toggle.button_pressed, "Toggle binding should update without emitting action")
	toggle.toggled.emit(true)
	_expect(actions.size() == 3 and actions[2]["id"] == "settings.sound_changed", "Toggle action should dispatch")
	ui.queue_free()
	if failures.is_empty():
		print("GDT_GODOT_SMOKE_PASS")
		quit(0)
	else:
		print("GDT_GODOT_SMOKE_FAIL: ",failures.size())
		quit(1)
