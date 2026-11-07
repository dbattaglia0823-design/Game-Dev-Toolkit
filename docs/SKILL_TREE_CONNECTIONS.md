# Skill-tree Node Shapes & Connections

The function-first UI builder can now create connected skill-tree diagrams while keeping visual presentation and gameplay logic separate.

## Editing
1. Open **Functional UI Builder** and select **Skill tree**, or add a Button manually.
2. Select any Button/Slot, then choose **Rectangle**, **Rounded**, or **Circle** in its inspector. Circles keep equal width and height.
3. Click **Connect nodes**, then click one skill button followed by another. Lines attach to node boundaries.
4. Move or resize the buttons; lines update with their endpoints. Use the **Connections** list to remove any link.
5. Undo, redo, save, JSON export, and integration ZIP export preserve node shapes and the connection graph.

The template uses the existing v2 JSON format with backward-compatible optional fields:
```json
{
  "version": 2,
  "name": "Skill Tree",
  "viewport": {"width": 800, "height": 500},
  "nodes": [
    {"id":"a","type":"button","x":100,"y":100,"w":70,"h":70,"shape":"circle","label":"A","role":"skill_node","actionId":"skills.select_node","bindingKey":""},
    {"id":"b","type":"button","x":300,"y":180,"w":70,"h":70,"shape":"circle","label":"B","role":"skill_node","actionId":"skills.select_node","bindingKey":""}
  ],
  "edges":[{"from":"a","to":"b"}]
}
```

**Connections indicate relationships only.** They do not automatically enforce prerequisites, spend skill points, grant abilities, or unlock nodes. Codex must connect skill IDs and prerequisite rules to the game's existing progression system. The generated dependency list is available from `getContract(layout).connections`.

## Engine support
- Web runtime: lightweight SVG links placed behind buttons; separate `connections.js` geometry helper.
- Godot 4 runtime: `Line2D` connecting each pair of controls and optional circle/rounded `StyleBoxFlat` button style.
- Integration ZIP: Web packages include `connections.js` alongside the runtime; Godot packages include the updated adapter.

Old v2 layouts without `shape` or `edges` still import. Existing rectangular buttons are the default. Duplicate, missing-endpoint, or self-connections are rejected. Deleting a node removes its links. Renaming a node in the editor updates its connection endpoints.

## Validation
Browser Chromium smoke tests exercise connections and shape editing at 2560×1440 and mobile widths. Godot 4 headless tests verify circular button style and connection line counts. Target game tests are still required for skill prerequisites, locked/unlocked states, and interaction.
