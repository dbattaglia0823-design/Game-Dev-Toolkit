# Phase 2 — Reusable Functional UI Behaviors

This layer adds **game-agnostic UI behavior** to layout contract v2. It does not define artwork, item rarities, combat mechanics, purchase rules, save data, or a visual theme.

## Modules

| Platform | File | Behavior |
|---|---|---|
| Web | `web/layout-kit/behaviors.js` | Searchable collections, stable item selection, equipment slots, navigation history, confirmation queue |
| Web | `web/layout-kit/workflow.js` | Routes standard action IDs into behavior controllers and forwards game-specific requests |
| Web | `web/layout-kit/confirmation-dialog.js` | Optional native HTML dialog with keyboard Escape/cancel semantics |
| Godot 4 | `godot/layout-kit/ui_behaviors.gd` | Matching headless selection, search, sort, equipment, history and confirmations |
| Both | `web/layout-kit/presets.js` | Additional equipment, searchable list and confirmation wireframes |

Try the [live browser behavior reference](../web/layout-kit/behaviors-demo/index.html) (on GitHub Pages under `/web/layout-kit/behaviors-demo/index.html`).

## Key division of responsibility

- **UI-owned state:** selected item ID, current query, sort order, navigation history, equipment display slots, confirmation pending state.
- **Game-owned state:** actual inventory items, validation of equipment eligibility, item consumption, currency balances, purchases, quest progress, saves and gameplay effects.
- The UI emits `inventory.equip` and `equipment.unequip` **requests**. The game decides whether they succeed, then explicitly synchronizes displayed slots.
- The UI queues `shop.purchase` and `upgrades.purchase` until a user confirms. The host still validates and performs those transactions **after** confirmation.

## Web example

```js
import {UIWorkflow} from './layout-kit/workflow.js';
import {mountLayout} from './layout-kit/runtime.js';
import {getPreset} from './layout-kit/presets.js';

const workflow = new UIWorkflow({
  items: gameInventory.map(item=>({id:item.id,name:item.name,...item})),
  onGameAction(actionId,payload) {
    if (actionId === 'inventory.equip') {
      const approved = gameEquip(payload.item,payload.slot);
      if (approved) workflow.syncEquipment(payload.slot,payload.item);
    }
  }
});

const view = mountLayout({
  container: document.querySelector('#ui'),
  layout: getPreset('inventory'),
  data: workflow.snapshot(),
  onAction: (actionId,payload)=>workflow.handle(actionId,payload)
});
// Update the mounted view when UI state or game state changes:
// view.setData(workflow.snapshot());
// workflow.setItems(nextGameInventory);
```

For a real game, connect `onChange: state => view.setData(state)` after creating the view, or use a guarded reference while constructing the workflow. Use `ConfirmationDialogAdapter` with a native `<dialog>` element if your browser game needs an accessible modal.

The `SearchableCollection` uses **unique stable IDs** for selection. Filtering/sorting does not change the selected ID; selection clears when an item disappears. Do not use an array index as a persistent item ID.

## Standard actions

| Action ID | Behavior |
|---|---|
| `inventory.search` | Set searchable query from input value |
| `inventory.sort` | Toggle ascending/descending name sort |
| `inventory.select` | Select item by stable `item.id` |
| `inventory.equip` | Forward equip request to game; UI does not mutate inventory |
| `equipment.unequip` | Forward unequip request; game updates slots after success |
| `nav.settings`, `nav.inventory`, `nav.equipment`, `nav.shop`, `nav.back` | Update navigation history |
| `shop.purchase`, `upgrades.purchase` | Queue for confirmation |
| `ui.confirm`, `ui.cancel` | Approve or dismiss pending request |

Other action IDs pass through to the host game unchanged. Every action still requires a real game handler or an intentional unsupported state.

## Testing

- `cd web && npm test` — Node unit tests.
- GitHub Actions Web tests — Chromium desktop 2560×1440 and mobile 390×844 workflow smoke tests.
- GitHub Actions Godot adapter smoke tests — Godot 4.4.1 headless behavior script tests.

Testing these reusable controllers is not equivalent to validating their integration into an existing game.
