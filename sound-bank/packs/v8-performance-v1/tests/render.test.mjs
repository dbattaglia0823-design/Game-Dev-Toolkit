import test from "node:test";
import assert from "node:assert/strict";
import {SPECS, EFFECTS, encodeWav, renderEngine, renderFx} from "../render.mjs";
import {zipCrc32, zipStore} from "../archive.mjs";

const RATE=22050;
function rms(samples){let sum=0;for(const x of samples)sum+=x*x;return Math.sqrt(sum/samples.length);}

test("the bank has distinct V8 archetypes and tunings",()=>{
  assert.equal(Object.keys(SPECS).length,12);
  assert.equal(EFFECTS.length,18);
  for(const spec of Object.values(SPECS)){
    assert.ok(spec.rpms.length>=4);
    assert.equal(new Set(spec.rpms).size,spec.rpms.length);
  }
});
test("rendered RPM layers have accurate pitch, dynamic content and quiet seams",()=>{
  for(const [id,spec] of Object.entries(SPECS)){
    for(const rpm of spec.rpms){
      for(const layer of ["exhaust_on","exhaust_off","intake_on"]){
        const data=renderEngine(spec,rpm,layer,RATE);
        assert.ok(Math.abs(data.actual_rpm/rpm-1)<0.001,id+" "+rpm);
        assert.ok(rms(data.signal)>0.015,id+" "+layer);
        assert.ok(rms(data.signal)<0.55,id);
        assert.ok(Math.abs(data.signal[0]-data.signal.at(-1))<0.08,id+" seam");
        const file=encodeWav(data.signal,RATE);
        assert.equal(String.fromCharCode(...file.slice(0,4)),"RIFF");
        assert.equal(file.length,44+data.signal.length*2);
      }
    }
  }
});
test("effect sounds are distinct and valid",()=>{
  const a=renderFx("v8_bov_vent",RATE),b=renderFx("v8_compressor_flutter",RATE);
  assert.ok(rms(a)>0.008);
  assert.ok(rms(b)>0.008);
  assert.notEqual(a.length,b.length);
  for(const name of EFFECTS){
    const data=renderFx(name,RATE);
    assert.ok(data.length>3000,name);
    assert.ok(rms(data)>0.005,name);
    assert.ok(Math.abs(data.at(-1))<0.08,name);
  }
});
test("portable ZIP-store archives contain PCM WAV data and a valid CRC",()=>{
  assert.equal(zipCrc32(Uint8Array.from([49,50,51,52,53,54,55,56,57])),0xcbf43926);
  const wav=encodeWav(renderEngine(SPECS.v8_ls_ohv,750,"exhaust_on",RATE).signal,RATE);
  const zip=zipStore([{name:"engines/v8_ls_ohv/750_exhaust_on.wav",bytes:wav}]);
  const view=new DataView(zip.buffer);
  assert.equal(view.getUint32(0,true),0x04034b50);
  assert.equal(view.getUint32(zip.length-22,true),0x06054b50);
  assert.equal(view.getUint16(zip.length-14,true),1);
});
