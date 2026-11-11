import test from "node:test";
import assert from "node:assert/strict";
import {RATE, SPECS, FX, PERSPECTIVES, LAYERS, encodeWav, renderEngine, renderFx, zipStore} from "../render.mjs";
function rms(arr) {let sum=0;for (const a of arr) sum+=a*a; return Math.sqrt(sum/arr.length);}
test("stereo V8 bank has six RPM regions and independent perspectives",()=>{
 assert.equal(RATE,48000);
 assert.equal(Object.keys(SPECS).length,2);
 for (const s of Object.values(SPECS)) assert.equal(s.rpms.length,6);
 assert.deepEqual(PERSPECTIVES,["exterior","interior"]);
 assert.deepEqual(LAYERS,["exhaust_on","exhaust_off","intake_on"]);
});
test("different cam and cabin renderings are not identical",()=>{
 const a=renderEngine(SPECS.v8_ls_race_cam,950,"exhaust_on","exterior",RATE);
 const b=renderEngine(SPECS.v8_ls_race_cam,950,"exhaust_on","interior",RATE);
 const c=renderEngine(SPECS.v8_coyote_dohc,900,"exhaust_on","exterior",RATE);
 assert.notEqual(a.left[312],b.left[312]);
 assert.notEqual(a.left[312],c.left[312]);
 assert.ok(rms(a.left)>.01 && rms(a.left)<.6);
 assert.ok(rms(b.left)>.01 && rms(b.left)<.6);
 assert.ok(a.left.some((x,i)=>x!==a.right[i]));
 assert.ok(Math.abs(a.actual_rpm/950-1)<0.002);
 const seam=Math.abs(a.left[0]-a.left.at(-1));
 const near=Math.max(Math.abs(a.left[1]-a.left[0]),Math.abs(a.left.at(-1)-a.left.at(-2)),0.003);
 assert.ok(seam<0.20+near*2);
 const wav=encodeWav(a.left,a.right,RATE);
 const dv=new DataView(wav.buffer);
 assert.equal(dv.getUint16(22,true),2);
 assert.equal(dv.getUint32(24,true),48000);
 assert.equal(dv.getUint16(34,true),16);
});
test("induction events differ and ZIPs are valid",()=>{
 const sound=renderFx(FX.find(x=>x.id==="flutter_hard"),RATE);
 const other=renderFx(FX.find(x=>x.id==="bov_vent"),RATE);
 assert.ok(rms(sound.left)>.005);
 assert.notEqual(sound.left[1100],other.left[1100]);
 assert.ok(Math.abs(sound.left.at(-1))<0.05);
 const file=encodeWav(sound.left,sound.right,RATE);
 const archive=zipStore([{name:"effects/flutter_hard.wav",bytes:file}]);
 const view=new DataView(archive.buffer);
 assert.equal(view.getUint32(0,true),0x04034b50);
 assert.equal(view.getUint32(archive.length-22,true),0x06054b50);
});
