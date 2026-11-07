# Codex: Import a Functional UI Template

## Recommended instruction for new or existing game

> Integrate the attached `*.layout.json` functional UI template using the Game-Dev-Toolkit repository. Read `docs/UI_TEMPLATE_CONTRACT.md` and the accompanying `*.contract.json` first. Use only the compatible web or Godot layout adapter. Preserve the template's panel relationships, placement, semantic roles, action IDs, and data-binding IDs. Connect every applicable action to this game's real logic and map game data to the declared bindings. Customize text, theme, fonts, icons, buttons, imagery, and animations to match the actual game. Do not copy the toolkit's neutral wireframe appearance. Keep existing saves, gameplay, and navigation working; identify unsupported actions explicitly and validate behavior at desktop and mobile resolutions.

## Repository paths

- **Template schema + validation:** `web/layout-kit/schema.js`
- **Built-in presets:** `web/layout-kit/presets.js`
- **Browser adapter:** `web/layout-kit/runtime.js` (requires `schema.js`; optional `runtime.css`)
- **Browser example:** `web/layout-kit/example/index.html`
- **Godot 4 adapter:** `godot/layout-kit/ui_layout.gd`
- **Contract documentation:** `docs/UI_TEMPLATE_CONTRACT.md`

### Web

Include the adapter and schema in your web project, then:

```js
import { mountLayout } from './ui/runtime.js';
import layout from './templates/inventory.layout.json' with { type: 'json' }; // If supported by your bundler

const ui = mountLayout({
  container: document.querySelector('#game-ui'),
  layout,
  data: {
    inventory: {items: playerInventory, selected: selectedItem}
  },
  onAction(actionId, payload) {
    switch (actionId) {
      case 'inventory.select': selectItem(payload.item); break;
      case 'inventory.equip': equipSelectedItem(); break;
      // Wire additional declared actions.
    }
  }
});

// After state changes:
ui.setData({inventory: {items: playerInventory, selected: selectedItem}});
```

For a browser-only project without a bundler, fetch the `*.layout.json` file and call `mountLayout` with the parsed JSON. Use relative paths when publishing to GitHub Pages. Do not store private game data or credentials inside a public template file.

The optional `runtime.css` is intentionally plain; customize or replace it. The runtime does not contain economy, combat, inventory storage, game saves, or navigation implementations.

### Godot 4

Copy `godot/layout-kit/ui_layout.gd` into your project. Add a `Control` node and attach the script. Copy your exported layout to `res://ui/templates/inventory.layout.json`.

An example controlling script:

```gdscript
extends Node

@onready var ui_layout = $UILayout

func _ready() -> void:
    ui_layout.action_requested.connect(_on_ui_action)
    ui_layout.load_from_file("res://ui/templates/inventory.layout.json")
    _refresh_ui()

func _refresh_ui() -> void:
    ui_layout.set_data({
        "inventory": {
            "items": [{"name": "Item A"}, {"name": "Item B"}],
            "selected": {"name": "Item A"}
        }
    })

func _on_ui_action(action_id: String, payload: Dictionary) -> void:
    match action_id:
        "inventory.select":
            print("Select item at index: ", payload.get("index"))
        "inventory.equip":
            print("Connect actual equipment logic here")
```

The Control should be parented in the UI layer, and you must decide how to scale its 800×500 coordinates to the actual viewport, apply visual themes, configure keyboard/controller focus, and connect game state.

## Integration checklist

- [ ] Runtime matches the target engine and version.
- [ ] Every exported action ID has a mapped handler or a documented disabled state.
- [ ] Every exported binding ID has a reliable data source or intentional placeholder.
- [ ] Input, mouse, keyboard, controller and mobile behavior are tested as applicable.
- [ ] Navigation, selection, item actions, upgrades and settings work with real game data.
- [ ] Existing save data and gameplay rules are preserved.
- [ ] Visual customization is applied without changing layout responsibilities.
- [ ] Existing and new tests pass.

## What not to do

Do not copy the old visual studio's theme or game-specific placeholder content into the target game. Do not replace existing inventory, upgrade or save systems just to match a layout. Do not treat named actions as automatically implemented game logic. Do not assume the Godot adapter has passed target-runtime tests until it has actually been imported and executed in the target project.

## Optional Phase 2 UI behaviors

When the exported layout needs filtering, stable item selection, equipment slots, navigation history or confirmation, read `docs/BEHAVIORS.md`. For web, use `web/layout-kit/behaviors.js`, `workflow.js` and the optional `confirmation-dialog.js`. For Godot 4, use `godot/layout-kit/ui_behaviors.gd`. Preserve existing game-owned inventory data, purchase logic and save formats. Action IDs describe requests and do not authorize purchases or item changes without validation in the game.

## Phase 3: Select a screen template

Browse `web/catalog/index.html` and read `docs/TEMPLATE_LIBRARY.md`. Use a catalog layout's exported JSON and contract; apply the project's own data mappings, game actions and appearance. A crafting, attribute allocation, vehicle purchase or race-entry request is only a named event until the actual game's validated systems handle it. Preserve existing game logic and saves.
