extends SceneTree

var errors: Array[String] = []
var requests: Array[Dictionary] = []

func _initialize() -> void:
	call_deferred("_test")

func _check(ok: bool, message: String) -> void:
	if not ok:
		errors.append(message)
		push_error(message)

func _request(action: String, payload: Dictionary) -> void:
	requests.append({"action": action, "payload": payload})

func _test() -> void:
	var script: Script = load("res://layout-kit/ui_behaviors.gd")
	_check(script != null, "Behavior script loads")
	if script == null:
		quit(1)
		return
	var controller: Node = script.new()
	root.add_child(controller)
	controller.connect("game_action_requested", Callable(self, "_request"))
	var data: Array = [
		{"id":"a","name":"Sword"},
		{"id":"b","name":"Shield"},
		{"id":"c","name":"Potion"}
	]
	_check(controller.call("set_items", data), "Accept stable item IDs")
	_check(controller.call("select_item", "b"), "Select by stable ID")
	controller.call("set_query", "sh")
	_check((controller.call("visible_items") as Array).size() == 1, "Search filters items")
	controller.call("set_sort", "name-asc")
	_check(controller.call("selected_item")["id"] == "b", "Sorting preserves selected ID")
	_check(controller.call("handle", "inventory.equip", {}), "Equip request dispatched")
	_check(requests.size() == 1 and requests[0]["action"] == "inventory.equip", "Game receives equip request")
	var state: Dictionary = controller.call("snapshot")
	_check(state["equipment"]["primary"] == null, "UI does not silently modify game equipment")
	_check(controller.call("set_equipment", "primary", data[1]), "Host can synchronize equipment")
	_check(controller.call("handle", "nav.settings", {}), "Navigation to settings")
	_check(controller.call("handle", "nav.back", {}), "Back navigation")
	_check(controller.call("snapshot")["navigation"]["screen"] == "inventory", "History restores prior screen")
	_check(controller.call("handle", "shop.purchase", {"productId":"p1"}), "Purchase requests confirmation")
	_check(requests.size() == 1, "Purchase not dispatched before confirmation")
	_check(controller.call("handle", "ui.cancel", {}), "Cancel confirmation")
	_check(requests.size() == 1, "Cancel does not trigger purchase")
	controller.call("handle", "shop.purchase", {"productId":"p2"})
	_check(controller.call("handle", "ui.confirm", {}), "Confirm purchase")
	_check(requests.size() == 2 and requests[1]["action"] == "shop.purchase", "Confirmed action dispatched once")
	_check(not controller.call("handle", "ui.confirm", {}), "Duplicate confirm prevented")
	_check(not controller.call("set_items", [{"id":"same"},{"id":"same"}]), "Reject duplicate inventory IDs")
	controller.queue_free()
	if errors.is_empty():
		print("GDT_GODOT_BEHAVIORS_PASS")
		quit(0)
	else:
		print("GDT_GODOT_BEHAVIORS_FAIL ",errors.size())
		quit(1)
