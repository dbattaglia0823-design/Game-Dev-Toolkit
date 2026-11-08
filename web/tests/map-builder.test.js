import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FORMAT, createMap, createDemoMap, normalizeMap, parseMap, serializeMap, paintCells, paintCollision,
  floodFill, lineCells, rectangleCells, resizeMap, addLayer, updateLayer, moveLayer, removeLayer,
  addTileset, addObject, updateObject, removeObject, cellIndex
} from '../map-builder/model.js';
import {portableMap, buildGodotZip} from '../map-builder/export.js';
const tile=(index=0)=>({set:'starter',index});
const at=(map,x,y)=>map.layers[0].tiles[cellIndex(map,x,y)];

test('starter example and blank documents are validated, versioned and independent',()=>{
  const blank=createMap({width:4,height:3,tileSize:16});
  const demo=createDemoMap();
  assert.equal(blank.format,FORMAT);
  assert.equal(blank.layers.length,3);
  assert.equal(blank.collision.length,12);
  assert.ok(demo.objects.some(x=>x.type==='player_spawn'));
  assert.ok(demo.collision.some(Boolean));
  assert.deepEqual(parseMap(serializeMap(demo)),demo);
  assert.notEqual(blank.layers[0].tiles,demo.layers[0].tiles);
});
test('paint and erase work across layer boundaries without changing previous revisions',()=>{
  const a=createMap({width:4,height:3}),b=paintCells(a,'ground',[{x:0,y:0},{x:3,y:2},{x:-1,y:0}],tile(2));
  assert.equal(at(a,0,0),null);
  assert.deepEqual(at(b,0,0),tile(2));
  assert.deepEqual(at(b,3,2),tile(2));
  assert.equal(paintCells(b,'ground',[{x:0,y:0}],tile(2)),b);
  assert.equal(at(paintCells(b,'ground',[{x:0,y:0}],null),0,0),null);
  const locked=updateLayer(b,'ground',{locked:true});
  assert.equal(paintCells(locked,'ground',[{x:1,y:1}],tile(3)),locked);
  assert.equal(paintCollision(a,[{x:1,y:1},{x:42,y:0}],true).collision[5],1);
});
test('flood fill uses connected 4-neighborhood, stops at barriers and has a no-op fast path',()=>{
  let doc=createMap({width:3,height:3});
  doc=paintCells(doc,'ground',[{x:1,y:0},{x:1,y:1},{x:1,y:2}],tile(3));
  const filled=floodFill(doc,'ground',0,1,tile(2));
  assert.deepEqual(at(filled,0,0),tile(2));
  assert.deepEqual(at(filled,0,2),tile(2));
  assert.equal(at(filled,2,1),null);
  assert.deepEqual(at(filled,1,1),tile(3));
  assert.equal(floodFill(filled,'ground',0,1,tile(2)),filled);
});
test('line and rectangle include endpoints and support reversing',()=>{
  assert.deepEqual(lineCells(0,0,3,0).map(x=>x.x),[0,1,2,3]);
  assert.deepEqual(lineCells(3,3,1,1),[{x:3,y:3},{x:2,y:2},{x:1,y:1}]);
  assert.equal(rectangleCells(0,0,2,2).length,9);
  assert.equal(rectangleCells(2,2,0,0,false).length,8);
});
test('resize keeps in-bounds geometry and safely drops out-of-bounds markers',()=>{
  let doc=createMap({width:3,height:3});
  doc=paintCells(doc,'ground',[{x:1,y:1},{x:2,y:2}],tile(4));
  doc=addObject(doc,{x:2,y:2,type:'exit'});
  const resized=resizeMap(doc,2,4);
  assert.deepEqual(at(resized,1,1),tile(4));
  assert.equal(resized.layers[0].tiles.length,8);
  assert.equal(resized.objects.length,0);
  assert.equal(resizeMap(doc,doc.width,doc.height),doc);
});
test('layer operations preserve IDs, order and independent visibility',()=>{
  let doc=createMap();
  doc=addLayer(doc,'Fog');
  assert.equal(doc.layers.length,4);
  const id=doc.layers[3].id;
  doc=updateLayer(doc,id,{visible:false,locked:true,opacity:.4,name:'Shadows'});
  assert.equal(doc.layers[3].opacity,.4);
  assert.equal(doc.layers[3].visible,false);
  doc=moveLayer(doc,id,-1);
  assert.equal(doc.layers[2].id,id);
  doc=removeLayer(doc,id);
  assert.equal(doc.layers.length,3);
  assert.throws(()=>removeLayer({...doc,layers:[doc.layers[0]]},'ground'),/at least/);
});
test('markers and imported atlases are preserved across roundtrip',()=>{
  let doc=createMap({width:4,height:4});
  doc=addTileset(doc,{name:'Pixel art',src:'data:image/png;base64,aGVsbG8=',width:64,height:32});
  assert.equal(doc.tilesets[1].id,'atlas-1');
  doc=paintCells(doc,'ground',[{x:2,y:1}],{set:'atlas-1',index:1});
  doc=addObject(doc,{x:1,y:3,type:'trigger',properties:{target:'forest',enabled:true}});
  const id=doc.objects[0].id;
  doc=updateObject(doc,id,{name:'Bridge',x:2});
  assert.deepEqual(parseMap(serializeMap(doc)),doc);
  assert.equal(doc.objects[0].properties.target,'forest');
  assert.equal(removeObject(doc,id).objects.length,0);
});
test('malformed/hostile map files are rejected rather than migrated',()=>{
  const blank=createMap({width:2,height:2});
  assert.throws(()=>parseMap('{"version":2,"nodes":[]}'),/format/);
  assert.throws(()=>normalizeMap({...blank,width:500}),/width/);
  assert.throws(()=>normalizeMap({...blank,layers:[{...blank.layers[0],tiles:[]}]}),/layer/);
  assert.throws(()=>normalizeMap({...blank,tilesets:[{id:'bad',src:'data:image/svg+xml;base64,AA==',width:32,height:32}]}),/PNG/);
  assert.throws(()=>normalizeMap({...blank,objects:[{id:'x',type:'spawn',name:'X',x:10,y:0,properties:{}}]}),/object x/);
  assert.throws(()=>paintCells(blank,'ground',[{x:0,y:0}],{set:'missing',index:0}),/Unknown/);
  assert.throws(()=>addObject(blank,{x:2,y:2,type:'trigger'}),/object x/);
  assert.throws(()=>parseMap('x'.repeat(8_000_001)),/8 MB/);
});
test('portable exports embed the original atlas and include Godot runtime and map metadata',()=>{
  const doc=createDemoMap(),png='data:image/png;base64,aGVsbG8=';
  const result=portableMap(doc,png);
  assert.equal(result.tilesets[0].src,png);
  assert.equal(doc.tilesets[0].src,'builtin');
  const pkg=buildGodotZip(doc,png,'extends Node2D\nfunc load_from_file(path): pass\n');
  assert.ok(pkg.files.has('runtime/map_loader.gd'));
  assert.ok(pkg.files.has('maps/forest-crossing.map.json'));
  assert.deepEqual(JSON.parse(pkg.files.get('maps/forest-crossing.map.json')).tilesets[0].src,png);
  assert.equal(new DataView(pkg.bytes.buffer).getUint32(0,true),0x04034b50);
});
