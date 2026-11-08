import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createWorld,demoWorld,normalizeWorld,parseWorld,serializeWorld,createEntity,
  addSpriteAsset,updateEntity,removeEntity,getEntity,moveControlPoint,insertControlPoint,deleteControlPoint,
  reorderEntity,scatterVegetation} from '../map-builder/world-model.js';
import {distance,nearestOnPath,pointInPolygon,polygonArea,roadAt,regionAt,
  sampleRoad,roadIntersections,scatterPoints,seeded} from '../map-builder/world-geometry.js';
import {buildWorldZip,buildRoadNetwork,worldSlug} from '../map-builder/world-export.js';
import {buildRoadJunctions} from '../map-builder/world-junctions.js';
import {roadInsertCandidate,regionInsertCandidate,insertShapePoint,translateEntity,
  duplicateEntity,paintSceneryBrush,eraseSceneryBrush} from '../map-builder/world-edit-tools.js';
import {nearestRoadPlacement,roadwayClearance,placementFootprint,placeBesideRoad,
  placeSiteMarker,repairRoadsideObjects,normalizeAngle} from '../map-builder/world-road-placement.js';

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


test('new road insertion maps curved samples back to their original editable span',()=>{
  let doc=createWorld({width:1600,height:1400});
  doc=createEntity(doc,'roads',{name:'Hairpin',roadClass:'mountain',surface:'asphalt',
    width:34,lanes:2,shoulder:4,markings:true,smooth:true,
    points:coords([120,650],[440,210],[850,800],[1200,590])});
  const road=doc.roads[0];
  const sample=sampleRoad(road.points,true,9);
  const target=sample[Math.round(sample.length*.45)];
  const hit=roadInsertCandidate(road,{x:target.x+3,y:target.y+2});
  assert.ok(hit.distance<5,'Select a point on the actual curved centerline');
  assert.ok(hit.index>=1&&hit.index<=3);
  const added=insertShapePoint(doc,road.id,{x:target.x+3,y:target.y+2},{maxDistance:20});
  assert.equal(added.doc.roads[0].points.length,5);
  assert.deepEqual(added.doc.roads[0].points[added.index],{x:added.point.x,y:added.point.y});
  assert.deepEqual(doc.roads[0].points,road.points,'Existing control points must remain unmodified');
  assert.throws(()=>insertShapePoint(doc,road.id,{x:1500,y:1400},{maxDistance:10}),/Click close/);
  const appended=insertShapePoint(doc,road.id,{x:1400,y:800},{mode:'end'});
  assert.deepEqual(appended.doc.roads[0].points.at(-1),{x:1400,y:800});
  const prepended=insertShapePoint(doc,road.id,{x:20,y:500},{mode:'start'});
  assert.deepEqual(prepended.doc.roads[0].points[0],{x:20,y:500});
  assert.deepEqual(parseWorld(serializeWorld(added.doc)),added.doc,'New road points must survive exports');
});
test('terrain polygon insertion supports closing edge, then point movement/removal',()=>{
  let doc=createWorld();
  doc=createEntity(doc,'regions',{name:'Coast',biome:'beach',elevation:0,points:coords([60,80],[450,80],[450,450],[60,450])});
  const region=doc.regions[0];
  const hit=regionInsertCandidate(region,{x:52,y:260});
  assert.equal(hit.index,region.points.length,'Closing edge must insert at the array end');
  const result=insertShapePoint(doc,region.id,{x:52,y:260},{maxDistance:20});
  assert.equal(result.doc.regions[0].points.length,5);
  assert.deepEqual(result.point,{x:60,y:260});
  assert.equal(moveControlPoint(result.doc,region.id,result.index,{x:20,y:250}).regions[0].points[result.index].x,20);
  assert.equal(deleteControlPoint(result.doc,region.id,result.index).regions[0].points.length,4);
});
test('duplicate and translate roads, terrain, props and markers without modifying originals',()=>{
  let doc=createWorld({width:1200,height:1000});
  doc=createEntity(doc,'roads',{name:'Ridge',roadClass:'country',surface:'gravel',width:24,lanes:1,
    shoulder:2,markings:false,smooth:true,points:coords([100,150],[320,250],[500,330])});
  const road=doc.roads[0],beforeLength=road.points.length;
  let out=duplicateEntity(doc,road.id,45);
  assert.equal(out.doc.roads.length,2);assert.notEqual(out.id,road.id);
  assert.equal(out.doc.roads[1].points.length,beforeLength);
  assert.equal(out.doc.roads[1].name,'Ridge copy');
  assert.equal(out.doc.roads[1].points[0].x,145);
  const translated=translateEntity(out.doc,road.id,120,75);
  assert.equal(translated.roads[0].points[0].x,220);
  assert.equal(translated.roads[0].points[0].y,225);
  assert.deepEqual(out.doc.roads[0].points,road.points);
  doc=createEntity(doc,'markers',{name:'Finish',type:'finish',x:1000,y:900,rotation:0,properties:{laps:3}});
  out=duplicateEntity(doc,doc.markers[0].id,90);
  assert.equal(out.doc.markers.length,2);
  assert.deepEqual(out.doc.markers[1].properties,{laps:3});
  assert.deepEqual(parseWorld(serializeWorld(out.doc)),out.doc);
  const moved=translateEntity(doc,doc.markers[0].id,600,900);
  assert.equal(moved.markers[0].x,1200);
  assert.equal(moved.markers[0].y,1000);
  assert.throws(()=>duplicateEntity(doc,'unknown'),/Select an entity/);
});
test('drag scenery brush uses world-space radius, spacing, road/water avoidance and safe output',()=>{
  let doc=createWorld({width:1600,height:1100,seed:33});
  doc=createEntity(doc,'regions',{name:'Ocean',biome:'ocean',elevation:0,
    points:coords([1200,0],[1600,0],[1600,1100],[1200,1100])});
  doc=createEntity(doc,'roads',{name:'Straight highway',roadClass:'highway',surface:'asphalt',
    width:80,lanes:2,shoulder:4,markings:true,smooth:false,points:coords([0,530],[1600,530])});
  const rand=seeded(500);
  const brush={type:'pine',radius:120,spacing:27,count:12,variation:true,avoidRoads:true,avoidWater:true};
  const first=paintSceneryBrush(doc,{x:800,y:300},brush,rand);
  assert.ok(first.props.length>0);
  assert.ok(first.props.every(p=>distance(p,{x:800,y:300})<=120));
  assert.ok(first.props.every(p=>!roadAt(first,p)));
  assert.ok(first.props.every((p,i)=>first.props.slice(0,i).every(q=>distance(p,q)>=27)));
  assert.equal(doc.props.length,0,'Original document must remain unchanged');
  assert.deepEqual(parseWorld(serializeWorld(first)),first);
  const water=paintSceneryBrush(doc,{x:1450,y:300},{...brush,radius:50},seeded(4));
  assert.equal(water,doc,'Water avoidance prevents painting');
  const eraser=eraseSceneryBrush(first,{x:800,y:300},120);
  assert.equal(eraser.props.length,0);
  assert.equal(first.props.length>0,true);
  assert.equal(eraseSceneryBrush(doc,{x:800,y:300},120),doc,'Empty eraser stroke is a no-op');
  assert.throws(()=>paintSceneryBrush(doc,{x:50,y:50},{...brush,radius:-2}),/Brush radius/);
  assert.throws(()=>paintSceneryBrush(doc,{x:50,y:50},{...brush,count:100}),/Brush density/);
});


