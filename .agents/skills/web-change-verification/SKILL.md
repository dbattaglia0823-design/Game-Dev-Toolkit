---
name: web-change-verification
description: Use to verify browser game logic, toolkit UI builders, layout contracts, exports and responsive web functionality.
---

# Web changes

1. Inspect the actual web module, existing tests, schema version, state/action IDs and persistence contracts.
2. Preserve save migration behavior, responsive design and input/focus semantics.
3. For Game-Dev-Toolkit use `docs/MODULES.md` and `docs/VALIDATION.md`; avoid treating demo assets as production game implementations.
4. Add or update focused Node tests, then run `cd web && npm test` if Node is available.
5. For browser-visible changes follow the pinned Playwright smoke procedure in `docs/VALIDATION.md` and check desktop/mobile viewports.
6. Record tested runtime/browser versions, failures and manual checks still outstanding.
7. Update relevant game/project docs without claiming passing toolkit tests prove consumer-game integration.

Acceptance: behavior, contracts and test evidence align; limitations clearly documented.
