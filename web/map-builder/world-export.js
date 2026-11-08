import {createZip} from '../package/zip.js';
import {normalizeWorld,serializeWorld} from './world-model.js';
import {distance,roadIntersections,sampleRoad} from './world-geometry.js';
export const worldSlug = name => String(name||'world').toLowerCase().replace(/[^a-z0-9_-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,55)||'world';
/** Samples preserve continuous road centerlines for player navigation and racing AI.
 * Intersections and endpoint joins are hints; route planning remains game-owned.
 */
export function buildRoadNetwork(doc){
  const world=normalizeWorld(doc);
  const roads=world.roads.map(r=>({id:r.id,name:r.name,roadClass:r.roadClass,surface:r.surface,
    width:r.width,lanes:r.lanes,shoulder:r.shoulder,
    centerline:sampleRoad(r.points,r.smooth,22).map(p=>[Math.round(p.x*100)/100,Math.round(p.y*100)/100])}));
  const joins=roadIntersections(world.roads).map(j=>({roads:j.roads,at:[+j.x.toFixed(2),+j.y.toFixed(2)],kind:'crossing'}));
  for(let i=0;i<world.roads.length;i++)for(let j=i+1;j<world.roads.length;j++){
    const a=world.roads[i],b=world.roads[j],endsA=[a.points[0],a.points.at(-1)],endsB=[b.points[0],b.points.at(-1)];
    for(const p of endsA)for(const q of endsB)if(distance(p,q)<=20){
      if(!joins.some(entry=>entry.roads.includes(a.id)&&entry.roads.includes(b.id)&&distance({x:entry.at[0],y:entry.at[1]},p)<22))
        joins.push({roads:[a.id,b.id],at:[+(p.x+q.x).toFixed(2)/2,+(p.y+q.y).toFixed(2)/2],kind:'endpoint'});
    }
  }
  return {format:'gdt.racing-road-network',version:1,source:world.name,worldSize:world.world,
    roads,connections:joins,verifiedNavigation:false};
}
export function buildWorldZip(doc,loader){
  const world=normalizeWorld(doc);
  if(typeof loader!=='string'||!loader.includes('extends Node2D')||!loader.includes('load_world'))throw new TypeError('Godot world adapter source missing');
  const name=worldSlug(world.name),path='worlds/'+name+'.world.json',roads='navigation/'+name+'.roads.json';
  const files=new Map([
    [path,serializeWorld(world)],
    [roads,JSON.stringify(buildRoadNetwork(world),null,2)+'\n'],
    ['runtime/world_loader.gd',loader],
    ['manifest.json',JSON.stringify({format:'gdt-racing-world-package',version:1,targetEngine:'Godot 4.3+',worldFile:path,roadNetwork:roads,adapter:'runtime/world_loader.gd',worldFormat:world.format,worldVersion:world.version,gameplayIntegrated:false},null,2)+'\n'],
    ['CODEX_IMPORT.md',[
      '# Freeform Racing World / Godot 4',
      '',
      '1. Copy worlds/, navigation/, and runtime/ into res:// in the target Godot 4 project.',
      '2. Add a Node2D, attach runtime/world_loader.gd, set world_path to res://'+path+'.',
      '3. The loader draws vector terrain, continuous Catmull-Rom road strokes, stylized props, and static blockers for water and solid buildings.',
      '4. Use get_markers(), get_road_paths(), get_surface_at(Vector2), and road_near(Vector2) in your game.',
      '5. navigation/*.roads.json includes sampled road centerlines, intersections and endpoints for building traffic AI or race waypoints.',
      '6. Connect markers to your existing car spawn, races, traffic, garages, and trigger systems. Do not assume the file creates those systems.',
      '7. Set collision layer/mask appropriately, verify road widths and corner geometry in Godot, and implement physics grip by road surface class.',
      '8. Keep world geometry and player save state separate. No existing saves or v1 maps are modified.',
      '',
      'Limitations: stylized vector placeholders are not a final high-resolution art pack. No generated 3D elevation mesh, streaming/chunk system, routing solver, automatic traffic AI, or physics-based road bank is included.',
      'For the classic tile editor, use web/map-builder/legacy.html.',
      ''
    ].join('\n')]
  ]);
  return {files,bytes:createZip(files),manifest:JSON.parse(files.get('manifest.json'))};
}
