// Original synthetic 48-kHz stereo V8 sound bank. No external recordings or dependencies.

export const RATE=48000;

export const SPECS={
  "v8_ls_race_cam": {
    "title": "Cammed pushrod V8",
    "plane": "cross",
    "cam": 0.91,
    "bass": 0.93,
    "brightness": 0.47,
    "rpms": [
      950,
      1400,
      2300,
      3700,
      5400,
      6800
    ]
  },
  "v8_coyote_dohc": {
    "title": "High-revving DOHC V8",
    "plane": "cross",
    "cam": 0.065,
    "bass": 0.68,
    "brightness": 0.92,
    "rpms": [
      900,
      1500,
      2600,
      4300,
      6200,
      7800
    ]
  }
};

export const PERSPECTIVES=["exterior","interior"];

export const LAYERS=["exhaust_on","exhaust_off","intake_on"];

export const FX=[
  {
    "id": "single_turbo_spool",
    "loop": true,
    "duration": 0.9
  },
  {
    "id": "twin_turbo_spool",
    "loop": true,
    "duration": 0.9
  },
  {
    "id": "roots_blower",
    "loop": true,
    "duration": 0.9
  },
  {
    "id": "twin_screw_blower",
    "loop": true,
    "duration": 0.9
  },
  {
    "id": "centrifugal_blower",
    "loop": true,
    "duration": 0.9
  },
  {
    "id": "compressor_air",
    "loop": true,
    "duration": 0.9
  },
  {
    "id": "wastegate_open",
    "loop": true,
    "duration": 0.9
  },
  {
    "id": "bov_vent",
    "loop": false,
    "duration": 0.72
  },
  {
    "id": "bov_recirc",
    "loop": false,
    "duration": 0.62
  },
  {
    "id": "flutter_soft",
    "loop": false,
    "duration": 0.66
  },
  {
    "id": "flutter_hard",
    "loop": false,
    "duration": 0.74
  },
  {
    "id": "blower_bypass",
    "loop": false,
    "duration": 0.59
  },
  {
    "id": "overrun_pop",
    "loop": false,
    "duration": 0.22
  }
];

const TAU=2*Math.PI;

export function encodeWav(left,right,rate){
 const n=left.length,out=new Uint8Array(44+n*4),v=new DataView(out.buffer);
 function ascii(pos,s){for(let i=0;i<s.length;i++)out[pos+i]=s.charCodeAt(i);}
 ascii(0,"RIFF");v.setUint32(4,out.length-8,true);ascii(8,"WAVE");ascii(12,"fmt ");v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,2,true);v.setUint32(24,rate,true);v.setUint32(28,rate*4,true);v.setUint16(32,4,true);v.setUint16(34,16,true);ascii(36,"data");v.setUint32(40,n*4,true);
 for(let i=0;i<n;i++){v.setInt16(44+4*i,Math.round(32767*Math.max(-.94,Math.min(.94,left[i]))),true);v.setInt16(46+4*i,Math.round(32767*Math.max(-.94,Math.min(.94,right[i]))),true);}
 return out;
}

export function renderEngine(spec,rpm,layer,perspective,rate){
 const revolutions=Math.max(8,Math.round((rpm/60)*.63/8)*8);
 const frames=Math.round(rate*60*revolutions/rpm);
 const l=new Float32Array(frames),r=new Float32Array(frames);
 const camGain=spec.cam*Math.max(0,Math.min(1,(2200-rpm)/1500));
 const bright=spec.brightness*(perspective==="interior"?.41:1);
 const chamber=perspective==="interior"?.92:1.0;
 for(let i=0;i<frames;i++){
   const x=i/frames,rev=revolutions*x, fire=rev*4, phase=TAU*fire;
   const event=Math.floor(fire),pos=fire-event;
   const period=event%8;
   const idx=(period+8)%8;
   const bankPattern=[0,1,0,0,1,1,0,1];
   const bank=bankPattern[idx]===0?1:-1;
   const chop=(1-camGain*(idx===1?.52:idx===4?.28:idx===6?.15:0));
   const lowOrder=.17*Math.sin(phase/4+.41)+.07*Math.sin(phase/8+.2);
   const firing=Math.exp(-Math.pow((pos-.12)/.15,2))-.40*Math.exp(-Math.pow((pos-.51)/.25,2));
   const base=.28*Math.sin(phase+.06)+(.165+bright*.075)*Math.sin(2*phase+.37)+(.073+bright*.11)*Math.sin(3*phase+.62)+(.026+bright*.075)*Math.sin(4*phase+.7);
   const note=base+spec.bass*lowOrder+.14*firing*bank+.07*camGain*Math.sin(TAU*rev/4+.2);
   const whoosh=.028*Math.sin(TAU*167*x+.15)+.018*Math.sin(TAU*367*x+.62)+.01*Math.sin(TAU*653*x+.77);
   const intake=layer==="intake_on";
   const coast=layer==="exhaust_off";
   const grit=intake?.06:.018;
   const rough=chop*(note+whoosh*grit/.018);
   let amp=intake?.29:coast?.30:.52;
   let v= (intake?(.16*Math.sin(phase)+(.17+bright*.13)*Math.sin(3*phase+.1)+whoosh*1.8):rough)*(coast?.72:1);
   if(perspective==="interior")v=(.67*v+.18*Math.sin(phase/2+.19)+.10*Math.sin(phase/4+.41))*chamber;
   let reflection=perspective==="exterior"?.035:.018;
   const side=reflection*(Math.sin(phase*2+.48)+.5*Math.sin(phase*3+.7));
   l[i]=Math.tanh((v+side)*1.32)*amp;
   r[i]=Math.tanh((v-side)*1.32)*amp;
 }
 return {left:l,right:r,actual_rpm:revolutions*rate/frames*60,duration:frames/rate};
}

