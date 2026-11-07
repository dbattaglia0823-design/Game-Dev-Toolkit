# Browser Functional UI Runtime

The wireframe schema captures **placement and function only**. It is engine-agnostic JSON version 2.

Use `schema.js` to validate exported layouts and derive contracts, `presets.js` for built-in layouts, and `runtime.js` to create DOM controls from a layout. `runtime.css` supplies optional neutral demonstration styles; the actual game's theme should replace these.

```js
import {mountLayout} from './layout-kit/runtime.js';
const layout = await fetch('./ui/inventory.layout.json').then(r => r.json());
const screen = mountLayout({
  container: document.getElementById('ui'),
  layout,
  data: {inventory: {items: [{name:'Sample'}], selected: {name:'Sample'}}},
  onAction(actionId, payload) {
    console.log(actionId, payload);
    // Map each declared action to real gameplay logic.
  }
});
// Call again on inventory/game state changes:
screen.setData({inventory: {items: [], selected: null}});
```

The adapter handles UI nodes, inputs, list/grid selection, basic reactive data display, and action dispatch. It does **not** provide game data, purchases, saving, scene routing, screen transitions, gamepad support, or visual asset conversion. The generated layout coordinates are relative to the declared design viewport; apply a consuming-game responsive strategy as needed.

See [live functional integration example](example/index.html) and [contract specification](../../docs/UI_TEMPLATE_CONTRACT.md). For Codex integrations, read [the integration guide](../../docs/CODEX_UI_INTEGRATION.md).
