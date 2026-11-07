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
 const layouts=docs.map(x=>'- `layouts/'+x.filename+'.layout.json` (`'+x.layout.name+'`)').join('\n');
 const actions=[...new Set(docs.flatMap(x=>getContract(x.layout).actions))];
 const bindings=[...new Set(docs.flatMap(x=>getContract(x.layout).bindings))];
 const header=`# Codex integration handoff — ${engine==='web'?'Web':'Godot 4'}\n\nThis package contains **functional wireframes** only. Preserve geometry, semantic roles, action IDs and data bindings. Customize visuals, control text, artwork, focus behavior and responsiveness to the target game. **Do not** replace the game's existing inventory, save system, economy or game logic.\n\n## Included layouts\n${layouts}\n\n## Actions to map\n${actions.map(x=>'- `'+x+'`').join('\n')||'- None'}\n\n## Game data to supply\n${bindings.map(x=>'- `'+x+'`').join('\n')||'- None'}\n\n## Integration workflow\n1. Read `manifest.json`, each layout JSON, its contract JSON, and `validation/*.json`. Fix structural issues. Warnings must be reviewed; validator results are not proof of game integration.\n2. Copy the included runtime adapter to the target game, keeping relative dependencies together.\n3. Connect every named action to existing game logic; do not auto-execute purchase/equip/upgrade actions without validation and authorization in that game.\n4. Map the target game's existing state into every declared data binding. Grid/list values must be arrays.\n5. Apply the game's own theme/assets, responsive layout, keyboard/controller and mobile behavior.\n6. Test each navigation path, action, save/load behavior and all supported screen sizes within the real game.\n\n`;
 const platform=engine==='web'?`## Web\nImport `runtime/schema.js` and `runtime/runtime.js` together. For example, in a module placed alongside `runtime/`: \`import {mountLayout} from './runtime/runtime.js';\` followed by loading a layout JSON and calling \`mountLayout({container,layout,data,onAction})\`. The optional `runtime/runtime.css` is plain demo styling: replace it. See `runtime/workflow.js` if included for reusable search, selection, navigation and confirmation. **The app must provide actual handlers and state.**\n`:
 `## Godot 4\nCopy `runtime/ui_layout.gd` to a project directory and attach it to a Control node. Copy JSON layouts to `res://ui/templates/`; load with \`load_from_file("res://ui/templates/your.layout.json")\`. Connect \`action_requested(action_id,payload)\` to the game's existing handlers; call \`set_data(Dictionary)\` with game state. If included, attach `runtime/ui_behaviors.gd` to a separate Node and wire behavior/game-action signals. Establish scaling and focus independently.\n`;
 return header+platform+`\n## Limitations\n- Schema v2 only; older visual-studio v1 files are incompatible.\n- Archive contains no private game files, art, credentials or executable gameplay logic.\n- Exported action names are *requirements*, not completed functionality.\n- This is a static distribution of the adapters at export time, not an auto-updating dependency.\n- Included runtime files: ${manifest.runtimeFiles.join(', ')}\n- Behavior modules: ${includeBehaviors?'Included; optional and require integration':'Not included'}\n`;
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
