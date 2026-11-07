import test from 'node:test';
import assert from 'node:assert/strict';
import {validateIntegration} from '../layout-kit/validator.js';
import {getPreset} from '../layout-kit/presets.js';

test('all built-in layouts pass structural checks',()=>{
 for(const name of ['main-menu','pause-menu','inventory','upgrades','shop','settings','hud']){
  const result=validateIntegration(getPreset(name));
  assert.equal(result.valid,true,name+JSON.stringify(result.errors));
  assert.ok(result.contract?.actions.length);
 }
});
test('report missing target handlers and sample data without claiming integration is complete',()=>{
 const spec=getPreset('inventory');
 const r=validateIntegration(spec,{handlerIds:['inventory.select'],sampleData:{inventory:{items:[]}}});
 assert.equal(r.valid,true);
 assert.equal(r.ready,false);
 assert.ok(r.warnings.some(x=>x.code==='MISSING_HANDLER' && x.nodeId==='equip'));
 assert.ok(r.warnings.some(x=>x.code==='MISSING_DATA' && x.nodeId==='selected_item'));
});
test('reject duplicate ids, malformed geometry and inappropriate list binding types',()=>{
 const spec=getPreset('inventory');
 spec.nodes[0].id=spec.nodes[1].id;
 spec.nodes[2].w=NaN;
 spec.nodes.find(x=>x.id==='item_grid').x=-50;
 const report=validateIntegration(spec,{sampleData:{inventory:{items:42}}});
 assert.equal(report.valid,false);
 assert.ok(report.errors.some(x=>x.code==='DUPLICATE_ID'));
 assert.ok(report.errors.some(x=>x.code==='GEOMETRY'));
 assert.ok(report.errors.some(x=>x.code==='EXPECTED_ARRAY'));
});
test('warn about offscreen elements and small touch targets',()=>{
 const spec=getPreset('main-menu');
 spec.nodes.find(x=>x.id==='start_game').x=790;
 spec.nodes.find(x=>x.id==='start_game').w=30;
 const report=validateIntegration(spec);
 assert.ok(report.warnings.some(x=>x.code==='OUT_OF_BOUNDS'));
 assert.ok(report.warnings.some(x=>x.code==='TOUCH_TARGET'));
});
test('invalid document and version do not cause exceptions',()=>{
 assert.equal(validateIntegration(null).valid,false);
 assert.equal(validateIntegration({version:1,nodes:[]}).valid,false);
 assert.equal(validateIntegration({version:2,viewport:{width:800,height:500},nodes:[]} ).valid,true);
});
