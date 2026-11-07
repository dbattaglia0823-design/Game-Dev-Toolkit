# Visual UI showcase (web)

Open [index.html](index.html) in a browser to inspect the reusable dark-glass UI patterns, or deploy this folder using GitHub Pages. The static page uses only relative paths, ES modules, and no npm runtime dependencies.

## Screens

- **Components:** buttons, information cards, badges, progress bars, and single-visible notification demos.
- **Inventory:** data-driven filtering, sorting, selection, item detail layout and preview actions.
- **Upgrades:** mock credits/levels demonstrating state-driven visual updates and disabled button states.
- **Game HUD:** a scalable reference stage with damage, heal, and score controls.

The inventory and upgrade examples are **visual reference/demo implementations**, not production gameplay engines or validated persistent game systems. Use the existing web core stores to persist real game state after integration.

Reusable controllers are in `../ui/tabs.js`, `../ui/dialog.js`, `../ui/toast-manager.js` and the shared visual palette is `../ui/theme.css`. Showcase-only layout selectors are in `showcase.css`; copy or extract the needed styles, rather than importing the whole showcase into a game.

## Validation

1. Run `cd web && npm test` in Node 20+.
2. Open the showcase page in a browser (a local server is useful; GitHub Pages is easiest for browser-only workflows).
3. Check the tabs with arrow keys, Home/End and mouse/touch; dialogs with Escape and Close; item filtering and keyboard focus; upgrades when credits are insufficient; HUD limits; and reset.
4. Test at phone widths and keyboard-only navigation. Automated tests cover helper logic, not full browser accessibility or Godot runtime.

## GitHub Pages (optional)

On GitHub open **Settings → Pages → Build and deployment → Deploy from a branch**, select `main` and `/ (root)`, and save. Your resulting Pages site can serve `/web/showcase/`. GitHub Pages generally requires a public repository on Free plans; do not enable Pages if you want to keep repository contents private.

Note that changing a game's theme is done by overriding `--gdt-*` CSS variables. The gallery accent selector is a preview-only change.

## Game menu preview

Open the [reusable game menu demo](../menu-demo/) to test main menu, pause, settings, and game-over layouts. The underlying [menu controller](../ui/game-menu-controller.js) is standalone and unit-tested.