test('Atlas Coast master world is a valid large freeform world with integrated districts, venues and classed dealerships',async()=>{
  const raw=await readFile(new URL('../map-builder/atlas-coast.world.json',import.meta.url),'utf8');
  const mega=parseWorld(raw);
  assert.equal(mega.world.width,22000);
  assert.equal(mega.world.height,18000);
  assert.equal(mega.format,'gdt.racing-world');
  assert.equal(mega.roads.length,132);
  assert.equal(mega.regions.length,32);
  assert.ok(mega.props.length>=1900);
  assert.ok(mega.markers.length>=130);
  const biomes=new Set(mega.regions.map(r=>r.biome));
  for(const biome of ['city','forest','mountain','rock','beach','ocean','lake','farmland'])
    assert.ok(biomes.has(biome),'Missing '+biome+' biome');
  const roads=mega.roads;
  assert.ok(roads.some(r=>r.roadClass==='highway'&&r.lanes>=4));
  assert.ok(roads.some(r=>r.roadClass==='track'&&r.surface==='dirt'));
  assert.ok(roads.some(r=>r.roadClass==='track'&&r.surface==='track'));
  assert.ok(roads.some(r=>r.roadClass==='mountain'));
  const markers=mega.markers;
  const byType=type=>markers.filter(m=>m.type===type);
  assert.ok(byType('dealership').length>=10);
  assert.ok(byType('garage').length>=15);
  assert.ok(byType('fuel').length>=15);
  assert.equal(byType('race_start').length,7);
  assert.ok(byType('fast_travel').length>=8);
  assert.ok(byType('player_spawn').length>=1);
  const supportedClasses=new Set(byType('dealership').flatMap(d=>d.properties.classes));
  assert.deepEqual([...supportedClasses].sort(),['A','B','C','D','S']);
  for(const race of byType('race_start'))
    assert.ok(roads.some(r=>r.id===race.properties.roadId),'Race start '+race.name+' must reference a real road');
  for(const entity of [...mega.props,...mega.markers])
    assert.ok(entity.x>=0&&entity.x<=mega.world.width&&entity.y>=0&&entity.y<=mega.world.height);
  assert.deepEqual(parseWorld(serializeWorld(mega)),mega);
  assert.ok(!('tiles' in mega)&&!('tileSize' in mega),'Master map must remain freeform');
});
test('Atlas Coast sampled road network and Godot ZIP remain exportable with spatial junction indexing',async()=>{
  const world=parseWorld(await readFile(new URL('../map-builder/atlas-coast.world.json',import.meta.url),'utf8'));
  const graph=buildRoadNetwork(world);
  assert.equal(graph.roads.length,world.roads.length);
  assert.ok(graph.connections.length>70,'Connected highway and city streets should yield junctions');
  assert.equal(graph.verifiedNavigation,false);
  assert.ok(graph.roads.find(r=>r.name.includes('Meridian Cross-State')).centerline.length>30);
  const source=await readFile(new URL('../map-builder/world_loader.gd',import.meta.url),'utf8');
  const pkg=buildWorldZip(world,source);
  assert.ok(pkg.bytes.length>world.roads.length);
  assert.equal(pkg.manifest.gameplayIntegrated,false);
  assert.equal(parseWorld(pkg.files.get('worlds/atlas-coast-grand-touring-open-world.world.json')).roads.length,132);
});
test('separate intersecting road pairs retain their own junction references',()=>{
  const base=createWorld({width:1200,height:1200});
  const standard={roadClass:'city',surface:'asphalt',width:35,lanes:2,shoulder:4,smooth:false,markings:true};
  let doc=createEntity(base,'roads',{...standard,name:'East West',points:coords([100,500],[900,500])});
  doc=createEntity(doc,'roads',{...standard,name:'North South',points:coords([500,100],[500,900])});
  doc=createEntity(doc,'roads',{...standard,name:'Diagonal',points:coords([100,100],[900,900])});
  const hit=roadIntersections(doc.roads);
  assert.equal(hit.length,3,'All three intersecting road pairs need navigation hints');
  assert.equal(new Set(hit.map(h=>h.roads.join(','))).size,3);
});


