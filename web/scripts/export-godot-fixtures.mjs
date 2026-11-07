/** Generate real v2 catalog fixtures for headless Godot adapter tests. */
import {mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {PRESETS,getPreset} from '../layout-kit/presets.js';
import {serializeLayout} from '../layout-kit/schema.js';

const root=join('godot','tests','generated');
mkdirSync(root,{recursive:true});
const manifest=[];
for(const key of Object.keys(PRESETS)){
 const doc=getPreset(key);
 writeFileSync(join(root,key+'.layout.json'),serializeLayout(doc)+'\n');
 manifest.push({key,count:doc.nodes.length});
}
writeFileSync(join(root,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log('Generated '+manifest.length+' Godot layout fixtures.');
