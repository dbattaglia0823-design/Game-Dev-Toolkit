import {catalogFor} from '../layout-kit/catalog.js';
import {getPreset} from '../layout-kit/presets.js';
import {getContract,serializeLayout} from '../layout-kit/schema.js';
import {mountLayout} from '../layout-kit/runtime.js';
import {SAMPLE_DATA} from '../layout-kit/sample-data.js';

const $=id=>document.getElementById(id);
let selected='character-stats',mounted=null;
const getDoc=()=>getPreset(selected);
function download(suffix,content){
 const url=URL.createObjectURL(new Blob([content],{type:'application/json'}));
 const link=document.createElement('a');link.href=url;link.download=selected+suffix;
 document.body.append(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function showValues(target,values){
 target.replaceChildren();
 for(const value of values){
  const p=document.createElement('p');p.textContent=value;target.append(p);
 }
 if(!values.length)target.textContent='None';
}
function renderCatalog(){
 const query=$('search').value.trim().toLowerCase();
 const entries=catalogFor($('category').value).filter(e=>
  (e.name+' '+e.description+' '+e.key).toLowerCase().includes(query));
 const container=$('templates');container.replaceChildren();
 $('count').textContent=entries.length+' templates';
 for(const entry of entries){
  const button=document.createElement('button');button.type='button';button.className='template';
  button.setAttribute('role','listitem');button.setAttribute('aria-pressed',String(entry.key===selected));
  const name=document.createElement('strong');name.textContent=entry.name;
  const desc=document.createElement('small');desc.textContent=entry.description;
  const stats=document.createElement('small');stats.textContent=entry.nodeCount+' controls · '+entry.actionCount+' actions · '+entry.bindingCount+' bindings';
  button.append(name,desc,stats);
  button.addEventListener('click',()=>{selected=entry.key;renderCatalog();renderDetail();});
  container.append(button);
 }
}
function renderDetail(){
 const doc=getDoc(),contract=getContract(doc);
 $('name').textContent=doc.name;
 $('description').textContent=catalogFor().find(x=>x.key===selected)?.description??'';
 $('edit').href='../builder/index.html?preset='+encodeURIComponent(selected);
 $('validate').href='../validator/index.html?preset='+encodeURIComponent(selected);
 $('package-link').href='../package/index.html?preset='+encodeURIComponent(selected);
 mounted?.destroy();
 mounted=mountLayout({container:$('preview'),layout:doc,data:SAMPLE_DATA,
  onAction:(actionId,payload)=>{
   // Do not execute game actions in the template browser.
   $('action-output').textContent=JSON.stringify({actionId,nodeId:payload.nodeId,index:payload.index,value:payload.value},null,2);
  }});
 showValues($('actions'),contract.actions);
 showValues($('bindings'),contract.bindings);
 $('action-output').textContent='Click a button or select an item to see its declared action.';
}
$('category').addEventListener('change',renderCatalog);
$('search').addEventListener('input',renderCatalog);
$('export').addEventListener('click',()=>download('.layout.json',serializeLayout(getDoc())));
$('contract-export').addEventListener('click',()=>download('.contract.json',JSON.stringify(getContract(getDoc()),null,2)));
const key=new URLSearchParams(location.search).get('preset');
if(key&&catalogFor().some(x=>x.key===key))selected=key;
renderCatalog();renderDetail();
