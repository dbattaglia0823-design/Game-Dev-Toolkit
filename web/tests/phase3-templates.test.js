import test from 'node:test';
import assert from 'node:assert/strict';
import {PHASE3_PRESETS} from '../layout-kit/phase3-presets.js';
import {PRESETS,getPreset} from '../layout-kit/presets.js';
import {getContract,parseLayout,serializeLayout} from '../layout-kit/schema.js';
import {validateIntegration} from '../layout-kit/validator.js';
import {templateCatalog,catalogFor,CATEGORIES} from '../layout-kit/catalog.js';
import {SAMPLE_DATA} from '../layout-kit/sample-data.js';

const expected={
 'character-stats':['character.allocate_point','character.attributes'],
 'crafting':['crafting.craft_request','crafting.recipes'],
 'skill-tree':['skills.unlock_request','skills.nodes'],
 'quest-log':['quests.track_request','quests.items'],
 'garage':['garage.change_vehicle','garage.selected.name'],
 'dealership':['dealership.purchase_request','dealership.vehicles'],
 'race-selection':['races.start_request','races.items'],
 leaderboard:['leaderboard.refresh','leaderboard.entries'],
 'career-events':['career.enter_request','career.events']
};

test('all nine phase 3 wireframes have distinct IDs, no styling and valid contracts',()=>{
 assert.equal(Object.keys(PHASE3_PRESETS).length,9);
 for(const [key,[action,binding]] of Object.entries(expected)){
  const layout=getPreset(key),contract=getContract(layout),validation=validateIntegration(layout);
  assert.equal(layout.version,2);
  assert.equal(validation.valid,true,key+': '+JSON.stringify(validation.errors));
  assert.equal(new Set(layout.nodes.map(node=>node.id)).size,layout.nodes.length);
  assert.equal(contract.actions.includes(action),true,key+' missing '+action);
  assert.equal(contract.bindings.includes(binding),true,key+' missing '+binding);
  assert.deepEqual(parseLayout(serializeLayout(layout)),layout);
  for(const node of layout.nodes){
   assert.deepEqual(Object.keys(node),['id','type','x','y','w','h','label','role','actionId','bindingKey']);
   assert.equal(node.x+node.w<=800,true,key+'/'+node.id+' horizontal overflow');
   assert.equal(node.y+node.h<=500,true,key+'/'+node.id+' vertical overflow');
  }
 }
});
test('template catalog includes every registered preset once in a valid category',()=>{
 const records=templateCatalog(),keys=records.map(record=>record.key);
 assert.equal(keys.length,Object.keys(PRESETS).length);
 assert.equal(new Set(keys).size,keys.length);
 for(const record of records){
  assert.ok(Object.hasOwn(CATEGORIES,record.category));
  assert.ok(record.description.length>4);
  assert.ok(record.nodeCount>=3);
  assert.ok(record.actionCount>0);
  assert.equal(record.bindingCount>0,true,record.key);
 }
 assert.ok(catalogFor('racing').some(x=>x.key==='race-selection'));
 assert.equal(catalogFor('not-a-category').length,0);
});
test('generic sample data covers all bindings used by new templates',()=>{
 for(const key of Object.keys(PHASE3_PRESETS)){
  const result=validateIntegration(getPreset(key),{sampleData:SAMPLE_DATA});
  assert.equal(result.valid,true,key);
  assert.deepEqual(result.warnings.filter(x=>x.code==='MISSING_DATA'),[],key);
  assert.deepEqual(result.errors.filter(x=>x.code==='EXPECTED_ARRAY'),[],key);
 }
});
