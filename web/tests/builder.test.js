import test from 'node:test';
import assert from 'node:assert/strict';
import {makePreset,addElement,updateElement,removeElement,importJSON,exportJSON,normalizeDocument} from '../builder/model.js';
test('presets and roundtrip export are versioned and valid',()=>{
  const menu=makePreset('menu');
  assert.equal(menu.version,1);
  assert.equal(menu.elements.length,4);
  assert.deepEqual(importJSON(exportJSON(menu)),menu);
});
test('adding, modifying and deleting components is immutable',()=>{
  const original=makePreset('blank');
  const added=addElement(original,'button');
  assert.equal(original.elements.length,0);
  assert.equal(added.elements.length,1);
  const edited=updateElement(added,added.elements[0].id,{label:'Launch',w:330,x:99});
  assert.equal(edited.elements[0].label,'Launch');
  assert.equal(added.elements[0].label,'BUTTON');
  assert.equal(removeElement(edited,edited.elements[0].id).elements.length,0);
});
test('import normalizes numeric values, colors and text instead of trusting payload',()=>{
  const doc=normalizeDocument({version:1,background:'bad',elements:[{type:'button',x:-10,y:900,w:900,label:'<script>bad</script>',fill:'url(evil)'}]});
  assert.equal(doc.elements[0].x,0);
  assert.equal(doc.elements[0].y,480);
  assert.equal(doc.elements[0].w,800);
  assert.equal(doc.elements[0].fill,'#fb8c35');
  assert.equal(doc.background,'#101722');
});
test('rejects invalid types, versions and excess elements',()=>{
  assert.throws(()=>importJSON('{"version":7,"elements":[]}'),/version/);
  assert.throws(()=>normalizeDocument({elements:[{type:'javascript'}]}),TypeError);
  assert.throws(()=>normalizeDocument({elements:Array(101).fill({type:'text'})}),RangeError);
  assert.throws(()=>makePreset('unknown'));
});
