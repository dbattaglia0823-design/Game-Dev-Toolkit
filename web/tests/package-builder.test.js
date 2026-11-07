import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createZip,crc32} from '../package/zip.js';
import {buildPackage,resolveLayouts,sourceLocation,getSourceList,importLayoutText} from '../package/package-builder.js';
import {getPreset} from '../layout-kit/presets.js';

function entries(bytes){
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 const dec=new TextDecoder(),result=new Map();
 let p=0;
 while(p+4<bytes.length && view.getUint32(p,true)===0x04034b50){
  const method=view.getUint16(p+8,true),crc=view.getUint32(p+14,true);
  const length=view.getUint32(p+18,true),nameLen=view.getUint16(p+26,true);
  const extraLen=view.getUint16(p+28,true);
  assert.equal(method,0);
  const name=dec.decode(bytes.subarray(p+30,p+30+nameLen));
  const data=bytes.subarray(p+30+nameLen+extraLen,p+30+nameLen+extraLen+length);
  assert.equal(crc32(data),crc,'CRC mismatch for '+name);
  result.set(name,dec.decode(data));p+=30+nameLen+extraLen+length;
 }
 assert.equal(view.getUint32(p,true),0x02014b50,'Central directory must follow local file records');
 assert.equal(view.getUint32(bytes.length-22,true),0x06054b50,'ZIP end-of-central-directory required');
 assert.equal(view.getUint16(bytes.length-12,true),result.size);
 return result;
}
const loader=async path=>{
 return readFile(new URL(path,import.meta.url),'utf8');
};
test('ZIP archives have valid headers, CRCs and directory metadata',()=>{
 const out=createZip(new Map([['test/file.txt','hello'],['root.json','{}']]));
 assert.equal(entries(out).get('test/file.txt'),'hello');
 assert.throws(()=>createZip(new Map([['../escape','no']])),/Unsafe/);
 assert.throws(()=>createZip(new Map()),RangeError);
});
test('Web integration package includes matching source files and two full layouts',async()=>{
 const {bytes,manifest,files}=await buildPackage({engine:'web',keys:['inventory','settings'],fetchSource:loader});
 const archive=entries(bytes);
 assert.equal(archive.size,files.size);
 assert.equal(manifest.templates.length,2);
 assert.equal(manifest.integrationVerified,false);
 assert.ok(archive.has('runtime/schema.js'));
 assert.ok(archive.has('runtime/runtime.js'));
 assert.ok(archive.has('runtime/behaviors.js'));
 assert.ok(archive.has('runtime/workflow.js'));
 assert.ok(archive.has('runtime/confirmation-dialog.js'));
 const content=JSON.parse(archive.get('layouts/inventory.layout.json'));
 assert.equal(content.version,2);
 const contract=JSON.parse(archive.get('contracts/inventory.contract.json'));
 assert.ok(contract.actions.includes('inventory.equip'));
 const report=JSON.parse(archive.get('validation/inventory.validation.json'));
 assert.equal(report.valid,true);
 assert.ok(archive.get('CODEX_INTEGRATION.md').includes('inventory.equip'));
 assert.ok(archive.get('runtime/runtime.js').includes('mountLayout'));
});
test('Godot package uses actual GDScript sources and omits optional behavior when deselected',async()=>{
 const {bytes,manifest}=await buildPackage({engine:'godot',keys:['garage','race-selection'],includeBehaviors:false,fetchSource:loader});
 const zip=entries(bytes);
 assert.ok(zip.has('runtime/ui_layout.gd'));
 assert.ok(!zip.has('runtime/ui_behaviors.gd'));
 assert.ok(zip.get('CODEX_INTEGRATION.md').includes('load_from_file'));
 assert.ok(JSON.parse(zip.get('manifest.json')).actionIds.includes('races.start_request'));
 assert.equal(manifest.engine,'godot');
});
test('custom edited layouts are supported and invalid or old formats are rejected',async()=>{
 const customized=getPreset('shop');customized.name='My shop';
 const zip=entries((await buildPackage({engine:'web',custom:[customized],includeBehaviors:false,fetchSource:loader})).bytes);
 assert.equal(JSON.parse(zip.get('layouts/custom-1.layout.json')).name,'My shop');
 assert.ok(!zip.has('runtime/behaviors.js'));
 assert.throws(()=>resolveLayouts({keys:[]}),/Select/);
 assert.throws(()=>resolveLayouts({keys:['unknown']}),/Unknown/);
 assert.throws(()=>resolveLayouts({custom:[{version:1,nodes:[]}]}),/Invalid/);
 assert.throws(()=>importLayoutText('{"version":1,"elements":[]}'),/version/);
 assert.throws(()=>resolveLayouts({keys:Array(31).fill('inventory')}),RangeError);
});
