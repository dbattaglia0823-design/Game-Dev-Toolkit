import {catalogFor,templateCatalog} from '../layout-kit/catalog.js';
import {getPreset} from '../layout-kit/presets.js';
import {getContract} from '../layout-kit/schema.js';
import {validateIntegration} from '../layout-kit/validator.js';
import {buildPackage,importLayoutText,MAX_TEMPLATES,getSourceList,sourceLocation} from './package-builder.js';

const $=id=>document.getElementById(id);
const selected=new Set();
const custom=[];
let busy=false;
const status=text=>$('status').textContent=text;
const checkedDocs=()=>[
 ...[...selected].map(key=>({name:key,layout:getPreset(key)})),
 ...custom.map(entry=>({name:entry.filename,layout:entry.layout}))
];
function selection(){
 const query=$('search').value.trim().toLowerCase();
 const choices=catalogFor($('category').value).filter(entry=>
  (entry.name+' '+entry.key+' '+entry.description).toLowerCase().includes(query));
 const list=$('template-list');list.replaceChildren();
 for(const entry of choices){
  const label=document.createElement('label');label.className='template-entry';
  const box=document.createElement('input');box.type='checkbox';box.value=entry.key;box.checked=selected.has(entry.key);
  box.addEventListener('change',()=>{
   if(box.checked&&selected.size+custom.length>=MAX_TEMPLATES){box.checked=false;status('Maximum '+MAX_TEMPLATES+' templates.');return;}
   if(box.checked)selected.add(entry.key);else selected.delete(entry.key);
   update();
  });
  const details=document.createElement('span'),name=document.createElement('strong'),description=document.createElement('small');
  name.textContent=entry.name;description.textContent=entry.description;
  details.append(name,description);label.append(box,details);list.append(label);
 }
 update();
}
function customList(){
 const list=$('custom-list');list.replaceChildren();
 for(const [index,entry] of custom.entries()){
  const row=document.createElement('div');row.className='custom-entry';
  const name=document.createElement('span');name.textContent=entry.filename+' — '+entry.layout.name;
  const remove=document.createElement('button');remove.className='gdt-btn';remove.textContent='Remove';
  remove.addEventListener('click',()=>{custom.splice(index,1);customList();update();});
  row.append(name,remove);list.append(row);
 }
}
function currentEngine(){return document.querySelector('input[name="engine"]:checked').value;}
function update(){
 const docs=checkedDocs(),actions=new Set(),bindings=new Set();
 let warnings=0,errors=0;
 const results=$('validation-results');results.replaceChildren();
 for(const doc of docs){
  const check=validateIntegration(doc.layout);
  errors+=check.errors.length;warnings+=check.warnings.length;
  for(const action of getContract(doc.layout).actions)actions.add(action);
  for(const binding of getContract(doc.layout).bindings)bindings.add(binding);
  if(check.warnings.length||check.errors.length){
   const row=document.createElement('p');row.textContent=doc.name+': '+check.errors.length+' errors, '+check.warnings.length+' warnings';
   results.append(row);
  }
 }
 if(!results.children.length)results.textContent=docs.length?'No structural errors or warnings detected.':'No templates selected.';
 $('selected-count').textContent=docs.length+' selected';
 $('layout-count').textContent=docs.length;
 $('action-count').textContent=actions.size;
 $('binding-count').textContent=bindings.size;
 $('warning-count').textContent=warnings;
 const engine=currentEngine(),behavior=$('behaviors').checked;
 const sourceFiles=getSourceList(engine,behavior);
 const contents=$('contents');contents.replaceChildren();
 for(const line of [
  docs.length+' layout JSON files',
  docs.length+' action/data contract files',
  docs.length+' validation report files',
  sourceFiles.length+' '+(engine==='web'?'JavaScript/CSS':'Godot GDScript')+' runtime files',
  'manifest.json',
  'CODEX_INTEGRATION.md'
 ]){
  const p=document.createElement('p');p.textContent=line;contents.append(p);
 }
 $('download').disabled=busy||docs.length===0||errors>0||docs.length>MAX_TEMPLATES;
 if(!busy)status(!docs.length?'Select at least one template.':errors?'Resolve structural errors before exporting.':'Ready to generate ZIP. Review '+warnings+' template warnings during integration.');
}
$('category').addEventListener('change',selection);
$('search').addEventListener('input',selection);
$('all').addEventListener('click',()=>{
 const query=$('search').value.trim().toLowerCase();
 for(const entry of catalogFor($('category').value)){
  if(!(entry.name+' '+entry.key+' '+entry.description).toLowerCase().includes(query))continue;
  if(selected.size+custom.length>=MAX_TEMPLATES)break;
  selected.add(entry.key);
 }
 selection();
});
$('clear').addEventListener('click',()=>{selected.clear();selection();});
for(const radio of document.querySelectorAll('input[name="engine"]'))radio.addEventListener('change',update);
$('behaviors').addEventListener('change',update);
$('custom-file').addEventListener('change',async event=>{
 const files=[...event.target.files];
 for(const file of files){
  if(selected.size+custom.length>=MAX_TEMPLATES){status('Maximum '+MAX_TEMPLATES+' templates.');break;}
  try{
   if(file.size>250000)throw new Error('Maximum file size is 250 KB');
   const layout=importLayoutText(await file.text());
   const result=validateIntegration(layout);
   if(!result.valid)throw new Error(result.errors.map(issue=>issue.code).join(', '));
   custom.push({filename:file.name,layout});
  }catch(error){status(file.name+': '+error.message);}
 }
 event.target.value='';customList();update();
});
$('download').addEventListener('click',async()=>{
 if(busy)return;
 busy=true;update();status('Generating package from repository files…');
 try{
  const engine=currentEngine();
  const built=await buildPackage({
   engine,keys:[...selected],custom:custom.map(entry=>entry.layout),includeBehaviors:$('behaviors').checked,
   fetchSource:async path=>{
    const res=await fetch(path,{cache:'no-cache'});
    if(!res.ok)throw new Error('Could not fetch '+path+' (HTTP '+res.status+')');
    return res.text();
   }
  });
  const url=URL.createObjectURL(new Blob([built.bytes],{type:'application/zip'}));
  const anchor=document.createElement('a');anchor.href=url;
  anchor.download='gdt-ui-'+engine+'-'+built.manifest.templates.length+'-templates.zip';
  document.body.append(anchor);anchor.click();anchor.remove();
  setTimeout(()=>URL.revokeObjectURL(url),3000);
  status('ZIP generated. Give it to Codex along with your target game repository.');
 }catch(error){status('Package failed: '+error.message);}
 finally{busy=false;const outcome=$('status').textContent;update();status(outcome);}
});
const params=new URLSearchParams(location.search);
const preset=params.get('preset');
if(preset&&templateCatalog().some(x=>x.key===preset))selected.add(preset);
try{
 const draft=sessionStorage.getItem('gdt.package.draft.v2');
 if(draft){
  const layout=importLayoutText(draft);
  if(validateIntegration(layout).valid)custom.push({filename:'edited-layout.layout.json',layout});
  sessionStorage.removeItem('gdt.package.draft.v2');
 }
}catch{ /* Private mode or malformed draft: use JSON file import. */ }
customList();selection();
