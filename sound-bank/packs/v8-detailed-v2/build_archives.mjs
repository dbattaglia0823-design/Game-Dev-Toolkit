import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {RATE,SPECS,PERSPECTIVES,LAYERS,FX,encodeWav,renderEngine,renderFx,zipStore} from "./render.mjs";
const root=path.dirname(fileURLToPath(import.meta.url));
const output=path.resolve(process.argv[2]||path.join(root,"bundles"));
fs.mkdirSync(output,{recursive:true});
for(const [id,spec] of Object.entries(SPECS))for(const perspective of PERSPECTIVES){
 const files=[];
 for(const rpm of spec.rpms)for(const layer of LAYERS){
  const snd=renderEngine(spec,rpm,layer,perspective,RATE);
  files.push({name:`engines/${id}/${perspective}/${rpm}_${layer}.wav`,bytes:encodeWav(snd.left,snd.right,RATE)});
 }
 fs.writeFileSync(path.join(output,`${id}_${perspective}.zip`),Buffer.from(zipStore(files)));
}
fs.writeFileSync(path.join(output,"v8-induction-and-events.zip"),Buffer.from(zipStore(FX.map(fx=>{const snd=renderFx(fx,RATE);return {name:`effects/${fx.id}.wav`,bytes:encodeWav(snd.left,snd.right,RATE)};}))));
console.log("Regenerated 48kHz V8 audio bundles in",output);