test('roadside placement aligns houses to actual curved road tangents and avoids shoulders',()=>{
  let doc=createWorld({width:1800,height:1600});
  const roadBase={name:'Riverside Crescent',roadClass:'city',surface:'asphalt',
    width:52,lanes:2,shoulder:7,markings:true,smooth:true,
    points:coords([120,520],[430,690],[710,510],[1020,700],[1500,510])};
  doc=createEntity(doc,'roads',roadBase);
  const polyline=sampleRoad(doc.roads[0].points,true,9);
  const probe=polyline[Math.floor(polyline.length*.55)];
  doc=createEntity(doc,'props',{name:'Curve house',type:'house',x:probe.x,y:probe.y,
    scale:1,rotation:0,assetId:''});
  const house=doc.props[0],r=placementFootprint(doc,house);
  assert.ok(roadwayClearance(doc,house,r)>=0,'Building footprint must clear road and shoulder');
  assert.ok(distance(house,probe)>52/2+7+40,'Building must shift off the road');
  const near=nearestRoadPlacement(doc,house,200);
  assert.ok(near,'Placed house should remain by the curved street');
  const side=(house.x-near.x)*near.normal.x+(house.y-near.y)*near.normal.y>=0?1:-1;
  const expected=normalizeAngle(Math.atan2(near.tangent.y,near.tangent.x)*180/Math.PI+
    (side>0?180:0));
  const delta=normalizeAngle(house.rotation-expected);
  assert.ok(Math.abs(delta)<14,'Facade should follow local spline tangent rather than fixed 90-degree grid: '+delta);
  assert.ok(Math.abs(house.rotation)%90>3,'Curve alignment should not default to four cardinal directions');
});
test('all editor model mutations protect scenery: placement, numerical move, resizing and manual rotation',()=>{
  let doc=createWorld({width:1500,height:1000});
  doc=createEntity(doc,'roads',{name:'Main street',roadClass:'city',surface:'asphalt',width:54,
    lanes:2,shoulder:6,markings:true,smooth:false,points:coords([80,500],[1440,500])});
  doc=createEntity(doc,'props',{name:'Showroom',type:'building',x:350,y:500,rotation:15,scale:1,assetId:''});
  const p=doc.props[0];
  assert.ok(roadwayClearance(doc,p,placementFootprint(doc,p))>=0);
  assert.ok(Math.abs(p.rotation)%180<.5,'Road parallel east-west means a north/south facing facade');
  doc=updateEntity(doc,p.id,{x:720,y:500});
  assert.ok(roadwayClearance(doc,doc.props[0],placementFootprint(doc,doc.props[0]))>=0);
  doc=updateEntity(doc,p.id,{scale:2.4});
  assert.ok(roadwayClearance(doc,doc.props[0],placementFootprint(doc,doc.props[0]))>=0);
  doc=updateEntity(doc,p.id,{rotation:41});
  assert.equal(doc.props[0].rotation,41,'Manual sprite rotation remains possible');
  assert.ok(roadwayClearance(doc,doc.props[0],placementFootprint(doc,doc.props[0]))>=0);
  const duplicated=duplicateEntity(doc,p.id);
  assert.ok(roadwayClearance(duplicated.doc,duplicated.doc.props.at(-1),
    placementFootprint(duplicated.doc,duplicated.doc.props.at(-1)))>=0);
  const translated=translateEntity(doc,p.id,0,-450);
  assert.ok(roadwayClearance(translated,translated.props[0],
    placementFootprint(translated,translated.props[0]))>=0);
  assert.equal(duplicated.doc.roads.length,1);
});
test('site markers are roadside, but race/checkpoint and traffic spawns intentionally stay on road',()=>{
  let doc=createWorld({width:1600,height:900});
  doc=createEntity(doc,'roads',{name:'Start straight',roadClass:'track',surface:'track',
    width:52,lanes:2,shoulder:6,markings:true,smooth:false,points:coords([100,400],[1500,400])});
  doc=createEntity(doc,'markers',{name:'Car dealership',type:'dealership',x:350,y:400,
    rotation:0,properties:{classes:['C','B','A']}});
  assert.ok(roadwayClearance(doc,doc.markers[0],26)>=0);
  doc=createEntity(doc,'markers',{name:'Race Start',type:'race_start',x:550,y:400,rotation:0,properties:{}});
  doc=createEntity(doc,'markers',{name:'Checkpoint',type:'checkpoint',x:850,y:400,rotation:0,properties:{}});
  doc=createEntity(doc,'markers',{name:'Traffic Spawn',type:'traffic_spawn',x:1050,y:400,rotation:0,properties:{}});
  assert.equal(doc.markers[1].y,400);
  assert.equal(doc.markers[2].y,400);
  assert.equal(doc.markers[3].y,400);
  doc=updateEntity(doc,doc.markers[0].id,{x:700,y:400});
  assert.ok(roadwayClearance(doc,doc.markers[0],26)>=0);
});
test('scenery paint and region scatter cannot put a prop on a road even if avoidRoads option is false',()=>{
  let doc=createWorld({width:1500,height:1000,seed:30});
  doc=createEntity(doc,'roads',{name:'Asphalt lane',roadClass:'city',surface:'asphalt',
    width:80,lanes:2,shoulder:8,smooth:false,markings:true,
    points:coords([100,500],[1400,500])});
  doc=createEntity(doc,'regions',{name:'Roadside meadow',biome:'grass',elevation:0,
    points:coords([100,280],[1400,280],[1400,770],[100,770])});
  const brush=paintSceneryBrush(doc,{x:700,y:500},{type:'oak',count:12,radius:140,
    spacing:25,avoidRoads:false,avoidWater:true,variation:false},seeded(99));
  for(const p of brush.props)assert.ok(roadwayClearance(brush,p,placementFootprint(brush,p))>=0);
  const filled=scatterVegetation(doc,doc.regions[0].id,40);
  for(const p of filled.props)assert.ok(roadwayClearance(filled,p,placementFootprint(filled,p))>=0);
});
test('road shape updates can reflow existing scene props without changing race checkpoints',()=>{
  let doc=createWorld({width:1500,height:1000});
  doc=createEntity(doc,'props',{name:'Unmoved Cottage',type:'house',x:650,y:510,scale:1,rotation:45,assetId:''});
  doc=createEntity(doc,'markers',{name:'Checkpoint',type:'checkpoint',x:850,y:500,rotation:0,properties:{}});
  doc=createEntity(doc,'roads',{name:'New boulevard',roadClass:'city',surface:'asphalt',width:60,
    lanes:2,shoulder:6,smooth:true,markings:true,
    points:coords([150,400],[700,510],[1200,600])});
  assert.ok(roadwayClearance(doc,doc.props[0],placementFootprint(doc,doc.props[0]))<0);
  const fixed=repairRoadsideObjects(doc,{alignAll:false});
  assert.equal(fixed.failed,0);
  assert.ok(fixed.moved>=1);
  assert.ok(roadwayClearance(fixed.doc,fixed.doc.props[0],placementFootprint(fixed.doc,fixed.doc.props[0]))>=0);
  assert.deepEqual(fixed.doc.markers[0],doc.markers[0]);
});
test('Atlas Coast organic city roads and full world props pass conservative roadway clearance',async()=>{
  const atlas=parseWorld(await readFile(new URL('../map-builder/atlas-coast.world.json',import.meta.url),'utf8'));
  const gridNames=atlas.roads.filter(r=>/North-South \d+|East-West \d+|Village Street \d+|South Harbor Street \d+/.test(r.name));
  assert.equal(gridNames.length,0,'Original repetitive numbered city grids should be replaced');
  const organic=atlas.roads.filter(r=>['city','country'].includes(r.roadClass)&&r.points.length>=5&&r.smooth);
  assert.ok(organic.length>=60,'Cities should feature curved, irregular block-scale streets');
  const rotations=new Set(atlas.props.filter(p=>['building','house','warehouse','garage','parking'].includes(p.type))
    .map(p=>Math.round(p.rotation/10)*10));
  assert.ok(rotations.size>=10,'Road-facing facades need varied angles for organic streets');
  for(const p of atlas.props){
    const clearance=roadwayClearance(atlas,p,placementFootprint(atlas,p));
    assert.ok(clearance>=-0.03,'Atlas object overlaps a road: '+p.name+' ('+p.id+') gap '+clearance);
  }
  for(const m of atlas.markers.filter(m=>['garage','dealership','fuel'].includes(m.type)))
    assert.ok(roadwayClearance(atlas,m,26)>=-0.05,'Atlas site marker overlaps road: '+m.name);
  assert.equal(atlas.markers.filter(m=>m.type==='race_start').length,7);
  assert.equal(atlas.roads.length,132);
  assert.equal(atlas.props.length,2079);
});


