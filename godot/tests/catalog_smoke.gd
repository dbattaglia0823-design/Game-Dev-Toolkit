extends SceneTree
## Verify every registered v2 layout can be loaded by the Godot Control adapter.
var failures: Array[String] = []
var received: Array[String] = []

func _initialize() -> void:
	call_deferred("_run")

func _check(condition: bool, message: String) -> void:
	if not condition:
		failures.append(message)
		push_error(message)

func _on_action(action_id: String, _payload: Dictionary) -> void:
	received.append(action_id)

func _run() -> void:
	var script: Script = load("res://layout-kit/ui_layout.gd")
	_check(script != null, "Godot adapter script should load")
	if script == null:
		quit(1)
		return
	var manifest_data: Variant = JSON.parse_string(FileAccess.get_file_as_string("res://tests/generated/manifest.json"))
	_check(manifest_data is Array, "Generated catalog manifest is present")
	if not manifest_data is Array:
		quit(1)
		return
	_check(manifest_data.size() >= 19, "All registered templates should be covered")
	for entry in manifest_data:
		var key: String = str(entry.get("key", ""))
		var path: String = "res://tests/generated/" + key + ".layout.json"
		var spec: Variant = JSON.parse_string(FileAccess.get_file_as_string(path))
		_check(spec is Dictionary, key + ": template JSON parses")
		if not spec is Dictionary:
			continue
		var ui: Node = script.new()
		root.add_child(ui)
		ui.connect("action_requested", Callable(self, "_on_action"))
		_check(bool(ui.call("apply_layout", spec)), key + ": adapter accepts v2 layout")
		var controls: Dictionary = ui.get("controls") as Dictionary
		_check(controls.size() == int(entry.get("count", -1)), key + ": all controls rendered")
		var data: Dictionary = {}
		for node in spec.get("nodes", []):
			var binding: String = str(node.get("bindingKey", ""))
			var kind: String = str(node.get("type", ""))
			if binding.is_empty():
				continue
			if kind in ["grid", "list"]:
				data[binding] = [{"id":"sample-1", "name":"Sample item"}]
			elif kind == "progress":
				data[binding] = 50
			elif kind == "toggle":
				data[binding] = true
			elif kind == "slider":
				data[binding] = 25
			else:
				data[binding] = "Example"
		ui.call("set_data", data)
		for node in spec.get("nodes", []):
			var node_id: String = str(node.get("id", ""))
			var kind: String = str(node.get("type", ""))
			var action: String = str(node.get("actionId", ""))
			var control: Control = controls.get(node_id) as Control
			if kind in ["grid","list"]:
				var entries: GridContainer = control.get_node("Entries") as GridContainer
				_check(entries.get_child_count() == 1, key + ": data list populates " + node_id)
				if not action.is_empty() and entries.get_child_count() > 0:
					received.clear()
					(entries.get_child(0) as Button).pressed.emit()
					_check(received.size() == 1 and received[0] == action, key + ": list item action " + action)
			elif kind in ["button","slot"] and not action.is_empty():
				received.clear()
				(control as Button).pressed.emit()
				_check(received.size() == 1 and received[0] == action, key + ": button action " + action)
		ui.queue_free()
	if failures.is_empty():
		print("GDT_GODOT_CATALOG_PASS: ",manifest_data.size()," layouts")
		quit(0)
	else:
		print("GDT_GODOT_CATALOG_FAIL: ",failures.size())
		quit(1)
