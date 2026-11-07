# Phase 4 — One-click UI Integration Packages

Use the [Integration Package Builder](../web/package/index.html) to bundle one or more version-2 functional screen templates for Codex.

## Workflow

1. From the [Template Library](../web/catalog/index.html), click **Create integration ZIP** on a screen, or open the package builder directly.
2. Select up to **30** registered templates or import your own v2 `*.layout.json`. In the Functional UI Builder, **Package current layout** transfers the currently edited screen without first downloading it.
3. Select **Web / JavaScript** or **Godot 4**.
4. Optionally include the reusable UI behavior controllers. If the game already has these behaviors, this is not required.
5. Review unique actions, data bindings and layout warnings. Export the ZIP.
6. Provide the ZIP to Codex in the **target game's repository**, and ask it to follow `CODEX_INTEGRATION.md`.
7. Validate the resulting game UI against existing save data, game logic, navigation, keyboard/touch controls and device sizes.

## ZIP contents

```text
gdt-ui-[engine]-[N]-templates.zip
├── manifest.json
├── CODEX_INTEGRATION.md
├── layouts/
│   ├── inventory.layout.json
│   └── settings.layout.json
├── contracts/
│   ├── inventory.contract.json
│   └── settings.contract.json
├── validation/
│   ├── inventory.validation.json
│   └── settings.validation.json
└── runtime/
    ├── ... selected engine adapter files
    └── ... optional behavior controllers
```

Web packages contain the linked `schema.js`, `runtime.js`, and optional `runtime.css`, `behaviors.js`, `workflow.js`, `confirmation-dialog.js`. Godot packages contain `ui_layout.gd` and optionally `ui_behaviors.gd`.

The archive is generated **entirely in your browser**, from the checked-in toolkit files and selected layouts. It uses a standards-compatible ZIP store format with CRC-32 and needs no third-party library, account connection, local installation or backend server. A browser download is created only after the user selects **Download integration ZIP**.

## Integration boundaries

The package defines UI locations, component types, semantic roles, action IDs, data bindings and optional UI-only behavior controllers. It **does not** provide finished gameplay, assets, currencies, inventory state, crafting logic, purchases, network requests, scene transitions, or automatic game-code integration. Codex should inspect the actual target project and map these contracts to existing systems. Do not let generated UI code bypass validation for purchases, item changes, or save updates.

The `manifest.json` explicitly contains `integrationVerified: false`. The validation files contain *template structure* diagnostics; missing target handlers cannot be checked without the target game's code. Review warnings and run integration tests after Codex modifies the game.

The exporter accepts only version-2 functional layouts. Older version-1 visual studio files require manual remodeling in the function-first editor.

## Browser and development requirements

GitHub Pages serves the toolkit and its `web/` and `godot/` files from the same project origin, so the browser can bundle either engine's source. To test Godot package downloads on a local server, serve the **repository root**, not only `web/`. Web packages work when `web/` is served as the site root.

## Testing

- Unit tests: `cd web && npm test`. Package tests verify real checked-in runtime source files, correct action-contract and validation JSON, archive headers, CRC32 and ZIP directory structure.
- GitHub Actions Chromium smoke: 2560×1440 and 390×844 tests exercise two-template Web ZIP downloads and passing edited layouts from the builder.
- Godot adapter compatibility: the existing Godot CI jobs load all registered v2 templates and exercise action signals. The newly bundled GDScript sources are identical to the checked-in adapters; packages are not standalone runnable Godot projects.

See [Codex import guide](CODEX_UI_INTEGRATION.md) and [template library](TEMPLATE_LIBRARY.md).
