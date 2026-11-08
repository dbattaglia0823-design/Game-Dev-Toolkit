/** Top-down map format v1. Independent of UI layouts and game save schemas. */
export const FORMAT = 'gdt.topdown-map';
export const VERSION = 1;
export const MAX_SIDE = 128;
export const MAX_LAYERS = 12;
export const MAX_OBJECTS = 500;
export const MAX_TILESETS = 12;
const cleanName = (value, fallback, max = 80) => typeof value === 'string' ? (value.trim().slice(0, max) || fallback) : fallback;
const int = (value, min, max, label) => {
  if (!Number.isInteger(value) || value < min || value > max) throw new RangeError('Invalid ' + label);
  return value;
};
const safeId = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,60}$/.test(value);
const uniqueId = (prefix, used) => {
  let n = 1;
  while (used.has(prefix + '-' + n)) n++;
  return prefix + '-' + n;
};
const clone = value => structuredClone(value);
const emptyLayer = (id, name, size) => ({id, name, visible: true, locked: false, opacity: 1, tiles: Array(size).fill(null)});
export function createMap({name = 'Untitled map', width = 32, height = 24, tileSize = 32} = {}) {
  int(width, 1, MAX_SIDE, 'width'); int(height, 1, MAX_SIDE, 'height');
  int(tileSize, 8, 64, 'tile size');
  return {
    format: FORMAT, version: VERSION, name: cleanName(name, 'Untitled map'),
    width, height, tileSize,
    tilesets: [{id: 'starter', name: 'Starter tiles', src: 'builtin', width: 8 * tileSize, height: 4 * tileSize}],
    layers: [emptyLayer('ground', 'Ground', width * height), emptyLayer('details', 'Details', width * height), emptyLayer('overhead', 'Overhead', width * height)],
    collision: Array(width * height).fill(0), objects: []
  };
}
function checkTile(tile, tilesets, size) {
  if (tile === null) return null;
  if (!tile || typeof tile !== 'object' || !safeId(tile.set) || !Number.isInteger(tile.index)) throw new TypeError('Invalid tile');
  const ts = tilesets.find(set => set.id === tile.set);
  if (!ts || tile.index < 0 || tile.index >= (ts.width / size) * (ts.height / size)) throw new RangeError('Unknown tileset or tile index');
  return {set: tile.set, index: tile.index};
}
/** Imported documents are fully checked, not silently converted from UI layouts. */
export function normalizeMap(raw) {
  if (!raw || raw.format !== FORMAT || raw.version !== VERSION) throw new TypeError('Unsupported map format/version');
  const {width, height, tileSize} = raw;
  int(width, 1, MAX_SIDE, 'width'); int(height, 1, MAX_SIDE, 'height'); int(tileSize, 8, 64, 'tile size');
  const size = width * height;
  if (!Array.isArray(raw.tilesets) || !raw.tilesets.length || raw.tilesets.length > MAX_TILESETS) throw new RangeError('Invalid tilesets');
  const tileIds = new Set();
  const tilesets = raw.tilesets.map(set => {
    if (!set || !safeId(set.id) || tileIds.has(set.id)) throw new TypeError('Invalid/duplicate tileset id');
    tileIds.add(set.id);
    if (set.src !== 'builtin' && (typeof set.src !== 'string' || !/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(set.src) || set.src.length > 2_600_000)) throw new TypeError('Only embedded PNG/JPEG/WebP tilesets are supported');
    int(set.width, tileSize, 4096, 'atlas width'); int(set.height, tileSize, 4096, 'atlas height');
    if (set.width % tileSize || set.height % tileSize || (set.width / tileSize) * (set.height / tileSize) > 512) throw new RangeError('Tileset dimensions must be divisible by the grid size and contain at most 512 tiles');
    return {id: set.id, name: cleanName(set.name, set.id), src: set.src, width: set.width, height: set.height};
  });
  if (!Array.isArray(raw.layers) || !raw.layers.length || raw.layers.length > MAX_LAYERS) throw new RangeError('Invalid layers');
  const layerIds = new Set();
  const layers = raw.layers.map(layer => {
    if (!layer || !safeId(layer.id) || layerIds.has(layer.id) || !Array.isArray(layer.tiles) || layer.tiles.length !== size) throw new TypeError('Invalid layer');
    layerIds.add(layer.id);
    if (typeof layer.visible !== 'boolean' || typeof layer.locked !== 'boolean' || typeof layer.opacity !== 'number' || !Number.isFinite(layer.opacity) || layer.opacity < 0 || layer.opacity > 1) throw new TypeError('Invalid layer settings');
    return {id: layer.id, name: cleanName(layer.name, layer.id), visible: layer.visible, locked: layer.locked, opacity: layer.opacity, tiles: layer.tiles.map(tile => checkTile(tile, tilesets, tileSize))};
  });
  if (!Array.isArray(raw.collision) || raw.collision.length !== size || raw.collision.some(v => v !== 0 && v !== 1)) throw new TypeError('Invalid collision grid');
  if (!Array.isArray(raw.objects) || raw.objects.length > MAX_OBJECTS) throw new RangeError('Invalid objects');
  const objectIds = new Set();
  const objects = raw.objects.map(obj => {
    if (!obj || !safeId(obj.id) || objectIds.has(obj.id)) throw new TypeError('Invalid/duplicate object id');
    objectIds.add(obj.id);
    int(obj.x, 0, width - 1, 'object x'); int(obj.y, 0, height - 1, 'object y');
    const kind = cleanName(obj.type, 'marker', 40);
    if (!/^[a-zA-Z0-9_-]+$/.test(kind)) throw new TypeError('Invalid marker type');
    const properties = obj.properties ?? {};
    if (!properties || Array.isArray(properties) || typeof properties !== 'object' || JSON.stringify(properties)?.length > 4000) throw new TypeError('Invalid object properties');
    return {id: obj.id, type: kind, name: cleanName(obj.name, kind), x: obj.x, y: obj.y, properties: JSON.parse(JSON.stringify(properties))};
  });
  return {format: FORMAT, version: VERSION, name: cleanName(raw.name, 'Untitled map'), width, height, tileSize, tilesets, layers, collision: raw.collision.slice(), objects};
}
export function parseMap(json) {
  if (typeof json !== 'string' || json.length > 8_000_000) throw new RangeError('Map JSON exceeds 8 MB');
  return normalizeMap(JSON.parse(json));
}
export const serializeMap = doc => JSON.stringify(normalizeMap(doc), null, 2) + '\n';
export const inBounds = (doc, x, y) => Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < doc.width && y < doc.height;
export const cellIndex = (doc, x, y) => y * doc.width + x;
export function paintCells(doc, layerId, positions, tile) {
  const index = doc.layers.findIndex(l => l.id === layerId);
  if (index < 0 || doc.layers[index].locked) return doc;
  const checked = checkTile(tile, doc.tilesets, doc.tileSize);
  const tiles = doc.layers[index].tiles.slice();
  let changed = false;
  for (const pos of positions) {
    if (!inBounds(doc, pos.x, pos.y)) continue;
    const at = cellIndex(doc, pos.x, pos.y);
    if (tiles[at]?.set === checked?.set && tiles[at]?.index === checked?.index) continue;
    tiles[at] = checked ? {...checked} : null; changed = true;
  }
  if (!changed) return doc;
  const layers = doc.layers.slice();
  layers[index] = {...layers[index], tiles};
  return {...doc, layers};
}
export function paintCollision(doc, positions, blocked) {
  const value = blocked ? 1 : 0;
  const collision = doc.collision.slice();
  let changed = false;
  for (const pos of positions) {
    if (!inBounds(doc, pos.x, pos.y)) continue;
    const at = cellIndex(doc, pos.x, pos.y);
    if (collision[at] !== value) {collision[at] = value; changed = true;}
  }
  return changed ? {...doc, collision} : doc;
}
export function floodFill(doc, layerId, x, y, tile) {
  const layer = doc.layers.find(l => l.id === layerId);
  if (!layer || layer.locked || !inBounds(doc, x, y)) return doc;
  const checked = checkTile(tile, doc.tilesets, doc.tileSize);
  const original = layer.tiles[cellIndex(doc, x, y)];
  if (original?.set === checked?.set && original?.index === checked?.index) return doc;
  const equals = t => t?.set === original?.set && t?.index === original?.index;
  const seen = new Uint8Array(doc.width * doc.height);
  const stack = [cellIndex(doc, x, y)], points = [];
  while (stack.length) {
    const i = stack.pop();
    if (i < 0 || i >= seen.length || seen[i] || !equals(layer.tiles[i])) continue;
    seen[i] = 1;
    const cx = i % doc.width, cy = Math.floor(i / doc.width);
    points.push({x: cx, y: cy});
    if (cx > 0) stack.push(i - 1);
    if (cx + 1 < doc.width) stack.push(i + 1);
    if (cy > 0) stack.push(i - doc.width);
    if (cy + 1 < doc.height) stack.push(i + doc.width);
  }
  return paintCells(doc, layerId, points, checked);
}
export function lineCells(x0, y0, x1, y1) {
  const cells = [];
  let dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
  let dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1, err = dx + dy;
  while (true) {
    cells.push({x: x0, y: y0});
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {err += dy; x0 += sx;}
    if (e2 <= dx) {err += dx; y0 += sy;}
  }
  return cells;
}
export function rectangleCells(x0, y0, x1, y1, filled = true) {
  const cells = [];
  const minX = Math.min(x0, x1), maxX = Math.max(x0, x1);
  const minY = Math.min(y0, y1), maxY = Math.max(y0, y1);
  for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++)
    if (filled || x === minX || x === maxX || y === minY || y === maxY) cells.push({x, y});
  return cells;
}
export function resizeMap(doc, width, height) {
  int(width, 1, MAX_SIDE, 'width'); int(height, 1, MAX_SIDE, 'height');
  if (doc.width === width && doc.height === height) return doc;
  const resize = (array, blank) => {
    const out = Array(width * height).fill(blank);
    for (let y = 0; y < Math.min(height, doc.height); y++)
      for (let x = 0; x < Math.min(width, doc.width); x++) out[y * width + x] = array[y * doc.width + x];
    return out;
  };
  return {...doc, width, height, collision: resize(doc.collision, 0),
    layers: doc.layers.map(layer => ({...layer, tiles: resize(layer.tiles, null)})),
    objects: doc.objects.filter(o => o.x < width && o.y < height)};
}
export function addLayer(doc, name = 'Layer') {
  if (doc.layers.length >= MAX_LAYERS) throw new RangeError('Maximum layers reached');
  return {...doc, layers: [...doc.layers, emptyLayer(uniqueId('layer', new Set(doc.layers.map(l => l.id))), cleanName(name, 'Layer'), doc.width * doc.height)]};
}
export function updateLayer(doc, id, patch) {
  if (!doc.layers.some(l => l.id === id)) return doc;
  return {...doc, layers: doc.layers.map(l => l.id !== id ? l : {...l,
    name: patch.name === undefined ? l.name : cleanName(patch.name, l.name),
    visible: typeof patch.visible === 'boolean' ? patch.visible : l.visible,
    locked: typeof patch.locked === 'boolean' ? patch.locked : l.locked,
    opacity: typeof patch.opacity === 'number' && patch.opacity >= 0 && patch.opacity <= 1 ? patch.opacity : l.opacity
  })};
}
export function moveLayer(doc, id, shift) {
  const i = doc.layers.findIndex(l => l.id === id), j = i + shift;
  if (i < 0 || j < 0 || j >= doc.layers.length) return doc;
  const layers = doc.layers.slice();
  [layers[i], layers[j]] = [layers[j], layers[i]];
  return {...doc, layers};
}
export function removeLayer(doc, id) {
  if (doc.layers.length <= 1) throw new RangeError('A map needs at least one layer');
  return {...doc, layers: doc.layers.filter(l => l.id !== id)};
}
export function addTileset(doc, set) {
  if (doc.tilesets.length >= MAX_TILESETS) throw new RangeError('Maximum tilesets reached');
  const id = uniqueId('atlas', new Set(doc.tilesets.map(s => s.id)));
  const copy = normalizeMap({...doc, tilesets: [...doc.tilesets, {...set, id}]});
  return copy;
}
export function addObject(doc, {x, y, type = 'spawn', name, properties = {}}) {
  if (doc.objects.length >= MAX_OBJECTS) throw new RangeError('Maximum objects reached');
  const id = uniqueId('object', new Set(doc.objects.map(o => o.id)));
  return normalizeMap({...doc, objects: [...doc.objects, {id, x, y, type, name: name || type, properties}]});
}
export function updateObject(doc, id, patch) {
  return normalizeMap({...doc, objects: doc.objects.map(o => o.id === id ? {...o, ...patch, id} : o)});
}
export function removeObject(doc, id) {
  return {...doc, objects: doc.objects.filter(o => o.id !== id)};
}
export function createDemoMap() {
  let doc = createMap({name: 'Forest crossing', width: 36, height: 25});
  const ground = doc.layers[0].tiles.slice(), detail = doc.layers[1].tiles.slice(), collision = doc.collision.slice();
  const put = (layer, x, y, index) => {if (inBounds(doc, x, y)) layer[cellIndex(doc, x, y)] = {set: 'starter', index};};
  for (let y = 0; y < doc.height; y++) for (let x = 0; x < doc.width; x++) {
    put(ground, x, y, (x * 13 + y * 7) % 11 === 0 ? 1 : 0);
    if (Math.abs(y - (11 + Math.round(Math.sin(x * .25) * 2))) < 2) put(ground, x, y, 2);
    if ((x < 7 && y < 6) || (x > 28 && y > 18)) {
      put(ground, x, y, 5);
      collision[cellIndex(doc, x, y)] = 1;
    }
    if (x > 10 && x < 25 && y > 3 && y < 7) put(ground, x, y, 3);
    if ((x * 11 + y * 23) % 89 === 0 && collision[cellIndex(doc, x, y)] === 0) put(detail, x, y, 18);
    if ((x * 29 + y * 17) % 131 === 0 && collision[cellIndex(doc, x, y)] === 0) {put(detail, x, y, 12); collision[cellIndex(doc, x, y)] = 1;}
  }
  doc = {...doc, layers: [{...doc.layers[0], tiles: ground}, {...doc.layers[1], tiles: detail}, doc.layers[2]], collision};
  return addObject(addObject(doc, {x: 9, y: 11, type: 'player_spawn', name: 'Player start'}), {x: 23, y: 11, type: 'exit', name: 'To village', properties: {target: 'village'}}); 
}
