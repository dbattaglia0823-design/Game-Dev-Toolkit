# Godot 4 engineering conventions

**Applies to:** projects confirmed to run Godot 4. Check `project.godot` and the actual engine binary before assuming API or file-format compatibility.

## Change hygiene

- Inspect the relevant scenes (`.tscn`), scripts (`.gd`), resources (`.tres`), autoloads, groups, signals, and InputMap before editing.
- Favor changes within an existing system's ownership boundaries. Do not create duplicate managers or shadow existing save/economy logic.
- Preserve serialized scene paths, resource UIDs, node paths, signals, save formats and gameplay tuning unless change is intentional and migration-safe.
- Verify physics and AI using the actual time-step and units; isolate navigation geometry, decision updates and movement control for diagnosis.
- Check both gamepad/touch and desktop input mappings when a feature targets multiple devices.
- Treat assets as code dependencies: verify file naming/case, transparency, wheel anchor points, import settings, and sprite size against the consuming scene.
- Avoid loading sample/reference GDScript into a project when it declares conflicting global `class_name`; use proper integration or ignore reference-only folders.

## Verification

For a **real project**, from its repository root (adjust executable name/path for the environment):

    godot --headless --path . --import --quit
    godot --headless --path . --quit

Use dedicated GDScript tests or scene smoke tests if they exist; record exact commands, exit status and relevant errors. Import and editor parse checks do **not** prove rendering, driving feel, racing AI correctness or mobile touch behavior; use gameplay runs and screenshots/device tests where appropriate.

For this toolkit's isolated sample, follow `docs/VALIDATION.md` and `.github/workflows/godot-tests.yml`. Do not blindly run toolkit example tests as if they cover a consumer game.

## When applying shared UI components

Review `docs/UI_TEMPLATE_CONTRACT.md` and `docs/CODEX_UI_INTEGRATION.md`. Structural UI validation is not evidence that game-specific actions, save data, purchases or progression are integrated.
