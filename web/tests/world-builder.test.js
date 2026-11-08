import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createWorld,demoWorld,normalizeWorld,parseWorld,serializeWorld,createEntity,
  addSpriteAsset,updateEntity,removeEntity,getEntity,moveControlPoint,insertControlPoint,deleteControlPoint,
  reorderEntity,scatterVegetation} from '../map-builder/world-model.js';
import {distance,nearestOnPath,pointInPolygon,polygonArea,roadAt,regionAt,
  sampleRoad,roadIntersections,scatterPoints,seeded} from '../map-builder/world-geometry.js';
import {buildWorldZip,buildRoadNetwork} from '../map-builder/world-export.js';

const coords=(...xy)=>xy.map(([x,y])=>({x,y}));
test('v2 racing worlds have no tiles or cell grid and roundtrip with stable IDs',()=>{
  const world=createWorld({width:1400,height:900});
  assert.equal(world.format,'gdt.racing-world');
  assert.equal(world.version,2);
  assert.deepEqual(world.roads,[]);
  assert.equal(world.tileSize,undefined);
  assert.equal(world.layers,undefined);
  assert.deepEqual(parseWorld(serializeWorld(world)),world);
  const demo=demoWorld();
  assert.equal(demo.regions.length,8);
  assert.equal(demo.roads.length,9);
  assert.ok(demo.props.length>200);
  assert.ok(demo.markers.some(m=>m.type==='race_start'));
  assert.deepEqual(parseWorld(serializeWorld(demo)),demo);
  const ids=[...demo.roads,...demo.regions,...demo.props,...demo.markers].map(x=>x.id);
  assert.equal(new Set(ids).size,ids.length);
});

