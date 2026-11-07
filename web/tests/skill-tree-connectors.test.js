import test from 'node:test';
import assert from 'node:assert/strict';
import {getPreset} from '../layout-kit/presets.js';
import {makeLayout,addNode,connectNodes,disconnectNodes,deleteNode,modifyNode,parseLayout,serializeLayout,getContract,normalizeLayout} from '../layout-kit/schema.js';
import {connectionPaths} from '../layout-kit/connections.js';
import {validateIntegration} from '../layout-kit/validator.js';

test('shape metadata and connections survive v2 JSON round-trip',()=>{
 let layout=makeLayout('Tree');
 layout=addNode(layout,'button',{id:'root',x:100,y:120,w:80,h:80,shape:'circle',actionId:'skills.select_node'});
 layout=addNode(layout,'button',{id:'child',x:300,y:180,w:72,h:72,shape:'rounded',actionId:'skills.select_node'});
 layout=connectNodes(layout,'root','child');
 assert.equal(layout.nodes[0].shape,'circle');
 assert.equal(layout.nodes[1].shape,'rounded');
 assert.deepEqual(parseLayout(serializeLayout(layout)),layout);
 assert.deepEqual(getContract(layout).connections,[{from:'root',to:'child'}]);
 assert.ok(validateIntegration(layout).valid);
 const edge=connectionPaths(layout)[0];
 assert.ok(edge.x1>140 && edge.x1<180,'Line starts at circle boundary');
 assert.ok(edge.x2<340 && edge.x2>300,'Line reaches destination boundary');
});
test('connections track node movement and delete with endpoints',()=>{
 let layout=makeLayout('Tree');
 layout=addNode(layout,'button',{id:'a',shape:'circle',w:60,x:100,y:100});
 layout=addNode(layout,'button',{id:'b',shape:'circle',w:60,x:250,y:100});
 layout=connectNodes(layout,'a','b');
 const before=connectionPaths(layout)[0];
 layout=modifyNode(layout,'b',{x:310});
 assert.ok(connectionPaths(layout)[0].x2>before.x2);
 assert.throws(()=>connectNodes(layout,'a','b'),/Duplicate/);
 assert.throws(()=>connectNodes(layout,'a','a'),/distinct/);
 assert.throws(()=>connectNodes(layout,'a','missing'),/existing/);
 layout=disconnectNodes(layout,'a','b');
 assert.equal(layout.edges.length,0);
 layout=connectNodes(layout,'a','b');
 layout=deleteNode(layout,'a');
 assert.deepEqual(layout.edges,[]);
});
test('circle geometry enforces equal width and height',()=>{
 const layout=addNode(makeLayout(),'button',{id:'circle',shape:'circle',w:78,h:150});
 assert.equal(layout.nodes[0].w,78);
 assert.equal(layout.nodes[0].h,78);
 assert.equal(normalizeLayout({version:2,nodes:[],edges:[]}).version,2);
});
test('skill tree preset has clickable circular nodes and branching connections',()=>{
 const layout=getPreset('skill-tree');
 assert.ok(layout.edges.length>=4);
 for(const edge of layout.edges){
  for(const id of [edge.from,edge.to]){
   const node=layout.nodes.find(x=>x.id===id);
   assert.equal(node.type,'button');
   assert.equal(node.shape,'circle');
  }
 }
 assert.deepEqual(parseLayout(serializeLayout(layout)).edges,layout.edges);
});
