import test from 'node:test';
import assert from 'node:assert/strict';
import {makePreset, normalizeDocument} from '../builder/model.js';
import {History,LIBRARY,screenPreset,applyLibraryItem,reorder,moveElement,duplicate} from '../builder/studio.js';
import {exportHTML,exportGodot} from '../builder/exporters.js';

test('all new templates are valid and contain components',()=>{
 for(const key of ['inventory','upgrades','shop','settings']){
  const doc=screenPreset(key);
  assert.equal(doc.version,1);
  assert.ok(doc.elements.length>5);
  assert.equal(new Set(doc.elements.map(x=>x.id)).size,doc.elements.length);
 }
});
test('history undo redo and branch invalidation',()=>{
 const h=new History(makePreset('blank'));
 const initial=h.current;
 h.commit(applyLibraryItem(h.current,0));
 assert.equal(h.current.elements.length,1);
 assert.equal(h.undo(),true);
 assert.deepEqual(h.current,initial);
 assert.equal(h.redo(),true);
 assert.equal(h.current.elements.length,1);
 h.undo();
 h.commit(applyLibraryItem(h.current,2));
 assert.equal(h.redo(),false);
});
test('layers, movement, duplicate and asset catalog',()=>{
 let d=makePreset('menu');
 assert.ok(LIBRARY.length>=10);
 const before=d.elements.map(e=>e.id);
 d=reorder(d,before[0],1);
 assert.equal(d.elements[1].id,before[0]);
 const moved=moveElement(d,before[0],13,22,{snap:10});
 assert.equal(moved.elements[1].x%10,0);
 assert.equal(moved.elements[1].y%10,0);
 const duplicated=duplicate(d,before[0]);
 assert.equal(duplicated.elements.length,d.elements.length+1);
 assert.notEqual(duplicated.elements.at(-1).id,before[0]);
});
test('web HTML exporter escapes labels and emits usable markup',()=>{
 const doc=normalizeDocument({title:'<bad>',elements:[{type:'button',label:'<img onerror=alert(1)>',fill:'#fb8c35'},{type:'progress',value:75}]});
 const html=exportHTML(doc);
 assert.match(html,/<!doctype html>/i);
 assert.ok(!html.includes('<img onerror=alert(1)>'));
 assert.ok(html.includes('&lt;img'));
 assert.ok(html.includes('aria-valuenow="75"'));
 assert.ok(html.includes('<button type="button"'));
});
test('Godot exporter emits a Control scene, labels and style resources',()=>{
 const scene=exportGodot(makePreset('menu'));
 assert.match(scene,/\[gd_scene load_steps=\d+ format=3\]/);
 assert.match(scene,/\[node name="ExportedUI" type="Control"\]/);
 assert.match(scene,/\[sub_resource type="StyleBoxFlat"/);
 assert.match(scene,/\[node name="Button_03" type="Button"/);
 assert.match(scene,/text = "PLAY"/);
});
