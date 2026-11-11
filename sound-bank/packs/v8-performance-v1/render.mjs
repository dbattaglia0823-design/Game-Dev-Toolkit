// Original procedural V8 sound pack source: Node 20+, no runtime packages.
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
const RATE = 22050;
const SPECS = {
  "v8_smallblock_ohv": {
    "title": "Classic American small-block V8",
    "banks": "cross",
    "depth": 0.86,
    "brightness": 0.28,
    "cam": 0.08,
    "rough": 0.22,
    "rpms": [
      750,
      1650,
      3400,
      6200
    ]
  },
  "v8_bigblock_ohv": {
    "title": "Large-displacement OHV V8",
    "banks": "cross",
    "depth": 1.09,
    "brightness": 0.19,
    "cam": 0.22,
    "rough": 0.35,
    "rpms": [
      650,
      1400,
      2800,
      5200
    ]
  },
  "v8_ls_ohv": {
    "title": "Modern pushrod LS-style V8",
    "banks": "cross",
    "depth": 0.87,
    "brightness": 0.46,
    "cam": 0.06,
    "rough": 0.19,
    "rpms": [
      750,
      1700,
      3500,
      6800
    ]
  },
  "v8_coyote_dohc": {
    "title": "High-revving DOHC muscle V8",
    "banks": "cross",
    "depth": 0.68,
    "brightness": 0.82,
    "cam": 0.03,
    "rough": 0.12,
    "rpms": [
      900,
      1900,
      4200,
      7600
    ]
  },
  "v8_hemi": {
    "title": "Large-displacement HEMI-style V8",
    "banks": "cross",
    "depth": 1,
    "brightness": 0.33,
    "cam": 0.12,
    "rough": 0.33,
    "rpms": [
      700,
      1600,
      3400,
      6500
    ]
  },
  "v8_euro_cross": {
    "title": "High-output European cross-plane V8",
    "banks": "cross",
    "depth": 0.72,
    "brightness": 0.89,
    "cam": 0.04,
    "rough": 0.11,
    "rpms": [
      850,
      1900,
      4300,
      7800
    ]
  },
  "v8_flat_plane": {
    "title": "Flat-plane high-revving V8",
    "banks": "flat",
    "depth": 0.48,
    "brightness": 1.12,
    "cam": 0.03,
    "rough": 0.09,
    "rpms": [
      950,
      2200,
      5100,
      8800
    ]
  },
  "v8_roots_blown": {
    "title": "Roots/twin-screw-blown V8",
    "banks": "cross",
    "depth": 0.94,
    "brightness": 0.49,
    "cam": 0.18,
    "rough": 0.34,
    "rpms": [
      800,
      1900,
      3800,
      7000
    ]
  },
  "v8_twin_turbo": {
    "title": "Twin-turbo cross-plane V8",
    "banks": "cross",
    "depth": 0.72,
    "brightness": 0.6,
    "cam": 0.07,
    "rough": 0.18,
    "rpms": [
      850,
      2100,
      3900,
      7200
    ]
  },
  "v8_ls_street_cam": {
    "title": "Pushrod V8 street cam",
    "banks": "cross",
    "depth": 0.9,
    "brightness": 0.48,
    "cam": 0.44,
    "rough": 0.36,
    "rpms": [
      800,
      1750,
      3500,
      6700
    ]
  },
  "v8_ls_race_cam": {
    "title": "Pushrod V8 race cam",
    "banks": "cross",
    "depth": 0.94,
    "brightness": 0.59,
    "cam": 0.88,
    "rough": 0.56,
    "rpms": [
      1050,
      2050,
      3900,
      6900
    ]
  },
  "v8_ls_straight_pipe": {
    "title": "Pushrod V8 open straight-pipe exhaust",
    "banks": "cross",
    "depth": 0.9,
    "brightness": 1.12,
    "cam": 0.1,
    "rough": 0.57,
    "rpms": [
      800,
      1700,
      3600,
      6900
    ]
  }
};
const EFFECTS = [
  "v8_turbo_spool_loop",
  "v8_twin_turbo_spool_loop",
  "v8_roots_whine_loop",
  "v8_twin_screw_whine_loop",
  "v8_centrifugal_whine_loop",
  "v8_intake_suction_loop",
  "v8_exhaust_burble_loop",
  "v8_exhaust_pop_single",
  "v8_exhaust_pop_double",
  "v8_bov_vent",
  "v8_bov_recirc",
  "v8_compressor_flutter",
  "v8_external_wastegate",
  "v8_blower_bypass",
  "v8_ignition_start",
  "v8_shift_cut",
  "v8_rev_limiter",
  "v8_shutdown"
];
function encodeWav(samples,rate){
 const out=new Uint8Array(44+samples.length*2);const view=new DataView(out.buffer);
 const write=(pos,s)=>{for(let i=0;i<s.length;i++)out[pos+i]=s.charCodeAt(i)};
 write(0,"RIFF");view.setUint32(4,out.length-8,true);write(8,"WAVE");write(12,"fmt ");view.setUint32(16,16,true);
 view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,rate,true);view.setUint32(28,rate*2,true);
 view.setUint16(32,2,true);view.setUint16(34,16,true);write(36,"data");view.setUint32(40,samples.length*2,true);
 for(let i=0;i<samples.length;i++)view.setInt16(44+i*2,Math.max(-32767,Math.min(32767,Math.round(samples[i]*32767))),true);
 return out;
}
function renderEngine(spec,rpm,layer,rate){
 const cycles=Math.max(6,Math.round(rpm/120));
 const frames=Math.round(rate*120*cycles/rpm);
 const signal=new Float32Array(frames);
 const firing=(spec.banks==="flat"?[0,1,0,1,0,1,0,1]:[0,1,0,0,1,1,0,1]);
 const coast=layer==="exhaust_off",intake=layer==="intake_on";
 const loaded=layer==="exhaust_on";
 const cam=spec.cam,rough=spec.rough,bright=spec.brightness,depth=spec.depth;
 for(let i=0;i<frames;i++){
  const x=i/frames,cycle=cycles*x,phase=cycle-Math.floor(cycle),omega=Math.PI*2*cycle;
  let a=0,b=0;
  for(let j=0;j<8;j++){
   const q=phase-j/8,d=q-Math.round(q);
   const imp=Math.exp(-.5*(d/.025)*(d/.025));
   const mod=1+cam*(.42*Math.sin(2*Math.PI*j/8+.65)-.16*(j%3===0?1:0));
   if(firing[j]===0)a+=imp*mod;else b+=imp*mod;
  }
  const pulses=a+b,banking=(a-b);
  const fundamental=Math.sin(8*omega+.24);
  const second=Math.sin(16*omega+.55);
  const third=Math.sin(24*omega+.11);
  const sub=Math.sin(4*omega+.51);
  const half=Math.sin(2*omega+.73);
  const sputter=cam*(.55*Math.sin(omega+.2)+.22*Math.sin(3*omega+1.11));
  const grit=Math.sin(2*Math.PI*147*x+.18)+.66*Math.sin(2*Math.PI*263*x+.8)+.35*Math.sin(2*Math.PI*389*x+.2);
  let s;
  if(intake){
    s=.12*fundamental+.23*second+(.12+.14*bright)*third+.085*banking+.052*grit*(.5+rough)+.04*half;
    s=Math.tanh(s*(1.3+bright*.32))*.46;
  }else{
    s=.27*fundamental+.10*second*(.65+bright)+(.035+.09*bright)*third+.18*sub*depth+.06*half*depth;
    s+=(pulses-.56)*(.14+.07*rough)+banking*(spec.banks==="flat"?.03:.095);
    s+=sputter*(loaded?.25:.10)+grit*(loaded?.022:.008)*(1+rough);
    if(coast)s=s*.54-.02*sub+.025*Math.sin(6*omega+.12);
    s=Math.tanh(s*(1.14+.40*rough+depth*.18))*(loaded?.58:.45);
  }
  // Full integer engine cycles and periodic sinusoidal grit: zero-click loop boundaries.
  signal[i]=s;
 }
 return {actual_rpm:120*cycles*rate/frames,signal};
}
function renderFx(name,rate){
 const looping=name.endsWith("_loop");
 const duration=looping?.80:name==="v8_ignition_start"?1.0:name==="v8_shutdown"?.85:name==="v8_exhaust_pop_double"?.50:.58;
 const frames=Math.round(rate*duration),result=new Float32Array(frames);
 for(let i=0;i<frames;i++){
  const x=i/frames,t=i/rate;const a=Math.PI*2;
  const noise=(looping?Math.sin(a*431*x+.3):Math.sin(a*1223*t+.3))*.61+
              (looping?Math.sin(a*827*x+.7):Math.sin(a*2039*t+.7))*.26+
              (looping?Math.sin(a*1199*x+.8):Math.sin(a*3907*t+.8))*.13;
  let s=0;
  if(name.includes("turbo_spool")){let freq=name.includes("twin")?310:255;s=.24*Math.sin(a*freq*x)+.11*Math.sin(a*2*freq*x)+.058*noise;}
  else if(name.includes("whine")){let freq=name.includes("centrifugal")?465:name.includes("twin_screw")?270:180;s=.28*Math.sin(a*freq*x)+.095*Math.sin(a*2*freq*x)+.028*noise;}
  else if(name==="v8_intake_suction_loop")s=.22*noise+.10*Math.sin(a*90*x);
  else if(name==="v8_exhaust_burble_loop")s=.24*Math.sin(a*48*x)+.13*Math.sin(a*96*x+.5)+.1*noise;
  else if(name==="v8_compressor_flutter"){const pulse=Math.max(0,Math.sin(a*(12-6*x)*t))**3;s=(.33*noise+.22*Math.sin(a*(850-370*x)*t))*pulse*Math.pow(1-x,1.1);}
  else if(name.includes("bov")||name.includes("wastegate")||name==="v8_blower_bypass"){const freq=name==="v8_bov_vent"?2200:name==="v8_external_wastegate"?1100:760;s=(.30*noise+.13*Math.sin(a*(freq-480*x)*t))*Math.pow(1-x,1.8);}
  else if(name==="v8_ignition_start"){s=(.28*Math.sin(a*(55+220*x)*t)+.12*noise)*Math.min(1,x*12)*Math.pow(1-x,.7);}
  else if(name==="v8_shutdown"){s=(.32*Math.sin(a*(210-190*x)*t)+.12*noise)*Math.pow(1-x,1.2);}
  else if(name.includes("pop")){const envelope=Math.exp(-28*x),second=name.endsWith("double")?Math.exp(-75*Math.max(0,x-.36))*(x>.36?1:0):0;s=(.38*noise+.26*Math.sin(a*155*t))*(envelope+second*.9);}
  else if(name==="v8_shift_cut")s=(.3*noise+.28*Math.sin(a*145*t))*Math.exp(-9*x);
  else if(name==="v8_rev_limiter"){const gate=Math.max(0,Math.sin(a*18*t));s=(.30*Math.sin(a*185*t)+.23*noise)*gate*Math.pow(1-x,.4);}
  if(!looping){const fade=Math.min(1,i/(rate*.004),(frames-i)/(rate*.004));s*=Math.max(0,fade);}
  result[i]=Math.tanh(s*1.08)*.66;
 }
 return result;
}
export {encodeWav,renderEngine,renderFx,SPECS,EFFECTS};
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
 const out=path.resolve(process.argv[2]||path.join(path.dirname(fileURLToPath(import.meta.url)),"audio"));
 for(const [id,spec] of Object.entries(SPECS))for(const rpm of spec.rpms)for(const layer of ["exhaust_on","exhaust_off","intake_on"]){
  const dest=path.join(out,"engines",id,rpm+"_"+layer+".wav");
  fs.mkdirSync(path.dirname(dest),{recursive:true});
  fs.writeFileSync(dest,Buffer.from(encodeWav(renderEngine(spec,rpm,layer,RATE).signal,RATE)));
 }
 for(const name of EFFECTS){
  const dest=path.join(out,"effects",name+".wav");fs.mkdirSync(path.dirname(dest),{recursive:true});
  fs.writeFileSync(dest,Buffer.from(encodeWav(renderFx(name,RATE),RATE)));
 }
 console.log("Rendered "+Object.keys(SPECS).length+" V8 banks and "+EFFECTS.length+" effects into "+out);
}
