extends Node
## Optional, theme-independent functional UI behaviors for Godot 4.
## Gameplay changes remain owned by the host: connect game_action_requested.
signal state_changed(state: Dictionary)
signal game_action_requested(action_id: String, payload: Dictionary)

var items: Array = []
var selected_id: Variant = null
var query: String = ""
var sort_mode: String = "original"
var equipment: Dictionary = {"primary": null, "secondary": null}
var current_screen: String = "inventory"
var history: Array[String] = []
var pending: Dictionary = {}
var confirm_actions: Array[String] = ["shop.purchase", "upgrades.purchase"]

func _changed() -> void:
	state_changed.emit(snapshot())

func set_items(value: Array) -> bool:
	var seen: Dictionary = {}
	for item in value:
		if not item is Dictionary or not item.has("id") or seen.has(item["id"]):
			return false
		seen[item["id"]] = true
	items = value.duplicate(true)
	if selected_id != null and not seen.has(selected_id):
		selected_id = null
	_changed()
	return true

func set_query(value: String) -> void:
	query = value.left(200)
	_changed()

func set_sort(mode: String) -> bool:
	if not mode in ["original", "name-asc", "name-desc"]:
		return false
	sort_mode = mode
	_changed()
	return true

func _name(item: Dictionary) -> String:
	return str(item.get("name", item.get("label", item.get("title", ""))))

func visible_items() -> Array:
	var result: Array = []
	for item in items:
		if query.strip_edges().is_empty() or _name(item).to_lower().contains(query.strip_edges().to_lower()):
			result.append(item)
	if sort_mode != "original":
		result.sort_custom(func(a: Dictionary, b: Dictionary) -> bool:
			if sort_mode == "name-asc":
				return _name(a).nocasecmp_to(_name(b)) < 0
			return _name(a).nocasecmp_to(_name(b)) > 0
		)
	return result

func selected_item() -> Variant:
	for item in items:
		if item["id"] == selected_id:
			return item
	return null

func select_item(id: Variant) -> bool:
	for item in items:
		if item["id"] == id:
			selected_id = id
			_changed()
			return true
	return false

func set_equipment(slot: String, item: Variant) -> bool:
	if not equipment.has(slot):
		return false
	equipment[slot] = item
	_changed()
	return true

func go(screen: String) -> bool:
	if screen == current_screen or screen.is_empty():
		return false
	history.append(current_screen)
	current_screen = screen
	_changed()
	return true

func back() -> bool:
	if history.is_empty():
		return false
	current_screen = history.pop_back()
	_changed()
	return true

func reset_navigation(screen: String = "main-menu") -> void:
	history.clear()
	current_screen = screen
	_changed()

func request_confirmation(action_id: String, payload: Dictionary = {}) -> bool:
	if not pending.is_empty() or action_id.is_empty():
		return false
	pending = {"actionId": action_id, "payload": payload.duplicate(true)}
	_changed()
	return true

func confirm() -> bool:
	if pending.is_empty():
		return false
	var action: String = str(pending["actionId"])
	var payload: Dictionary = pending["payload"]
	pending = {}
	_changed()
	game_action_requested.emit(action, payload)
	return true

func cancel() -> bool:
	if pending.is_empty():
		return false
	pending = {}
	_changed()
	return true

func snapshot() -> Dictionary:
	return {
		"inventory": {"items": visible_items(), "selected": selected_item(), "search": query,
			"sort": sort_mode, "visibleCount": visible_items().size(), "totalCount": items.size()},
		"equipment": equipment.duplicate(true),
		"navigation": {"screen": current_screen, "history": history.duplicate(), "canGoBack": not history.is_empty()},
		"confirmation": pending.duplicate(true)
	}

func handle(action_id: String, payload: Dictionary = {}) -> bool:
	match action_id:
		"inventory.search":
			set_query(str(payload.get("value", "")))
			return true
		"inventory.sort":
			return set_sort("name-desc" if sort_mode == "name-asc" else "name-asc")
		"inventory.select":
			var item: Variant = payload.get("item")
			if item is Dictionary:
				return select_item(item.get("id"))
			return false
		"inventory.equip":
			var item: Variant = selected_item()
			if item == null:
				return false
			var request: Dictionary = payload.duplicate(true)
			request["item"] = item
			request["slot"] = payload.get("slot", "primary")
			game_action_requested.emit(action_id, request)
			return true
		"equipment.unequip":
			var slot: String = str(payload.get("slot", ""))
			if not equipment.has(slot):
				return false
			game_action_requested.emit(action_id, {"slot": slot})
			return true
		"nav.back":
			return back()
		"nav.main_menu":
			reset_navigation()
			return true
		"nav.settings":
			return go("settings")
		"nav.inventory":
			return go("inventory")
		"nav.equipment":
			return go("equipment")
		"nav.shop":
			return go("shop")
		"nav.search_list":
			return go("search-list")
		"ui.confirm":
			return confirm()
		"ui.cancel":
			return cancel()
		_:
			if confirm_actions.has(action_id):
				return request_confirmation(action_id, payload)
			game_action_requested.emit(action_id, payload)
			return true
