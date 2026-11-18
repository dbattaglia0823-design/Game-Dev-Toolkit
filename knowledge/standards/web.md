# Web game and toolkit conventions

**Applies to:** browser/Node projects whose runtime and test tooling have been inspected. Never assume a web UI contract implements the consuming game's actual state transitions.

- Preserve exported JSON schemas and stable IDs. Use migrations for schema changes; never silently reinterpret old layouts.
- Keep render components separate from business logic and persistence. Dispatch named actions; let the game handle purchases, equips, skills and saves.
- Review mobile viewport behavior, keyboard/focus behavior, pointer hit targets and accessibility semantics.
- Audit local-storage keys and backup/migration hooks before modifying save functionality.
- Use existing Node, browser and integration tests; do not claim full browser/mobile coverage from unit tests alone.

Toolkit baseline from `docs/VALIDATION.md`:

    cd web && npm test

For browser smoke testing, follow the pinned Playwright and local HTTP server instructions in `docs/VALIDATION.md`. Validate each target game separately. Record the browser/device and resolution used; screenshots and manual review may still be needed.
