import {normalizeMap, serializeMap} from './model.js';
import {createZip} from '../package/zip.js';

export const slugMap = name => String(name || 'map').toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50) || 'map';
/** Make a map self-contained for Godot: the starter atlas becomes an embedded PNG. */
export function portableMap(doc, starterDataUrl) {
  if (typeof starterDataUrl !== 'string' || !/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(starterDataUrl)) throw new TypeError('Starter atlas PNG required');
  const safe = normalizeMap(doc);
  return {...safe, tilesets: safe.tilesets.map(set => set.src === 'builtin' ? {...set, src: starterDataUrl} : set)};
}
export function buildGodotZip(doc, starterDataUrl, adapterSource) {
  if (typeof adapterSource !== 'string' || !adapterSource.includes('extends Node2D')) throw new TypeError('Godot map loader source unavailable');
  const map = portableMap(doc, starterDataUrl), base = slugMap(doc.name);
  const files = new Map([
    ['maps/' + base + '.map.json', serializeMap(map)],
    ['runtime/map_loader.gd', adapterSource],
    ['manifest.json', JSON.stringify({format:'gdt-topdown-map-package', version:1, engine:'Godot 4.3+', map:'maps/' + base + '.map.json', runtime:'runtime/map_loader.gd', mapFormat:'gdt.topdown-map', collision:'grid with horizontal merged rectangle physics', markerTypes:[...new Set(map.objects.map(o=>o.type))]}, null, 2) + '\n'],
    ['CODEX_IMPORT.md', [
      '# Top-down map — Godot 4 integration',
      '',
      '1. Copy maps/ and runtime/ into your Godot project (for example res://maps/ and res://map_runtime/).',
      '2. Add a Node2D and attach runtime/map_loader.gd. Set map_path to res://maps/' + base + '.map.json in the Inspector.',
      '3. The adapter draws the layers in array order, decodes embedded atlas images, and builds blocking StaticBody2D shapes for collision cells.',
      '4. Use map.get_markers("player_spawn") and map.marker_position(marker) to place game entities. Handle enemy/exit/trigger/loot marker behavior in the game.',
      '5. Use map.is_blocked(Vector2i(x,y)), map.world_to_cell(position), and map.cell_to_local_center(cell) for game-side movement/logic.',
      '6. Ensure the player collision mask includes the exported blocking_layer. For animated tiles, navigation/pathfinding and scene transitions, integrate with the existing game systems.',
      '7. Preserve existing game saves. This is level data, not a save-file migration. Test the result in the target game before release.',
      '',
      'The adapter is a simple runtime renderer; it is not a TileMapLayer editor import, a NavigationServer region, or a complete game.',
      ''
    ].join('\n')]
  ]);
  return {files, bytes:createZip(files), map};
}
