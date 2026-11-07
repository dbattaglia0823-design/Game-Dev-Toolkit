import { makePreset, addElement, updateElement, removeElement, importJSON, exportJSON, normalizeDocument } from './model.js';

const $ = id => document.getElementById(id);
const canvas = $('canvas');
let doc = makePreset('blank');
let selected = null;
let drag = null;
const STORAGE_KEY = 'gdt.visual-builder.v1';
const inputs = ['label','x','y','w','h','fill','radius','fontSize','value'];
const numFields = new Set(['x','y','w','h','radius','fontSize','value']);

function notify(message) { $('message').textContent = message; }
function selectedItem() { return doc.elements.find(item => item.id === selected); }
function syncInspector() {
  const item = selectedItem();
  $('properties').hidden = !item;
  $('selection-info').textContent = item ? item.type.toUpperCase() + ' · ' + item.id : 'Select a component to edit it.';
  if (!item) return;
  for (const field of inputs) $('prop-'+field).value = item[field];
  $('prop-fontSize').disabled = !['text','button'].includes(item.type);
  $('prop-value').disabled = item.type !== 'progress';
  $('prop-radius').disabled = item.type === 'text';
}
function render() {
  canvas.style.background = doc.background;
  $('background').value = doc.background;
  $('title').value = doc.title;
  $('count').textContent = doc.elements.length + ' components';
  canvas.replaceChildren();
  for (const item of doc.elements) {
    const el = document.createElement('div');
    el.className = 'canvas-item'+(selected === item.id?' selected':'');
    el.dataset.id=item.id;
    el.dataset.type=item.type;
    el.tabIndex=0;
    el.setAttribute('role','button');
    el.setAttribute('aria-label',item.type + ': ' + (item.label || 'untitled'));
    el.setAttribute('aria-pressed',String(selected===item.id));
    Object.assign(el.style,{left:item.x+'px',top:item.y+'px',width:item.w+'px',height:item.h+'px',borderRadius:item.radius+'px',fontSize:item.fontSize+'px'});
    if(item.type==='progress') {
      const fill=document.createElement('span');
      fill.className='progress-fill';
      fill.style.width=item.value+'%';
      fill.style.background=item.fill;
      el.append(fill);
    } else {
      el.textContent=item.label || (item.type === 'image' ? 'Image' : '');
      if (item.type === 'text') el.style.color=item.fill;
      else el.style.background=item.fill;
    }
    el.addEventListener('click',event=>{event.stopPropagation();select(item.id);});
    el.addEventListener('keydown',event=>{
      if(event.key==='Enter'||event.key===' '){event.preventDefault();select(item.id);}
      if(event.key==='Delete'){event.preventDefault();select(item.id);deleteSelection();}
    });
    el.addEventListener('pointerdown',event=>{
      if(event.button!==0) return;
      event.preventDefault();
      select(item.id);
      const rect=canvas.getBoundingClientRect();
      drag={id:item.id,startX:event.clientX,startY:event.clientY,x:item.x,y:item.y,scaleX:canvas.offsetWidth/rect.width,scaleY:canvas.offsetHeight/rect.height};
      el.setPointerCapture(event.pointerId);
    });
    el.addEventListener('pointermove',event=>{
      if(!drag || drag.id!==item.id || !el.hasPointerCapture(event.pointerId))return;
      doc=updateElement(doc,item.id,{x:drag.x+(event.clientX-drag.startX)*drag.scaleX,y:drag.y+(event.clientY-drag.startY)*drag.scaleY});
      const updated=selectedItem();
      el.style.left=updated.x+'px';el.style.top=updated.y+'px';
      $('prop-x').value=updated.x;$('prop-y').value=updated.y;
    });
    el.addEventListener('pointerup',event=>{if(drag?.id===item.id){drag=null;el.releasePointerCapture(event.pointerId);notify('Element moved.');}});
    el.addEventListener('pointercancel',()=>{drag=null;});
    canvas.append(el);
  }
  syncInspector();
}
function select(id) {
  selected=id;
  for(const element of canvas.querySelectorAll('.canvas-item')){
    const active=element.dataset.id===id;
    element.classList.toggle('selected',active);
    element.setAttribute('aria-pressed',String(active));
  }
  syncInspector();
}
function add(type,coordinates=null) {
  if(doc.elements.length>=100){notify('Maximum of 100 components reached.');return;}
  doc=addElement(doc,type);
  const added=doc.elements.at(-1);
  if(coordinates)doc=updateElement(doc,added.id,coordinates);
  selected=added.id;
  render();
  notify(type+' added. Drag to move or use the property inspector.');
}
function deleteSelection() {
  if(!selected)return;
  doc=removeElement(doc,selected);
  selected=null;
  render();
  notify('Component removed.');
}
function applyDocument(next) {doc=normalizeDocument(next);selected=null;render();}
function save() {
  try {localStorage.setItem(STORAGE_KEY,exportJSON(doc));notify('Saved in this browser. Export JSON for a portable copy.');}
  catch {notify('Browser storage is unavailable. Use Export JSON instead.');}
}
function download() {
  const blob=new Blob([exportJSON(doc)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const link=document.createElement('a');
  link.href=url;
  link.download=(doc.title.trim().replace(/[^a-z0-9_-]+/gi,'-').replace(/^-+|-+$/g,'').slice(0,60)||'ui-layout')+'.json';
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  notify('Layout exported as JSON.');
}
document.querySelectorAll('[data-type]').forEach(button=>{
  button.addEventListener('click',()=>add(button.dataset.type));
  button.addEventListener('dragstart',event=>{event.dataTransfer.setData('text/plain',button.dataset.type);event.dataTransfer.effectAllowed='copy';});
});
canvas.addEventListener('dragover',event=>{event.preventDefault();event.dataTransfer.dropEffect='copy';});
canvas.addEventListener('drop',event=>{
  event.preventDefault();
  const type=event.dataTransfer.getData('text/plain');
  if(!['panel','button','text','image','progress'].includes(type))return;
  const rect=canvas.getBoundingClientRect();
  add(type,{x:(event.clientX-rect.left)*(canvas.offsetWidth/rect.width),y:(event.clientY-rect.top)*(canvas.offsetHeight/rect.height)});
});
canvas.addEventListener('click',event=>{if(event.target===canvas)select(null);});
for(const field of inputs){
  $('prop-'+field).addEventListener('input',event=>{
    if(!selectedItem())return;
    const value=numFields.has(field)?Number(event.target.value):event.target.value;
    if(numFields.has(field) && !Number.isFinite(value))return;
    doc=updateElement(doc,selected,{[field]:value});
    // Keep focus in inspector while re-rendering the canvas.
    const current=selectedItem();
    const node=[...canvas.children].find(node=>node.dataset.id===selected);
    if(node){
      Object.assign(node.style,{left:current.x+'px',top:current.y+'px',width:current.w+'px',height:current.h+'px',borderRadius:current.radius+'px',fontSize:current.fontSize+'px'});
      if(current.type==='progress') {node.firstElementChild.style.width=current.value+'%';node.firstElementChild.style.background=current.fill;}
      else if(current.type==='text') {node.textContent=current.label;node.style.color=current.fill;}
      else {node.textContent=current.label;node.style.background=current.fill;}
    }
  });
}
$('delete').addEventListener('click',deleteSelection);
$('duplicate').addEventListener('click',()=>{
  const item=selectedItem();
  if(!item||doc.elements.length>=100)return;
  doc=addElement(doc,item.type);
  const fresh=doc.elements.at(-1);
  doc=updateElement(doc,fresh.id,{...item,id:fresh.id,x:item.x+20,y:item.y+20});
  selected=fresh.id;render();notify('Component duplicated.');
});
$('title').addEventListener('input',e=>{doc.title=e.target.value.slice(0,100);});
$('background').addEventListener('input',e=>{doc.background=e.target.value;canvas.style.background=doc.background;});
$('clear').addEventListener('click',()=>{doc={...doc,elements:[]};selected=null;render();notify('Canvas cleared.');});
$('preset').addEventListener('change',e=>{applyDocument(makePreset(e.target.value));notify('Template loaded (unsaved changes replaced).');});
$('save').addEventListener('click',save);
$('load').addEventListener('click',()=>{
  try{const saved=localStorage.getItem(STORAGE_KEY);if(!saved){notify('No saved layout found.');return;}applyDocument(importJSON(saved));notify('Saved layout loaded.');}
  catch{notify('Saved layout is invalid or browser storage is unavailable.');}
});
$('download').addEventListener('click',download);
$('import').addEventListener('change',async e=>{
  const file=e.target.files?.[0];
  if(!file)return;
  try{if(file.size>100000)throw new RangeError('File too large');applyDocument(importJSON(await file.text()));notify('Layout imported successfully.');}
  catch(error){notify('Could not import layout: '+error.message);}
  e.target.value='';
});
document.addEventListener('keydown',event=>{
  if(event.key!=='Delete'||!selected||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;
  deleteSelection();
});
render();
