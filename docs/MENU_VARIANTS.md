# Multiple Layout Choices for Every Menu

The functional UI library provides **three alternate compositions for each of 19 existing UI menu types: 57 layouts total**, including 38 new options.

All versions preserve the original menu's functional controls, action IDs, data bindings and skill-tree connections. The layouts define **placement and function**, never final game styling. Codex should supply the game's own artwork, colors, animations and business logic.

## Choosing a menu

Visit the [Template Library](../web/catalog/index.html). Choose a **Category**, then **Menu type** to see the three options together:

- **Original:** Established layout already used by the toolkit.
- **Reversed composition:** A mirrored screen with controls moved to the opposite side, useful for navigation and content-panel arrangements.
- **Focus composition:** An independently arranged alternative for the menu (such as hero split, right rail, compact finder, vehicle spotlight or horizontal skill-tree branches).

Use the **three variant buttons above the preview** to switch quickly between options. Choosing a variant updates the live preview, action/binding details, deep links into the builder and validator, and export actions.

Examples include:
- Main Menu: Original, Right Rail, Hero Split.
- Garage: Original, Reversed Garage, Vehicle Spotlight.
- Dealership: Original, Reversed Dealership, Showroom Focus.
- Inventory: Original, Reversed Inventory, Detail First.
- Skill Tree: Original, Reversed Tree, Horizontal Branches.
- Settings: Original, Reversed Settings, Side Preferences.

Every original category is included: **Core (5 types), Items & economy (6 types), Characters & progression (5 types), Racing & vehicles (3 types)**.

## Integrating a selected variant

The menu's existing action IDs and data bindings remain stable between its three layouts. For example, changing a garage composition does **not** change `garage.selected.name`, `garage.change_vehicle`, `nav.upgrades`, or `nav.customize`. A Skill Tree variant keeps circular skill buttons and their existing graph connections.

Open **Functional UI Builder** to refine the chosen arrangement. The Integration Validator and Package Builder accept all variant IDs, including from deep links such as `?preset=garage-focus`.

The ZIP exporter can still bundle up to 30 selected layouts in one package. To export more, create multiple packages. Godot and Web adapters use the same version 2 schema, and the new variants require no additional gameplay dependencies.

## Verification

The `web/tests/menu-variants.test.js` suite confirms three different layouts for each menu type, action/binding and control-ID parity, correct dimensions, connection graph preservation, validation and JSON round-trips. Chromium smoke tests check the category/menu-type filters, variant selection, editor loading, validator and ZIP selection. Godot CI generates real JSON fixtures from the full catalog and checks all 57.

**Reminder:** These are functional UI layouts, not fully implemented game screens. Some compositions may need further adjustments for specific fonts, controls, gamepad navigation or mobile safe areas once imported into a real game.
