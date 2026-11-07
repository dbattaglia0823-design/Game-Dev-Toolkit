# Functional UI Layout Contract — Version 2

This toolkit describes **where UI controls belong, what role they serve, and what event/data key they use**. It intentionally does not define colors, fonts, icon art, game economy, items, assets, or gameplay algorithms.

## Layout format

Save from `web/builder/index.html` as `*.layout.json`. A minimal layout looks like:

```json
{
  "version": 2,
  "name": "Main Menu",
  "viewport": {"width": 800, "height": 500},
  "nodes": [
    {
      "id": "start_button",
      "type": "button",
      "x": 300, "y": 230, "w": 200, "h": 54,
      "label": "Start",
      "role": "primary_action",
      "actionId": "game.start",
      "bindingKey": ""
    }
  ]
}
```

The `label` is a semantic placeholder and may be replaced. The `role` tells an importer its design purpose (e.g., `main_navigation`, `item_grid`, `primary_action`). `actionId` identifies an event to connect. `bindingKey` names a game-provided data property. Coordinates are in **800×500 design units**, independent of the browser editor's display size. Rendering engines should map those design units to their viewport and replace the wireframe appearance.

| Node type | Purpose | Emits action? | Reads data? |
|---|---|---|---|
| panel | Layout region / grouping | No | No |
| label | Display heading or dynamic text | No | Yes |
| button | Primary / secondary navigation or action | Click | No |
| grid | Repeated selectable items | Item selection | Array |
| list | Vertical selectable entries | Item selection | Array |
| slot | Equipment / action bar slot | Click | Optional |
| progress | Health / XP / cooldown meter | No | Number, 0–100 |
| toggle | Boolean setting | Changed boolean | Boolean |
| slider | Numeric setting | Changed 0–100 value | Number |
| input | Search / text field | Submitted text | Text |

### Action contract

The editor's **Export contract** downloads `*.contract.json` containing all action and data IDs and the controls that reference them. The contract is a checklist for Codex: every action should be mapped to an existing game handler or deliberately declared unsupported. A click does nothing to the game until that mapping exists.

Actions use names such as `game.start`, `nav.settings`, `inventory.select`, `inventory.equip`, `upgrades.purchase`, `shop.purchase`, and `settings.volume_changed`. They are **semantic names, not automatically implemented gameplay logic**.

Events have a common shape:

```js
onAction(actionId, {nodeId, value?, item?, index?})
```

`value` is used for sliders, toggles and text inputs; `item` / `index` are used for grids and lists.

### Data contract

Bindings use dotted paths such as `inventory.items`, `inventory.selected.name`, `settings.volume`, or `hud.health`. The game's actual data may have different internal names; map it into this display-facing structure rather than changing the game's underlying state.

## Integration process

1. Choose a preset in the Functional UI Builder (or create a new one).
2. Arrange controls and edit roles, action IDs and data binding IDs.
3. Export **template JSON** and **contract JSON**.
4. Ask Codex to read both files, the appropriate runtime adapter and [Codex integration guide](CODEX_UI_INTEGRATION.md).
5. Adapt the UI's theme and assets for the target game; map bindings and action callbacks to existing logic.
6. Verify every event, navigation path, screen size and save/load scenario in the target game.

JSON v1 files made by the previous *visual studio* are **not compatible with v2**; the legacy editor remains at `web/builder/legacy-studio.html`. This deliberate schema separation prevents visual-only fields from being mistaken for behavioral contracts.

## Runtime adapters

- Web: `web/layout-kit/runtime.js` and optional `runtime.css`; imports `schema.js`.
- Godot 4: `godot/layout-kit/ui_layout.gd` renders a JSON document into Control nodes and emits `action_requested(action_id, payload)`.
- Web working example: `web/layout-kit/example/index.html`.

All outputs are scaffolding. The target game's author or Codex must still connect real data, callbacks, assets, styling, and responsive behavior.

## Integration readiness checks

The [Integration Validator](../web/validator/index.html) reviews the raw v2 document before normalization, action-handler mappings and sample-data bindings. It flags malformed coordinates, duplicate IDs, offscreen controls and undersized interactive targets. Download the report and attach it to the target-game integration review. A template with no errors but warnings is structurally valid, **not fully mapped**.
