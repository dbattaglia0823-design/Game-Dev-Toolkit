# Functional UI Builder (preferred)

Open [index.html](index.html), or the GitHub Pages URL ending in `/web/builder/index.html`.

This is a **functional wireframe designer**. Arrange neutral controls, define their semantic roles, assign named `actionId` values and `bindingKey` paths, then export the template JSON and action/data contract for Codex.

## Features

- Seven built-in functional screen presets: Main menu, Pause menu, Inventory, Upgrades, Shop, Settings and HUD.
- Neutral controls: panel, label, button, grid, list, slot, progress, toggle, slider and input.
- Select, drag, resize, snap, reorder layers, duplicate, delete, keyboard navigation, undo/redo and internal copy/paste.
- Inspector for semantic roles, action identifiers and data-binding keys; no mandatory color, image, font or gameplay definitions.
- A **Test actions** mode that mounts the same browser runtime used for real web-game integration and logs emitted actions.
- Browser-local Save/Load, editable `*.layout.json` export and a generated `*.contract.json` manifest.

See the [layout format](../../docs/UI_TEMPLATE_CONTRACT.md), the [Codex import procedure](../../docs/CODEX_UI_INTEGRATION.md), and the [runnable browser runtime demo](../layout-kit/example/index.html).

## Phase 2 behavior presets

The editor includes **Equipment**, **Searchable list**, and **Confirmation** layouts. Try the [interactive functional behavior example](../layout-kit/behaviors-demo/index.html) to test actions and navigation without any final-game visuals. The optional controllers are documented in `docs/BEHAVIORS.md`.

## Old layouts

Earlier appearance-first JSON v1 designs can still be edited at [Legacy Visual Studio](legacy-studio.html). This functional editor uses JSON version 2 and has its own browser-local save key so it does not overwrite legacy layouts. No automatic v1 → v2 migration is performed.

## Limitations

- The preview uses fixed 800×500 design coordinates. Games are responsible for adaptive anchors, input handling and final styling.
- Browser preview and Godot adapter require target-runtime testing in addition to Node schema/unit tests.
- The exported `actionId` is an event name, not implemented gameplay; Codex must connect game-specific handlers and data.
- Files are saved locally or downloaded; they are not automatically committed to GitHub.

## Phase 3 templates

Open the [Functional Template Catalog](../catalog/index.html) to find character stats, crafting, skill trees, quest logs, career event selection, leaderboards, garage, dealership and race-selection layouts. Click **Open in builder** to edit a selected template; its geometry and action/data binding IDs carry over. For import details, see `docs/TEMPLATE_LIBRARY.md`.

## Export current screen directly

Choose **Package current layout** to hand your current edited v2 layout to the [Integration Package Builder](../package/index.html), where you can select Web/Godot, optionally add more templates, and download a ZIP. The transfer uses temporary per-tab browser storage. If storage is unavailable, export JSON first and import it in the package builder.

## Skill tree shapes and connections

Choose a Button or Slot to set Rectangle, Rounded or Circle shape. Toggle **Connect nodes**, then click two nodes to link them. Lines follow nodes when dragged or resized. Delete a link in the Connections inspector. The skill-tree preset demonstrates branching links. Save and export preserve `shape` and `edges`. See `docs/SKILL_TREE_CONNECTIONS.md`.

## Three layouts per menu type

The template selector now includes two additional layouts for every original menu type. Choose one of 57 layouts in the [Template Library](../catalog/index.html), then open it here to adjust placement or export. All three choices preserve the same action/data IDs. See `docs/MENU_VARIANTS.md`.
