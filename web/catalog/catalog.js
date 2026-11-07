import {catalogFor,familiesFor} from '../layout-kit/catalog.js';
import {getPreset} from '../layout-kit/presets.js';
import {getContract,serializeLayout} from '../layout-kit/schema.js';
import {mountLayout} from '../layout-kit/runtime.js';
import {SAMPLE_DATA} from '../layout-kit/sample-data.js';

const $=id=>document.getElementById(id);
let selected='character-stats',mounted=null;
const getDoc=()=>getPreset(selected);
function reportPreviewError(error){
 const preview=$('preview');preview.replaceChildren();
 const message=document.createElement('p');message.className='catalog-preview-error';
 message.textContent='Preview unavailable. You can still open or export this template.';
 preview.append(message);
 $('action-output').textContent='Preview error: '+String(error?.message??error);
}
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
 const entries=catalogFor($('category').value,$('family').value).filter(e=>
  (e.name+' '+e.description+' '+e.key).toLowerCase().includes(query));
 const container=$('templates');const cards=[];
 for(const entry of entries){
  const button=document.createElement('button');button.type='button';button.className='template';
  button.setAttribute('role','listitem');button.setAttribute('aria-pressed',String(entry.key===selected));
  const name=document.createElement('strong');name.textContent=entry.name;
  const desc=document.createElement('small');desc.textContent=entry.description;
  const stats=document.createElement('small');stats.textContent=entry.variantLabel+' · '+entry.nodeCount+' controls · '+entry.actionCount+' actions · '+entry.bindingCount+' bindings';
  button.append(name,desc,stats);
  button.addEventListener('click',()=>{selected=entry.key;renderCatalog();renderDetail();});
  cards.push(button);
 }
 container.replaceChildren(...cards);
 $('count').textContent=entries.length+' templates';
 if(!entries.length){
  const empty=document.createElement('p');empty.className='muted';
  empty.textContent='No templates match these filters. Clear the search or select a different menu type.';
  container.append(empty);
 }
}
function renderDetail(){
 const doc=getDoc(),contract=getContract(doc);
 $('name').textContent=doc.name;
 const activeEntry=catalogFor().find(x=>x.key===selected);
 $('description').textContent=activeEntry?.description??'';
 const variants=$('variants');variants.replaceChildren();
 for(const entry of catalogFor('all',activeEntry.family)){
  const button=document.createElement('button');button.type='button';button.className='gdt-btn';
  button.textContent=entry.variantLabel;
  button.setAttribute('aria-pressed',String(entry.key===selected));
  button.addEventListener('click',()=>{selected=entry.key;renderCatalog();renderDetail();});
  variants.append(button);
 }
 $('edit').href='../builder/index.html?preset='+encodeURIComponent(selected);
 $('validate').href='../validator/index.html?preset='+encodeURIComponent(selected);
 $('package-link').href='../package/index.html?preset='+encodeURIComponent(selected);
 showValues($('actions'),contract.actions);
 showValues($('bindings'),contract.bindings);
 try{
  mounted?.destroy();
  mounted=mountLayout({container:$('preview'),layout:doc,data:SAMPLE_DATA,
   onAction:(actionId,payload)=>{
    $('action-output').textContent=JSON.stringify({actionId,nodeId:payload.nodeId,index:payload.index,value:payload.value},null,2);
   }});
  $('action-output').textContent='Click a button or select an item to see its declared action.';
 }catch(error){reportPreviewError(error);}
}
function refreshFamilies(){
 const value=$('family').value;
 const options=$('family');options.replaceChildren();
 const all=document.createElement('option');all.value='all';all.textContent='All menu types';options.append(all);
 for(const item of familiesFor($('category').value)){
  const option=document.createElement('option');option.value=item.key;option.textContent=item.name;options.append(option);
 }
 options.value=[...options.options].some(x=>x.value===value)?value:'all';
 renderCatalog();
}
$('category').addEventListener('change',refreshFamilies);
$('family').addEventListener('change',renderCatalog);
$('search').addEventListener('input',renderCatalog);
$('export').addEventListener('click',()=>download('.layout.json',serializeLayout(getDoc())));
$('contract-export').addEventListener('click',()=>download('.contract.json',JSON.stringify(getContract(getDoc()),null,2)));
const key=new URLSearchParams(location.search).get('preset');
if(key&&catalogFor().some(x=>x.key===key))selected=key;
refreshFamilies();renderDetail();
