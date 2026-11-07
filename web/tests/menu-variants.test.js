import test from 'node:test';
import assert from 'node:assert/strict';
import {ORIGINAL_PRESETS,PRESETS,getPreset} from '../layout-kit/presets.js';
import {CATEGORIES,templateCatalog,catalogFor,familiesFor} from '../layout-kit/catalog.js';
import {getContract,parseLayout,serializeLayout} from '../layout-kit/schema.js';
import {validateIntegration} from '../layout-kit/validator.js';
import {SAMPLE_DATA} from '../layout-kit/sample-data.js';

const families=Object.values(CATEGORIES).flat();
test('every one of the 19 menu families has three distinct compatible layouts',()=>{
 assert.equal(families.length,19);
 assert.equal(Object.keys(ORIGINAL_PRESETS).length,19);
 assert.equal(Object.keys(PRESETS).length,57);
 assert.equal(templateCatalog().length,57);
 for(const family of families){
  const catalog=catalogFor('all',family);
  assert.deepEqual(catalog.map(x=>x.key),[family,family+'-reverse',family+'-focus']);
  assert.deepEqual(catalog.map(x=>x.variant),['original','reverse','focus']);
  const original=getPreset(family);
  const originalContract=getContract(original);
  const geometries=[];
  for(const entry of catalog){
   const layout=getPreset(entry.key);
   const validation=validateIntegration(layout,{sampleData:SAMPLE_DATA});
   assert.equal(validation.valid,true,entry.key+': '+JSON.stringify(validation.errors));
   assert.equal(layout.nodes.length,original.nodes.length,entry.key+' control count changed');
   const contract=getContract(layout);
   assert.deepEqual(contract.actions,originalContract.actions,entry.key+' action parity');
   assert.deepEqual(contract.bindings,originalContract.bindings,entry.key+' binding parity');
   assert.deepEqual(contract.connections,originalContract.connections,entry.key+' connector parity');
   assert.deepEqual(layout.nodes.map(x=>x.id),original.nodes.map(x=>x.id),'Stable control IDs');
   assert.deepEqual(parseLayout(serializeLayout(layout)),layout,entry.key+' JSON round trip');
   for(const node of layout.nodes){
    assert.ok(node.x>=0&&node.y>=0&&node.x+node.w<=800&&node.y+node.h<=500,
     entry.key+'/'+node.id+' overflow '+JSON.stringify([node.x,node.y,node.w,node.h]));
    if(node.shape==='circle')assert.equal(node.w,node.h,'Circle dimensions must remain square');
   }
   geometries.push(layout.nodes.map(x=>[x.x,x.y,x.w,x.h]));
  }
  assert.notDeepEqual(geometries[0],geometries[1],family+' reverse must differ');
  assert.notDeepEqual(geometries[0],geometries[2],family+' focus must differ');
  assert.notDeepEqual(geometries[1],geometries[2],family+' focus and reverse must differ');
 }
});
test('family filter and category filter identify all three choices',()=>{
 assert.equal(catalogFor('racing').length,9);
 assert.equal(catalogFor('progression').length,15);
 assert.equal(catalogFor('items').length,18);
 assert.equal(catalogFor('core').length,15);
 assert.equal(catalogFor('racing','garage').length,3);
 assert.equal(familiesFor().length,19);
 assert.deepEqual(familiesFor('racing').map(x=>x.key),['garage','dealership','race-selection']);
});
test('skill-tree alternatives retain visual dependency connections',()=>{
 for(const suffix of ['','-reverse','-focus']){
  const tree=getPreset('skill-tree'+suffix);
  assert.equal(tree.edges.length,4);
  assert.ok(tree.nodes.filter(x=>x.shape==='circle').length>=5);
  assert.ok(getContract(tree).actions.includes('skills.select_node'));
 }
});
