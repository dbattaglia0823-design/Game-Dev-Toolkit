# Phase 3 — Functional Template Library

The template library contains **57 screen layouts** (three choices per each of 19 menu types) across four categories. All layouts use the same **version 2 semantic contract**: position, component type, role, action ID, and data binding. They contain **no game-specific art, fonts, rarity systems, product catalogs, financial rules or gameplay implementation**.

Browse the [interactive template catalog](../web/catalog/index.html) and [variant guide](MENU_VARIANTS.md) to search, preview, export, validate, or load any template into the Functional UI Builder.

## Characters and progression

| Template key | Purpose | Example actions | Example bindings |
|---|---|---|---|
| `character-stats` | Character overview, attributes and point allocation | `character.select_attribute`, `character.allocate_point`, `character.reset_request` | `character.attributes`, `character.available_points`, `character.selected.name` |
| `skill-tree` | Branch list, selectable skill nodes, skill details | `skills.select_branch`, `skills.select_node`, `skills.unlock_request` | `skills.branches`, `skills.nodes`, `skills.points` |
| `quest-log` | Quest filters, list, objectives, progress and tracking | `quests.select_filter`, `quests.select`, `quests.track_request` | `quests.filters`, `quests.items`, `quests.selected.progress` |
| `career-events` | Selectable event progression and entry | `career.select_category`, `career.select_event`, `career.enter_request` | `career.events`, `career.selected.requirements` |
| `leaderboard` | Categories, ranked entries, personal rank, refresh | `leaderboard.select_category`, `leaderboard.select_entry`, `leaderboard.refresh` | `leaderboard.entries`, `leaderboard.player_rank` |

## Items and economy

| Template key | Purpose | Example actions | Example bindings |
|---|---|---|---|
| `crafting` | Recipe categories, ingredients, quantity controls, craft request | `crafting.select_recipe`, `crafting.quantity_increase`, `crafting.craft_request` | `crafting.recipes`, `crafting.selected.ingredients`, `crafting.quantity` |

Earlier Phase 1–2 layouts remain available: Inventory, Equipment, Searchable List, Shop and Upgrades. The new crafting template reuses the same list/item selection architecture, but recipes and crafting requirements must be supplied by the target game.

## Vehicles and racing

| Template key | Purpose | Example actions | Example bindings |
|---|---|---|---|
| `garage` | Vehicle stage, selection, stats and customization/upgrades navigation | `garage.previous`, `garage.next`, `nav.upgrades`, `nav.customize`, `garage.change_vehicle` | `garage.selected.name`, `garage.selected.stats` |
| `dealership` | Search, filter, select, inspect and purchase vehicle | `dealership.search`, `dealership.filter`, `dealership.select`, `dealership.purchase_request` | `dealership.vehicles`, `dealership.selected.price`, `dealership.balance` |
| `race-selection` | Filter races, choose event/opponent, view reward, enter | `races.select_filter`, `races.select`, `races.start_request` | `races.items`, `races.selected.distance`, `races.selected.reward` |

The vehicle preview is a **placeholder region**. Codex should connect the actual car sprite, 3D viewport or game renderer. The template never assumes a driving model, dealership pricing, betting mechanics or progression rules.

## How Codex should integrate them

1. Choose a screen in the catalog and inspect its full action/binding contract.
2. Export the `*.layout.json` and `*.contract.json` files.
3. Pass them to Codex with [the integration guide](CODEX_UI_INTEGRATION.md), plus the actual game's source code.
4. Connect **every applicable action ID** to the game's existing handlers or record an intentional unsupported state.
5. Adapt **every applicable binding** to the game's actual state; list/grid nodes expect arrays.
6. Replace neutral preview layout visuals with the game's own appearance.
7. Run the [Integration Validator](../web/validator/index.html) and the game's real tests. These templates alone do not perform gameplay actions.

### Important behavior boundary

A button with `crafting.craft_request` does **not** craft items. Likewise, `skills.unlock_request` does not spend points, `dealership.purchase_request` does not buy a car, and `races.start_request` does not start a race until the host connects and validates those actions.

The optional Phase 2 behavior modules handle generic search, item selection, navigation history and confirmation, but the target game owns rules and persistence. For other action IDs, Codex should map them to existing game handlers rather than inventing an incompatible game subsystem.

## Verification

The `web/tests/phase3-templates.test.js` suite validates each template's semantic schema, unique control IDs, offscreen positions, stable JSON round-trips, action/data binding contracts, catalog membership and neutral preview fixture coverage. Chromium tests exercise the catalog, deep links and selected templates on desktop and mobile. These tests do not replace target-game integration checks.

## Interactive skill tree graphs

The Skill Tree preset now includes circular skill buttons and branching connection lines. Its `edges` describe visual associations only; Codex must supply actual prerequisites and skill state from the game. See `docs/SKILL_TREE_CONNECTIONS.md`.
