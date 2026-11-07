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
