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

## Reusable behavior modules

Use `behaviors.js` and `workflow.js` for search, selection, equipment display slots, navigation and confirmations, or `confirmation-dialog.js` for browser-native modals. Start with the [interactive behavior demonstration](behaviors-demo/index.html). See `docs/BEHAVIORS.md` in the repository for the full contract.

## Phase 3 screen library

The [catalog](../catalog/index.html) organizes 19 semantic UI layouts and provides a browser preview, contract inspection and export. The [template catalog guide](../../docs/TEMPLATE_LIBRARY.md) documents screen actions and data requirements. The preview fixtures in `sample-data.js` are examples, not gameplay definitions.

## Export to a target game

The [Integration Package Builder](../package/index.html) produces one ZIP per chosen engine, including selected v2 layouts, contracts, validation reports and runtime adapter files. See [full instructions](../../docs/INTEGRATION_PACKAGES.md).

## Choose among alternate compositions

Every one of the original 19 menu types has three layouts (57 choices in total). [Browse variants](../catalog/index.html), filter by menu type and switch between Original, Reversed and Focus compositions. Contract IDs remain compatible. See [full guide](../../docs/MENU_VARIANTS.md).