test('roads use continuous spline interpolation, preserve endpoints, and can be edited without mutating history',()=>{
  let world=createWorld({width:1400,height:1000});
  world=createEntity(world,'roads',{name:'Mountain bend',roadClass:'mountain',surface:'asphalt',
    width:36,lanes:2,shoulder:5,smooth:true,markings:true,
    points:coords([90,190],[400,180],[570,490],[950,620])});
  const road=world.roads[0],samples=sampleRoad(road.points,true,9);
  assert.ok(samples.length>20);
  assert.deepEqual(samples[0],road.points[0]);
  assert.deepEqual(samples.at(-1),road.points.at(-1));
  assert.ok(samples.every(x=>Number.isFinite(x.x)&&Number.isFinite(x.y)));
  assert.ok(sampleRoad(road.points,false).length===road.points.length);
  const updated=moveControlPoint(world,road.id,1,{x:420.75,y:260.25});
  assert.notDeepEqual(updated.roads[0].points,road.points);
  assert.deepEqual(world.roads[0].points[1],{x:400,y:180});
  const added=insertControlPoint(updated,road.id,2,{x:520,y:350});
  assert.equal(added.roads[0].points.length,5);
  assert.equal(deleteControlPoint(added,road.id,2).roads[0].points.length,4);
  assert.equal(roadAt(world,{x:90,y:190})?.surface,'asphalt');
  assert.equal(roadAt(world,{x:1100,y:900}),null);
  assert.ok(nearestOnPath({x:95,y:194},samples).distance<7);
});
test('roads cross and export a centerline network with junction IDs',()=>{
  let world=createWorld({width:1200,height:1000});
  const basic={roadClass:'city',surface:'asphalt',width:40,lanes:2,shoulder:2,markings:true,smooth:true};
  world=createEntity(world,'roads',{...basic,name:'East-West',points:coords([100,500],[1050,500])});
  world=createEntity(world,'roads',{...basic,name:'North-South',points:coords([500,100],[500,900])});
  const junctions=roadIntersections(world.roads);
  assert.equal(junctions.length,1);
  assert.equal(Math.round(junctions[0].x),500);
  assert.deepEqual(junctions[0].roads,[world.roads[0].id,world.roads[1].id]);
  const network=buildRoadNetwork(world);
  assert.equal(network.roads.length,2);
  assert.equal(network.connections.length,1);
  assert.equal(network.connections[0].kind,'crossing');
  assert.equal(network.verifiedNavigation,false);
});
test('freeform terrain zones support non-grid water and region selection',()=>{
  let world=createWorld({width:1200,height:900});
  const points=coords([600,0],[1200,0],[1200,900],[590,900],[650,470]);
  world=createEntity(world,'regions',{biome:'ocean',elevation:0,name:'Open ocean',points});
  assert.equal(regionAt(world,{x:1000,y:500})?.biome,'ocean');
  assert.equal(regionAt(world,{x:100,y:500}),null);
  assert.ok(pointInPolygon({x:1000,y:500},points));
  assert.ok(polygonArea(points)>100000);
  const moved=moveControlPoint(world,world.regions[0].id,0,{x:650.5,y:30.75});
  assert.equal(moved.regions[0].points[0].x,650.5);
  assert.equal(world.regions[0].points[0].x,600);
});
test('scenery scattering stays inside polygon, avoids roads, and has stable bounded output',()=>{
  let world=createWorld({width:1200,height:900});
  world=createEntity(world,'regions',{name:'Forest',biome:'forest',elevation:20,
    points:coords([50,50],[1100,50],[1100,800],[50,800])});
  world=scatterVegetation(world,world.regions[0].id,90);
  assert.equal(world.props.length,90);
  for(const p of world.props){
    assert.equal(p.type,'pine');
    assert.ok(pointInPolygon(p,world.regions[0].points));
    assert.ok(!roadAt(world,p));
  }
  const randomA=seeded(23),randomB=seeded(23);
  assert.deepEqual([randomA(),randomA(),randomA()],[randomB(),randomB(),randomB()]);
  const sample=scatterPoints(world.regions[0].points,10,42);
  assert.equal(sample.length,10);
  const sceneId=world.props[0].id;
  const moved=updateEntity(world,sceneId,{x:145.25,y:153.5,rotation:35.5});
  assert.equal(moved.props[0].x,145.25);
  assert.notEqual(world.props[0].x,moved.props[0].x);
});
test('racing markers, movement, layering and deletion preserve validity',()=>{
  let world=createWorld();
  world=createEntity(world,'markers',{type:'checkpoint',name:'Checkpoint A',x:453.55,y:215.35,
    rotation:0,properties:{lap:1,direction:[1,0]}});
  world=createEntity(world,'markers',{type:'finish',name:'Finish',x:650,y:470,rotation:90,properties:{}});
  const moved=reorderEntity(world,world.markers[0].id,1);
  assert.equal(moved.markers[0].type,'finish');
  assert.equal(world.markers[0].type,'checkpoint');
  assert.equal(getEntity(world,world.markers[0].id)?.type,'markers');
  assert.equal(removeEntity(world,world.markers[0].id).markers.length,1);
  assert.deepEqual(parseWorld(serializeWorld(world)),world);
});
test('hostile or mismatched imports fail safely without v1 migration',()=>{
  const doc=createWorld({width:1200,height:1000});
  assert.throws(()=>parseWorld('{"format":"gdt.topdown-map","version":1,"width":25}'),/Legacy Tile Editor/);
  assert.throws(()=>normalizeWorld({...doc,world:{...doc.world,width:Infinity}}),/world width/);
  assert.throws(()=>normalizeWorld({...doc,markers:[{id:'m-1',name:'Invalid',type:'checkpoint',x:-1,y:2,rotation:0,properties:{}}]}),/marker x/);
  assert.throws(()=>normalizeWorld({...doc,regions:[{id:'a',name:'Shape',biome:'forest',elevation:0,points:coords([0,0],[1,1],[2,2])}]}),/too small/);
  assert.throws(()=>createEntity(doc,'roads',{roadClass:'city',surface:'asphalt',width:20,lanes:2,shoulder:4,points:coords([10,20],[10,20])}),/length/);
  assert.throws(()=>createEntity(doc,'props',{type:'javascript',name:'Invalid',x:10,y:10,rotation:0,scale:1}),/prop type/);
  assert.throws(()=>createEntity(doc,'markers',{type:'custom',x:10,y:10,rotation:0,properties:JSON.parse('{"__proto__":{"polluted":true}}')}),/property key/);
  assert.throws(()=>parseWorld('x'.repeat(8_000_001)),/8 MB/);
});
test('Godot package contains map data, network, adapter, manifest and handoff',async()=>{
  const doc=demoWorld();
  const loader=await readFile(new URL('../../godot/world-kit/world_loader.gd',import.meta.url),'utf8');
  const mirror=await readFile(new URL('../map-builder/world_loader.gd',import.meta.url),'utf8');
  assert.equal(loader,mirror,'The browser and Godot adapter sources must stay synchronized');
  const zip=buildWorldZip(doc,loader);
  assert.ok(zip.files.has('runtime/world_loader.gd'));
  assert.ok(zip.files.has('worlds/coastal-ridge-open-world.world.json'));
  assert.ok(zip.files.has('navigation/coastal-ridge-open-world.roads.json'));
  assert.match(zip.files.get('CODEX_IMPORT.md'),/traffic AI/);
  assert.equal(zip.manifest.worldVersion,2);
  assert.equal(new DataView(zip.bytes.buffer).getUint32(0,true),0x04034b50);
  assert.equal(JSON.parse(zip.files.get(zip.manifest.worldFile)).roads.length,9);
});

test('embedded sprite assets roundtrip and validate references without external URLs',()=>{
  const src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAM0lEQVR4nO3OMQEAMAjEwKf2OlcYiosMlouBXN1+P4udzTkAAAAAAAAAAAAAAAAAAECSDFXjAnC0T3HoAAAAAElFTkSuQmCC';
  let world=createWorld({width:1400,height:900});
  world=addSpriteAsset(world,{name:'Warehouse artwork',src,width:32,height:32});
  assert.equal(world.assets.length,1);
  world=createEntity(world,'props',{name:'Garage with sprite',type:'garage',x:300,y:200,scale:1,rotation:0,assetId:world.assets[0].id});
  assert.equal(world.props[0].assetId,world.assets[0].id);
  assert.deepEqual(parseWorld(serializeWorld(world)),world);
  assert.equal(buildWorldZip(world,'extends Node2D\nfunc load_world(path): pass').manifest.worldVersion,2);
  assert.throws(()=>createEntity(world,'props',{type:'garage',x:4,y:5,scale:1,rotation:0,assetId:'asset-missing'}),/Unknown sprite asset/);
  assert.throws(()=>addSpriteAsset(world,{name:'Unsafe',src:'https://untrusted.example/sprite.png',width:32,height:32}),/embedded PNG/);
  assert.throws(()=>normalizeWorld({...world,assets:[]}),/Unknown sprite asset/);
});
