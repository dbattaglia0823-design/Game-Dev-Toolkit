# Visual UI Builder (initial release)

Open [the UI builder](index.html) in a browser, or use the GitHub Pages URL `/web/builder/index.html`.

## What it does

- Choose **Blank**, **Main Menu**, or **Game HUD** presets.
- Click a component in the palette or drag it onto the 800 × 500 canvas.
- Add **panel**, **button**, **text**, **image placeholder**, and **progress bar** elements.
- Select an element and drag it to reposition. Use the property inspector to change x/y, width/height, label, fill, corner radius, and applicable text size/progress.
- Duplicate or delete individual elements, change the background, and clear the current layout.
- **Save in browser** saves a draft to browser-local storage (not GitHub).
- **Export JSON** downloads a portable, versioned layout file; **Import JSON** restores it.

This is a visual *layout editor*, not a live game engine or HTML/Godot exporter. The exported file stores component geometry and presentation data so future export adapters can convert it to HTML/CSS, Godot Control scenes, or runtime templates. Backgrounds and image elements use color fills/placeholders in this version.

## Limits and safety

- Layout format: `version: 1`, `title`, `background`, and `elements`.
- Maximum 100 elements; all types and ranges are validated on import. No arbitrary code is evaluated or injected as HTML.
- Canvas uses fixed 800 × 500 coordinate units; smaller windows can scroll horizontally. Mobile editing currently uses tap-to-add plus inspector controls; desktop supports drag and drop.
- There is no undo/redo, layer ordering, asset upload, resize handles, auto-layout or engine-specific export in this first iteration.
- Browser-local saves are per browser/device. Export JSON to preserve designs outside that device.
- Use `cd web && npm test` to run data-model tests. Manual browser smoke testing remains necessary for pointer dragging, colors, import/export and mobile layouts.

## Next steps

1. Add reusable presets and component variants (navigation, icons, image assets, inventory tiles, modal shells).
2. Add undo/redo, layers, snapping and responsive layout modes.
3. Build HTML/CSS and Godot 4 converters with explicit compatibility tests.