export function renderFx(fx,rate){
 const frames=Math.round(rate*fx.duration),l=new Float32Array(frames),r=new Float32Array(frames),isLoop=fx.loop,id=fx.id;
 let phase=0;
 for(let i=0;i<frames;i++){
  const x=i/frames,t=i/rate;
  const hiss=.55*Math.sin(TAU*(isLoop?379*x:1501*t)+.3)+.30*Math.sin(TAU*(isLoop?727*x:2999*t)+.6)+.15*Math.sin(TAU*(isLoop?1021*x:5003*t)+.8);
  let core=0;
  if(id.includes("turbo_spool")){
    const f=id.startsWith("twin")?251:173;
    core=.26*Math.sin(TAU*f*x)+.14*Math.sin(TAU*2*f*x+.3)+.08*Math.sin(TAU*3*f*x)+hiss*.095;
  }else if(id.includes("blower")){
    const f=id.includes("centrifugal")?388:id.includes("twin")?211:137;
    core=.28*Math.sin(TAU*f*x)+.13*Math.sin(TAU*2*f*x)+.056*Math.sin(TAU*3*f*x)+.05*hiss;
  }else if(id==="compressor_air"||id==="wastegate_open"){
    core=.24*hiss+.08*Math.sin(TAU*(id==="compressor_air"?119:169)*x);
  }else if(id.includes("flutter")){
    const bursts=Math.pow(Math.max(0,Math.sin(TAU*(id==="flutter_hard"?15:9)*t*(1-.32*x))),3);
    phase+=TAU*(id==="flutter_hard"?1250-430*x:930-300*x)/rate;
    core=(.27*hiss+.26*Math.sin(phase))*bursts;
  }else{
    const f=id==="bov_vent"?2180:id==="bov_recirc"?1020:id==="blower_bypass"?710:171;
    phase+=TAU*(f*(1-.72*x))/rate;
    core=.29*hiss+.23*Math.sin(phase);
  }
  const env=isLoop?1:Math.pow(1-x,id==="overrun_pop"?4.7:1.7);
  const entry=isLoop?1:Math.min(1,i/(rate*.008));
  const s=Math.tanh(core*1.38)*.56*env*entry;
  l[i]=s+.025*s*Math.sin(TAU*(isLoop?17*x:83*t));
  r[i]=s-.025*s*Math.sin(TAU*(isLoop?17*x:83*t));
 }
 return {left:l,right:r};
}

export function crc32(bytes){
 let v=0xffffffff;
 for(const b of bytes){v^=b;for(let j=0;j<8;j++)v=(v&1)?(0xedb88320^(v>>>1)):(v>>>1);}
 return (v^0xffffffff)>>>0;
}

export function zipStore(files){
 const parts=[],central=[];let offset=0,total=22;
 for(const f of files){
  if(!/^[a-z0-9_/-]+\.wav$/.test(f.name)||f.name.includes(".."))throw Error("Unsafe file path");
  const b=f.bytes,n=new Uint8Array(f.name.length);
  for(let j=0;j<n.length;j++)n[j]=f.name.charCodeAt(j);
  const chk=crc32(b);
  const local=new Uint8Array(30+n.length),v=new DataView(local.buffer);v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint32(14,chk,true);v.setUint32(18,b.length,true);v.setUint32(22,b.length,true);v.setUint16(26,n.length,true);local.set(n,30);
  const cd=new Uint8Array(46+n.length),c=new DataView(cd.buffer);c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint32(16,chk,true);c.setUint32(20,b.length,true);c.setUint32(24,b.length,true);c.setUint16(28,n.length,true);c.setUint32(42,offset,true);cd.set(n,46);
  parts.push(local,b);central.push(cd);offset+=local.length+b.length;total+=local.length+b.length+cd.length;
 }
 const out=new Uint8Array(total),end=new Uint8Array(22),e=new DataView(end.buffer);e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);let directorySize=central.reduce((s,x)=>s+x.length,0);e.setUint32(12,directorySize,true);e.setUint32(16,offset,true);
 let at=0;for(const item of [...parts,...central,end]){out.set(item,at);at+=item.length;}
 return out;
}

export function base64Encode(bytes){
 const alphabet="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",out=[];
 for(let i=0;i<bytes.length;i+=3){
  const n=(bytes[i]<<16)|((bytes[i+1]??0)<<8)|(bytes[i+2]??0);
  out.push(alphabet[n>>>18],alphabet[(n>>>12)&63],i+1<bytes.length?alphabet[(n>>>6)&63]:"=",i+2<bytes.length?alphabet[n&63]:"=");
 }
 return out.join("");
}
