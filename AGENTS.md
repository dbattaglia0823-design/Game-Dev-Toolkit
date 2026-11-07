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
