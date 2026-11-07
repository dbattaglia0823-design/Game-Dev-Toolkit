import {getPreset,PRESETS} from '../layout-kit/presets.js';
import {getContract,parseLayout,serializeLayout} from '../layout-kit/schema.js';
import {validateIntegration} from '../layout-kit/validator.js';
import {createZip} from './zip.js';
export const MAX_TEMPLATES=30;
export const ENGINE_FILES=Object.freeze({
 web:['layout-kit/schema.js','layout-kit/runtime.js','layout-kit/runtime.css'],
 godot:['godot/layout-kit/ui_layout.gd']
});
export const BEHAVIOR_FILES=Object.freeze({
 web:['layout-kit/behaviors.js','layout-kit/workflow.js','layout-kit/confirmation-dialog.js'],
 godot:['godot/layout-kit/ui_behaviors.gd']
});
export function slug(text){
 return String(text).toLowerCase().replace(/[^a-z0-9_-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,60)||'layout';
}
export function resolveLayouts({keys=[],custom=[]}={}){
 if(!Array.isArray(keys)||!Array.isArray(custom))throw new TypeError('Invalid template selection');
 if(keys.length+custom.length>MAX_TEMPLATES)throw new RangeError('Maximum 30 templates per package');
 const docs=[];
 for(const key of keys){if(typeof key!=='string'||!Object.hasOwn(PRESETS,key))throw new Error('Unknown template key');docs.push({key,layout:getPreset(key)});}
 for(const [i,source] of custom.entries()){
  // Accept previously parsed objects or exported JSON; strict v2 validation precedes any normalization.
  const value=typeof source==='string'?JSON.parse(source):source;
  docs.push({key:'custom-'+(i+1),layout:value});
 }
 if(!docs.length)throw new Error('Select at least one template');
 const seen=new Set();
 for(const item of docs){
  const checked=validateIntegration(item.layout);
  if(!checked.valid)throw new Error('Invalid '+item.key+': '+checked.errors.map(x=>x.code).join(', '));
  let filename=slug(item.key),index=2;while(seen.has(filename))filename=slug(item.key)+'-'+index++;
  seen.add(filename);item.filename=filename;
 }
 return docs;
}
export function getSourceList(engine,includeBehaviors){
 if(!Object.hasOwn(ENGINE_FILES,engine))throw new Error('Engine must be web or godot');
 return [...ENGINE_FILES[engine],...(includeBehaviors?BEHAVIOR_FILES[engine]:[])];
}
export function sourceLocation(engine,path){
 if(engine==='web')return {url:'../'+path,archive:'runtime/'+path.replace(/^layout-kit\//,'')};
 if(engine==='godot')return {url:'../../'+path,archive:'runtime/'+path.replace(/^godot\/layout-kit\//,'')};
 throw new Error('Unknown engine');
}
function instructions(engine,docs,includeBehaviors,manifest){
 const contracts=docs.map(x=>getContract(x.layout));
 const actions=[...new Set(contracts.flatMap(x=>x.actions))].sort();
 const bindings=[...new Set(contracts.flatMap(x=>x.bindings))].sort();
 const lines=[
  '# Codex integration handoff — '+(engine==='web'?'Web':'Godot 4'),'',
  'These are functional wireframes. Preserve geometry, semantic roles, action IDs and bindings.',
  'Style the controls and connect gameplay logic in the target game. Never replace existing saves, economy or inventory systems.','',
  '## Layouts',...docs.map(x=>'- layouts/'+x.filename+'.layout.json ('+x.layout.name+')'),'',
  '## Action IDs to implement',...(actions.length?actions.map(x=>'- '+x):['- None']),'',
  '## Data binding keys',...(bindings.length?bindings.map(x=>'- '+x):['- None']),'',
  '## Codex checklist',
  '1. Read manifest.json, all contracts and validation reports. Warnings require review.',
  '2. Copy the included runtime files together; preserve module imports and filenames.',
  '3. Bind every required data key to the existing game state.',
  '4. Connect every supported action to the real game logic. Purchases, crafting and equipment require game-side validation.',
  '5. Replace wireframe styling with the project theme, assets and responsive rules.',
  '6. Test in the target game on desktop/mobile as applicable, including navigation and save/load.',''
 ];
 if(engine==='web')lines.push('## Web',
  'Copy runtime/ into the web project. Import mountLayout from ./runtime/runtime.js.',
  'Load the chosen layout JSON, then call mountLayout({container,layout,data,onAction}).',
  'Call the returned setData after game state changes. runtime.css is optional neutral styling.',
  'If included, workflow.js uses behaviors.js and optional confirmation-dialog.js.','');
 else lines.push('## Godot 4',
  'Attach runtime/ui_layout.gd to a Control node. Copy layout JSON to res://ui/templates/.',
  'Call load_from_file(path) and set_data(Dictionary); connect action_requested(action_id,payload).',
  'If included, attach runtime/ui_behaviors.gd to a separate Node and connect its signals.',
  'Configure responsive anchors, input focus and visual styling inside the game.','');
 lines.push('## Important limitations',
  'A valid exported layout does not prove game integration is complete.',
  'Schema v2 only; legacy visual layouts are not compatible.',
  'This package contains no game assets, private files, credentials or gameplay logic.',
  'The runtime code is a static copy, not an auto-updating dependency.',
  'Included behavior modules: '+(includeBehaviors?'yes':'no'),
  'Runtime files: '+manifest.runtimeFiles.join(', '),'');
 return lines.join('\n');
}
/** fetchSource is intentionally injectable: tests can supply exact file contents without a network. */
export async function buildPackage({engine='web',keys=[],custom=[],includeBehaviors=true,fetchSource}={}){
 if(typeof fetchSource!=='function')throw new TypeError('Source loader required');
 const docs=resolveLayouts({keys,custom}),sources=getSourceList(engine,includeBehaviors);
 const files=new Map();
 const records=[],contracts=[];
 for(const item of docs){
  const contract=getContract(item.layout),validation=validateIntegration(item.layout);
  const prefix=item.filename;
  files.set('layouts/'+prefix+'.layout.json',serializeLayout(item.layout)+'\n');
  files.set('contracts/'+prefix+'.contract.json',JSON.stringify(contract,null,2)+'\n');
  files.set('validation/'+prefix+'.validation.json',JSON.stringify(validation,null,2)+'\n');
  records.push({key:item.key,filename:prefix+'.layout.json',name:item.layout.name,
   actionCount:contract.actions.length,bindingCount:contract.bindings.length,
   warningCount:validation.warnings.length});
  contracts.push(contract);
 }
 for(const file of sources){
  const loc=sourceLocation(engine,file),content=await fetchSource(loc.url);
  if(typeof content!=='string'||!content.length)throw new Error('Could not load runtime source '+file);
  files.set(loc.archive,content);
 }
 const manifest={format:'gdt-ui-integration-package',packageVersion:1,layoutSchemaVersion:2,
  engine,includeBehaviors,templates:records,runtimeFiles:[...files.keys()].filter(x=>x.startsWith('runtime/')),
  actionIds:[...new Set(contracts.flatMap(x=>x.actions))].sort(),
  bindingKeys:[...new Set(contracts.flatMap(x=>x.bindings))].sort(),
  integrationVerified:false};
 files.set('manifest.json',JSON.stringify(manifest,null,2)+'\n');
 files.set('CODEX_INTEGRATION.md',instructions(engine,docs,includeBehaviors,manifest));
 return {bytes:createZip(files),manifest,files};
}
export function importLayoutText(text){return parseLayout(text);}
