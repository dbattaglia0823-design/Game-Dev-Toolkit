#!/usr/bin/env node
// Rebuild the exact source-owned WAV archives shipped in bundles/.
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {SPECS,EFFECTS,encodeWav,renderEngine,renderFx} from "./render.mjs";
import {zipStore} from "./archive.mjs";

const HERE=path.dirname(fileURLToPath(import.meta.url));
const OUT=path.resolve(process.argv[2]||path.join(HERE,"bundles"));
const RATE=22050;
fs.mkdirSync(OUT,{recursive:true});
for(const [engine,spec] of Object.entries(SPECS)){
  const entries=spec.rpms.flatMap(rpm=>["exhaust_on","exhaust_off","intake_on"].map(layer=>({
    name:"engines/"+engine+"/"+rpm+"_"+layer+".wav",
    bytes:encodeWav(renderEngine(spec,rpm,layer,RATE).signal,RATE)
  })));
  fs.writeFileSync(path.join(OUT,engine+".zip"),Buffer.from(zipStore(entries)));
}
const effects=EFFECTS.map(name=>({name:"effects/"+name+".wav",bytes:encodeWav(renderFx(name,RATE),RATE)}));
fs.writeFileSync(path.join(OUT,"v8-effects.zip"),Buffer.from(zipStore(effects)));
console.log("Wrote "+Object.keys(SPECS).length+" engine bundles and 1 effects bundle to "+OUT);
