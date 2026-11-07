# Development instructions

Before writing a new feature, inspect `docs/MODULES.md` for an existing compatible module.

- Do not import modules from the wrong runtime (web vs Godot).
- Prefer copying small versioned modules over introducing live dependencies without planning updates.
- Preserve existing interfaces, save schemas, input mappings, and visual customization unless explicitly asked to change them.
- Add or update tests and a concise integration example when changing a module.
- Never treat a demo as production proof; smoke-test in the target game and on its target device.
- When extracting from an existing game, remove game-specific references and secrets; document license and attribution.
- Treat migration/data deletion as an explicit, separately reviewed change.
- Avoid speculative abstractions; add a module only when it has an actual use case.

## Functional UI templates (preferred for new projects)

- Before creating screens, inspect `docs/UI_TEMPLATE_CONTRACT.md`, `docs/CODEX_UI_INTEGRATION.md`, and the exported `*.layout.json` / `*.contract.json`.
- Treat UI templates as **structural and semantic contracts**: placement, role, action ID and data binding. Do not reuse the neutral wireframe styling as the final game's visual style.
- Import the matching web or Godot runtime adapter; customize fonts, buttons, icons, images, themes and animation to suit the game.
- Map each action ID to existing game callbacks and each data binding to existing game state. Record missing mappings instead of inventing gameplay implementations.
- Preserve save formats, inventory logic, economy, progression, routing and game functionality. Validate integrated behavior.
- Version 2 functional layout documents are distinct from version 1 legacy visual-studio documents. Never silently convert them or treat a label as a game action.

## Integration validation gate

Before importing a UI template into a game, run the `web/layout-kit/validator.js` checks with target action IDs and representative state data. Correct structural errors, resolve warnings or document why they are intentional. Run browser UI smoke tests or Godot headless checks as appropriate. A valid contract does **not** prove the actual game has implemented or tested the handlers.

## Phase 2 behavior modules

Use `docs/BEHAVIORS.md` to select UI-only functionality for filtering, selecting, equipment slots, navigation and confirmation. Maintain stable item IDs, avoid hiding gameplay mutations in UI components, and keep purchase/equip requests delegated to the existing game systems. Wire `action_requested` to behavior handling, and pass approved results back into the UI state. Test keyboard, pointer, mobile and Godot behavior where supported.

## Phase 3 template selection

Use `docs/TEMPLATE_LIBRARY.md` and `web/catalog/index.html` to select a functional screen template. Keep action names, data bindings and layout responsibilities, but customize all artwork, branding, text and visuals for the target game. Only use the new nine layouts for placement and interactions: they do not implement crafting, quests, vehicle sales, racing, stats or progression. Run the validator and target-game regression tests for all integrations.

## Phase 4 integration packages

For selected functional layouts, use `web/package/index.html` and the `docs/INTEGRATION_PACKAGES.md` instructions to collect compatible engine files. Inspect `manifest.json`, individual `*.layout.json` and `*.contract.json`, and validation warnings before changing the target game. Preserve existing game state, save formats and gameplay systems. Wiring and verification are mandatory; the package cannot prove those steps are complete.

## Skill-tree graph metadata

Preserve the v2 functional UI `shape` and `edges` fields when importing or transforming layouts. Connections are purely visual associations and must not bypass existing skill prerequisites, ability unlock rules or save-state validation. Use `docs/SKILL_TREE_CONNECTIONS.md` for the editor and runtime contracts.
