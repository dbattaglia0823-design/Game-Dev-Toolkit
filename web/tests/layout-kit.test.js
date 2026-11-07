import test from 'node:test';
import assert from 'node:assert/strict';
import {makeLayout,normalizeLayout,addNode,modifyNode,deleteNode,duplicateNode,reorderNode,parseLayout,serializeLayout,getContract,NODE_TYPES} from '../layout-kit/schema.js';
import {PRESETS,getPreset} from '../layout-kit/presets.js';

test('all functional presets have unique node IDs and declare actions and bindings',()=>{
 for(const name of Object.keys(PRESETS)){
  const layout=getPreset(name),contract=getContract(layout);
  assert.equal(layout.version,2);
  assert.ok(layout.nodes.length>2,name);
  assert.equal(new Set(layout.nodes.map(n=>n.id)).size,layout.nodes.length);
  assert.ok(contract.actions.length,name);
  if(!name.startsWith('pause-menu'))assert.ok(contract.bindings.length,name);
 }
});
test('functional templates contain no appearance fields',()=>{
 const layout=getPreset('inventory');
 for(const node of layout.nodes){
  assert.deepEqual(Object.keys(node),['id','type','x','y','w','h','label','role','shape','actionId','bindingKey']);
  assert.ok(!('fill' in node));
 }
});
test('layout schema validates version, duplicates, unsafe IDs and input limits',()=>{
 assert.throws(()=>normalizeLayout({version:1,nodes:[]}),/version/);
 assert.throws(()=>normalizeLayout({version:2,nodes:[{type:'unknown'}]}),TypeError);
 assert.throws(()=>normalizeLayout({version:2,nodes:[{type:'panel',id:'same'},{type:'label',id:'same'}]}),/Duplicate/);
 assert.throws(()=>parseLayout('{bad'),SyntaxError);
 assert.throws(()=>parseLayout('x'.repeat(250001)),RangeError);
 const l=normalizeLayout({version:2,viewport:{width:800,height:500},nodes:[{id:'test',type:'button',x:-5,w:9000,actionId:'bad script()'}]});
 assert.equal(l.nodes[0].x,0);
 assert.equal(l.nodes[0].w,4000);
 assert.equal(l.nodes[0].actionId,'');
});
test('add edit duplicate order and delete without mutating original',()=>{
 const base=makeLayout('Example');
 let doc=addNode(base,'button',{id:'play',label:'Start',actionId:'game.start'});
 assert.equal(base.nodes.length,0);
 assert.equal(doc.nodes[0].actionId,'game.start');
 doc=addNode(doc,'label',{id:'title',bindingKey:'game.title'});
 doc=reorderNode(doc,'play',1);
 assert.equal(doc.nodes[1].id,'play');
 doc=modifyNode(doc,'play',{x:120,label:'Resume'});
 assert.equal(doc.nodes[1].x,120);
 doc=duplicateNode(doc,'play');
 assert.equal(doc.nodes.length,3);
 assert.equal(new Set(doc.nodes.map(n=>n.id)).size,3);
 doc=deleteNode(doc,'play');
 assert.equal(doc.nodes.length,2);
 assert.ok(NODE_TYPES.includes(doc.nodes[0].type));
});
test('data contract is deterministic and JSON survives round trip',()=>{
 const layout=getPreset('settings');
 const result=serializeLayout(layout);
 assert.deepEqual(parseLayout(result),layout);
 const contract=getContract(layout);
 assert.ok(contract.actions.includes('nav.back'));
 assert.ok(contract.actions.includes('settings.volume_changed'));
 assert.ok(contract.bindings.includes('settings.volume'));
 assert.ok(contract.nodes.some(n=>n.actionId==='settings.music_changed'));
});
