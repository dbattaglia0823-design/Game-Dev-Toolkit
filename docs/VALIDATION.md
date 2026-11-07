# Phase 1 — Integration Validation

## What was audited

The existing functional layout schema, the web runtime, the browser editor, and the Godot 4 adapter. The focus is to confirm that exported UI contracts can be integrated without confusing a valid template with a fully working game.

## Automated checks

| Check | How to run | What it verifies |
|---|---|---|
| Node schema and integration checks | `cd web && npm test` | Presets, IDs, coordinates, action IDs, binding types, missing mappings, data contracts |
| Chromium browser smoke | `cd web && npm install --no-save --package-lock=false playwright@1.56.1 && npx playwright install chromium`, serve `web/` on port 8765, then `node e2e/smoke.mjs` | Interactive browser adapter, builder action preview, validator dashboard, 2560×1440 and mobile 390×844 viewports |
| Godot 4 headless smoke | From repo root, run `godot --headless --path godot --import --quit` then `godot --headless --path godot --script res://tests/integration_smoke.gd` | JSON loading, Control creation, data binding, list refresh, buttons and signals |

The GitHub Actions workflows `web-tests.yml` and `godot-tests.yml` run these checks for relevant changes. Check individual job conclusions: a unit test success is not interchangeable with a Chromium or Godot result.

## Using the validator

1. Open `web/validator/index.html` on GitHub Pages or from a local web server.
2. Select one of the seven built-in templates, or upload an exported `*.layout.json`.
3. Enter the **actual** action IDs already handled by the target game (one per line).
4. Optionally provide representative game state as JSON to check binding paths and array fields.
5. Run validation; inspect error and warning codes.
6. Download the report for Codex or a pull request.

**Errors** indicate malformed/incompatible contracts or invalid data types, and should block integration. **Warnings** indicate missing handlers, bindings, touch-area risks or controls beyond the viewport. Some warnings may be justified by the game's UX; document that decision.

**Important:** Without action handlers or sample data, validation can only check the template's structure. The validator never claims to run or inspect the actual game's code.

## Runtime limitations

- Web renderer uses neutral DOM controls. The consuming game still owns viewport scaling, keyboard/gamepad handling, route transitions, persistence, focus restoration and visual theme.
- Godot adapter creates basic Control nodes at fixed design coordinates. The consuming game must handle responsive anchors, input mapping, visuals, threading and save logic.
- The Godot test project under `godot/` is isolated from `godot/demo/` and is intended for smoke tests, not production packaging.
- Browser tests use real Chromium, but do not replace manual UX or accessibility testing on physical devices.
- Data binding updates and action IDs are checked with mock data; tests cannot certify compatibility with an arbitrary existing game's data model.

## Recommended integration sign-off

The project's integration review should record: version 2 layout JSON, exported contract JSON, validator report, actual handler mappings, actual data mappings, target engine version, browser/Godot smoke result, desktop/mobile UX checks, navigation checks, and a regression check of existing saves and game mechanics.