test('automatic junction polygons clear markings and connect crossing roads of any width',()=>{
  let world=createWorld({width:1200,height:1000});
  const defaults={roadClass:'city',surface:'asphalt',lanes:2,shoulder:5,smooth:false,markings:true};
  world=createEntity(world,'roads',{...defaults,name:'Broadway',width:54,points:coords([100,450],[1100,450])});
  world=createEntity(world,'roads',{...defaults,name:'Birch Avenue',width:32,points:coords([500,120],[500,900])});
  const junctions=buildRoadJunctions(world.roads);
  assert.equal(junctions.length,1);
  const j=junctions[0];
  assert.equal(j.kind,'crossing');
  assert.equal(j.roads.length,2);
  assert.ok(j.polygon.length>=4,'Crossing surface should use an intersection footprint polygon');
  assert.ok(j.polygon.some(p=>p.x>520&&p.y>465),'Paving must cover both road edges, not a point decal');
  assert.ok(j.polygon.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
  const graph=buildRoadNetwork(world);
  assert.equal(graph.junctions.length,1);
  assert.equal(graph.connections.length,1);
  assert.equal(graph.connections[0].junctionId,j.id);
  assert.equal(graph.connections[0].kind,'crossing');
  assert.equal(graph.junctions[0].polygon.length,j.polygon.length);
});

test('T-junctions join roads whose paved footprints overlap without centerline crossing',()=>{
  let world=createWorld({width:1200,height:1000});
  const base={roadClass:'city',surface:'asphalt',width:40,lanes:2,shoulder:5,markings:true,smooth:false};
  world=createEntity(world,'roads',{...base,name:'Main street',points:coords([100,500],[1100,500])});
  world=createEntity(world,'roads',{...base,name:'Side lane',width:28,
    points:coords([500,270],[500,466])});
  assert.equal(roadIntersections(world.roads).length,0,'Centerlines intentionally do not intersect');
  const nodes=buildRoadJunctions(world.roads);
  assert.equal(nodes.length,1);
  assert.equal(nodes[0].kind,'tee');
  assert.equal(buildRoadNetwork(world).connections[0].kind,'tee');
  assert.equal(nodes[0].roads.length,2);
});

test('collinear, close endpoints connect but parallel nearby streets do not become false junctions',()=>{
  let world=createWorld({width:1200,height:1000});
  const base={roadClass:'country',surface:'asphalt',width:36,lanes:2,shoulder:4,markings:true,smooth:false};
  world=createEntity(world,'roads',{...base,name:'Road A',points:coords([110,400],[490,400])});
  world=createEntity(world,'roads',{...base,name:'Road B',points:coords([499,400],[900,400])});
  assert.equal(buildRoadJunctions(world.roads).length,1);
  assert.equal(buildRoadJunctions(world.roads)[0].kind,'endpoint');
  world=createEntity(world,'roads',{...base,name:'Close parallel',width:46,
    points:coords([110,448],[900,448])});
  assert.equal(buildRoadJunctions(world.roads).length,1,
    'Close but independent parallel street lanes should not connect');
});

test('multi-road crossing clusters have one physical node with complete road-pair connections',()=>{
  let world=createWorld({width:1200,height:1000});
  const base={roadClass:'city',surface:'asphalt',width:38,lanes:2,shoulder:4,markings:true,smooth:false};
  world=createEntity(world,'roads',{...base,name:'Road A',points:coords([100,500],[1100,500])});
  world=createEntity(world,'roads',{...base,name:'Road B',points:coords([500,100],[500,900])});
  world=createEntity(world,'roads',{...base,name:'Road C',points:coords([200,200],[800,800])});
  const nodes=buildRoadJunctions(world.roads);
  assert.equal(nodes.length,1);
  assert.equal(nodes[0].roads.length,3);
  const graph=buildRoadNetwork(world);
  assert.equal(graph.connections.length,3);
  assert.ok(graph.connections.every(c=>c.junctionId===nodes[0].id));
});

test('Atlas Coast intersections stay available beyond the former 50-road rendering limit',async()=>{
  const atlas=parseWorld(await readFile(new URL('../map-builder/atlas-coast.world.json',import.meta.url),'utf8'));
  const intersections=buildRoadJunctions(atlas.roads);
  assert.ok(atlas.roads.length>50);
  assert.ok(intersections.length>90,'Major highways, city streets and race approaches need junction paving');
  assert.ok(intersections.some(j=>j.kind==='tee'||j.kind==='endpoint'));
  assert.ok(intersections.every(j=>j.polygon.length>=3&&j.roads.length>=2));
  const network=buildRoadNetwork(atlas);
  assert.equal(network.junctions.length,intersections.length);
  assert.ok(network.connections.length>=network.junctions.length);
  assert.ok(network.connections.every(c=>network.junctions.some(j=>j.id===c.junctionId)));
  const source=await readFile(new URL('../map-builder/world_loader.gd',import.meta.url),'utf8');
  const zip=buildWorldZip(atlas,source);
  const name=worldSlug(atlas.name);
  assert.ok(zip.files.has('navigation/'+name+'.roads.json'));
  const content=JSON.parse(zip.files.get('navigation/'+name+'.roads.json'));
  assert.equal(content.junctions.length,intersections.length);
});
