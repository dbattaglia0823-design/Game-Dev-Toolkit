import {NODE_TYPES,makeLayout,normalizeLayout,addNode,modifyNode,deleteNode,connectNodes,disconnectNodes,reorderNode,duplicateNode,parseLayout,serializeLayout,getContract} from '../layout-kit/schema.js';
import {PRESETS,getPreset} from '../layout-kit/presets.js';
import {mountLayout} from '../layout-kit/runtime.js';
import {calculateCanvasScale} from './viewport.js';
import {connectionPaths} from '../layout-kit/connections.js';
import {SAMPLE_DATA} from '../layout-kit/sample-data.js';

const $=id=>document.getElementById(id);
const canvas=$('canvas'),stage=$('canvas-stage'),scroll=$('stage-scroll');
let doc=makeLayout(),selected='',past=[],future=[],clipboard=null,drag=null,preview=null,connectSource='',connectMode=false;
const actionTypes=new Set(['button','grid','list','slot','toggle','slider','input']);
const bindingTypes=new Set(['label','grid','list','slot','progress','toggle','slider','input']);
const editable=el=>Boolean(el?.closest?.('input, textarea, select, [contenteditable="true"]'));
const snap=n=>$('snap').checked?Math.round(n/10)*10:Math.round(n);
const msg=s=>$('status').textContent=s;
const active=()=>doc.nodes.find(n=>n.id===selected);
function restore(next) {
 if(preview){preview.destroy();preview=null;$('preview').textContent='Test actions';$('event-log').hidden=true;}
 connectSource='';
 doc=normalizeLayout(next);selected='';render();
}
function commit(next,notice='Updated layout'){
 try{
  const clean=normalizeLayout(next);
  if(JSON.stringify(clean)===JSON.stringify(doc))return;
  if(preview){preview.destroy();preview=null;$('preview').textContent='Test actions';$('event-log').hidden=true;}
  past.push(structuredClone(doc));if(past.length>75)past.shift();future=[];
  doc=clean;render();msg(notice);
 }catch(error){msg(error.message);}
}
function historyMove(isRedo=false){
 const from=isRedo?future:past,to=isRedo?past:future;
 if(!from.length)return;
 to.push(structuredClone(doc));doc=from.pop();selected='';render();msg(isRedo?'Redone':'Undone');
}
function download(suffix,content,mime='application/json'){
 const url=URL.createObjectURL(new Blob([content],{type:mime}));
 const a=document.createElement('a');a.href=url;
 a.download=(doc.name.replace(/[^a-z0-9_-]+/gi,'-').replace(/^-|-$/g,'').slice(0,55)||'ui-layout')+suffix;
 document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 msg('Exported '+suffix);
}
function fit(){
 const css=getComputedStyle(scroll);
 const width=Math.max(1,scroll.clientWidth-parseFloat(css.paddingLeft)-parseFloat(css.paddingRight)-2);
 const height=Math.max(1,scroll.clientHeight-parseFloat(css.paddingTop)-parseFloat(css.paddingBottom)-2);
 const scale=calculateCanvasScale(width,height);
 canvas.style.transform='scale('+scale+')';
 stage.style.width=Math.ceil(800*scale)+'px';stage.style.height=Math.ceil(500*scale)+'px';
}
function inspector(){
 const node=active();$('properties').hidden=!node;
 $('selection-summary').textContent=node?node.type+' • '+node.id:'Select a control to edit.';
 if(!node)return;
 for(const field of ['id','label','role','shape','actionId','bindingKey','x','y','w','h'])$('prop-'+field).value=node[field];
 $('prop-shape').disabled=!['button','slot'].includes(node.type);
 $('prop-actionId').disabled=!actionTypes.has(node.type);
 $('prop-bindingKey').disabled=!bindingTypes.has(node.type);
}
function select(id){
 if(connectMode && id){
  const target=doc.nodes.find(n=>n.id===id);
  if(!target || !['button','slot'].includes(target.type)){msg('Connections must link buttons or slots.');return;}
  if(!connectSource){connectSource=id;msg('Select another button to connect from '+id);return;}
  const from=connectSource;connectSource='';
  if(from===id){msg('Choose two different buttons.');return;}
  try{commit(connectNodes(doc,from,id),'Connected '+from+' to '+id);}catch(error){msg(error.message);}
  return;
 }
 selected=id;
 for(const el of canvas.querySelectorAll('.wf-node'))el.classList.toggle('selected',el.dataset.id===id);
 for(const el of $('layers').children)el.setAttribute('aria-pressed',String(el.dataset.id===id));
 inspector();
}
function guides(node){
 canvas.querySelectorAll('.wf-gridguide').forEach(el=>el.remove());
 if(!$('snap').checked)return;
 const xs=[0,400,800],ys=[0,250,500];
 for(const other of doc.nodes)if(other.id!==node.id){
  xs.push(other.x,other.x+other.w,other.x+other.w/2);
  ys.push(other.y,other.y+other.h,other.y+other.h/2);
 }
 const centerX=node.x+node.w/2,centerY=node.y+node.h/2;
 const x=xs.find(v=>Math.abs(v-centerX)<=5),y=ys.find(v=>Math.abs(v-centerY)<=5);
 if(x!==undefined){const el=document.createElement('div');el.className='wf-gridguide vertical';el.style.left=x+'px';canvas.append(el);}
 if(y!==undefined){const el=document.createElement('div');el.className='wf-gridguide horizontal';el.style.top=y+'px';canvas.append(el);}
}
function nodeElement(node){
 const el=document.createElement('div');el.className='wf-node';el.dataset.id=node.id;el.dataset.type=node.type;el.dataset.shape=node.shape;el.tabIndex=0;
 el.setAttribute('role','button');el.setAttribute('aria-label',node.type+' '+(node.label||node.role||node.id));
 el.style.cssText='left:'+node.x+'px;top:'+node.y+'px;width:'+node.w+'px;height:'+node.h+'px';
 const title=document.createElement('span');title.textContent=node.label||node.role||node.type;el.append(title);
 const tag=document.createElement('small');tag.textContent=node.type.toUpperCase();el.append(tag);
 const handle=document.createElement('div');handle.className='wf-resize';el.append(handle);
 el.addEventListener('click',event=>{event.stopPropagation();select(node.id);});
 el.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();select(node.id);}});
 el.addEventListener('pointerdown',event=>{
  if(event.button!==0)return;event.preventDefault();event.stopPropagation();
  if(connectMode){select(node.id);return;}
  select(node.id);
  const rect=canvas.getBoundingClientRect();
  drag={id:node.id,mode:event.target===handle?'resize':'move',startX:event.clientX,startY:event.clientY,scaleX:800/rect.width,scaleY:500/rect.height,origin:structuredClone(doc),node:structuredClone(node)};
  el.setPointerCapture(event.pointerId);
 });
 el.addEventListener('pointermove',event=>{
  if(!drag||drag.id!==node.id||!el.hasPointerCapture(event.pointerId))return;
  const dx=(event.clientX-drag.startX)*drag.scaleX,dy=(event.clientY-drag.startY)*drag.scaleY;
  const changes=drag.mode==='move'?{x:snap(drag.node.x+dx),y:snap(drag.node.y+dy)}:{w:snap(drag.node.w+dx),h:snap(drag.node.h+dy)};
  if(drag.mode==='resize' && drag.node.shape==='circle')changes.h=changes.w;
  const candidate=modifyNode(drag.origin,node.id,changes);
  const current=candidate.nodes.find(n=>n.id===node.id);
  el.style.left=current.x+'px';el.style.top=current.y+'px';el.style.width=current.w+'px';el.style.height=current.h+'px';
  // Use a temporary working document only for guides; history commits on release.
  doc=candidate;drawConnections();guides(current);inspector();
 });
 const end=event=>{
  if(!drag||drag.id!==node.id)return;
  const current=doc,original=drag.origin;drag=null;doc=original;
  commit(current,'Moved or resized '+node.id);
  canvas.querySelectorAll('.wf-gridguide').forEach(x=>x.remove());
  if(el.hasPointerCapture(event.pointerId))el.releasePointerCapture(event.pointerId);
 };
 el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);
 return el;
}
function drawConnections(){
 canvas.querySelector('.wf-edges')?.remove();
 if(!doc.edges.length)return;
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 svg.classList.add('wf-edges');svg.setAttribute('viewBox','0 0 800 500');svg.setAttribute('aria-hidden','true');
 for(const edge of connectionPaths(doc)){
  const line=document.createElementNS('http://www.w3.org/2000/svg','line');
  for(const key of ['x1','y1','x2','y2'])line.setAttribute(key,String(edge[key]));
  svg.append(line);
 }
 canvas.prepend(svg);
}
function render(){
 canvas.replaceChildren();
 drawConnections();
 for(const node of doc.nodes)canvas.append(nodeElement(node));
 const layers=$('layers');layers.replaceChildren();
 for(const node of [...doc.nodes].reverse()){
  const b=document.createElement('button');b.type='button';b.dataset.id=node.id;
  b.textContent=node.type+' · '+(node.role||node.label||node.id);
  b.addEventListener('click',()=>select(node.id));layers.append(b);
 }
 const connections=$('connections');connections.replaceChildren();
 for(const edge of doc.edges){
  const row=document.createElement('div');row.className='wf-connection-row';
  const title=document.createElement('span');title.textContent=edge.from+' → '+edge.to;
  const remove=document.createElement('button');remove.type='button';remove.textContent='Remove';remove.className='gdt-btn';
  remove.addEventListener('click',()=>commit(disconnectNodes(doc,edge.from,edge.to),'Connection removed'));
  row.append(title,remove);connections.append(row);
 }
 if(!doc.edges.length)connections.textContent='No connections.';
 $('screen-name').value=doc.name;$('count').textContent=doc.nodes.length+' controls';
 $('undo').disabled=!past.length;$('redo').disabled=!future.length;
 const contract=getContract(doc),element=$('contract');element.replaceChildren();
 for(const [title,values] of [['Actions',contract.actions],['Data bindings',contract.bindings]]){
  const h=document.createElement('strong');h.textContent=title;element.append(h);
  const p=document.createElement('p');p.textContent=values.length?values.join(', '):'None';element.append(p);
 }
 select(active()?selected:'');
}
function add(type,pos={}){
 try{
  const next=addNode(doc,type,pos);selected=next.nodes.at(-1).id;commit(next,'Added '+type);
 }catch(error){msg(error.message);}
}
function remove(){
 if(!selected)return;
 const next=deleteNode(doc,selected);connectSource='';selected='';commit(next,'Control removed');
}
function duplicate(){
 if(!selected)return;
 const next=duplicateNode(doc,selected);selected=next.nodes.at(-1).id;commit(next,'Control duplicated');
}
function copy(){if(active()){clipboard=structuredClone(active());msg('Copied control.');}}
function paste(){
 if(!clipboard)return;
 add(clipboard.type,{...clipboard,id:'',x:clipboard.x+20,y:clipboard.y+20});
}
for(const type of NODE_TYPES){
 const b=document.createElement('button');b.type='button';b.textContent=type;
 b.draggable=true;b.addEventListener('click',()=>add(type));
 b.addEventListener('dragstart',ev=>ev.dataTransfer.setData('text/plain',type));$('palette').append(b);
}
canvas.addEventListener('dragover',ev=>ev.preventDefault());
canvas.addEventListener('drop',ev=>{
 ev.preventDefault();const type=ev.dataTransfer.getData('text/plain');
 if(!NODE_TYPES.includes(type))return;
 const rect=canvas.getBoundingClientRect();
 add(type,{x:snap((ev.clientX-rect.left)*800/rect.width),y:snap((ev.clientY-rect.top)*500/rect.height)});
});
canvas.addEventListener('click',ev=>{if(ev.target===canvas)select('');});
for(const field of ['id','label','role','shape','actionId','bindingKey','x','y','w','h']){
 $('prop-'+field).addEventListener('change',ev=>{
  const current=active();if(!current)return;
  const value=['x','y','w','h'].includes(field)?Number(ev.target.value):ev.target.value;
  const next=structuredClone(doc);
  const target=next.nodes.find(x=>x.id===selected);
  target[field]=value;
  if(field==='id'){
   next.edges=next.edges.map(edge=>({from:edge.from===current.id?value:edge.from,to:edge.to===current.id?value:edge.to}));
   selected=value;
  }
  if(field==='shape'&&value==='circle')target.h=target.w;
  if(['w','h'].includes(field)&&target.shape==='circle')target.w=target.h=value;
  try{commit(normalizeLayout(next),'Updated '+field);}
  catch(error){selected=current.id;render();msg(error.message);}
 });
}
$('connect-mode').addEventListener('click',()=>{
 connectMode=!connectMode;connectSource='';$('connect-mode').setAttribute('aria-pressed',String(connectMode));
 $('connect-mode').textContent=connectMode?'Finish connecting':'Connect nodes';
 msg(connectMode?'Click two buttons to create a connection.':'Connection mode disabled.');
});
$('template').addEventListener('change',ev=>{
 const key=ev.target.value;selected='';
 commit(key==='blank'?makeLayout():getPreset(key),'Loaded '+key);
});
$('screen-name').addEventListener('change',ev=>commit({...doc,name:ev.target.value},'Screen renamed'));
$('forward').addEventListener('click',()=>commit(reorderNode(doc,selected,1),'Layer moved'));
$('backward').addEventListener('click',()=>commit(reorderNode(doc,selected,-1),'Layer moved'));
$('duplicate').addEventListener('click',duplicate);
$('delete').addEventListener('click',remove);
$('copy').addEventListener('click',copy);$('paste').addEventListener('click',paste);
$('undo').addEventListener('click',()=>historyMove());
$('redo').addEventListener('click',()=>historyMove(true));
$('save').addEventListener('click',()=>{try{localStorage.setItem('gdt.functional-layout.v2',serializeLayout(doc));msg('Saved locally. Export JSON for sharing with Codex.');}catch{msg('Local storage unavailable. Export JSON.');}});
$('load').addEventListener('click',()=>{try{const saved=localStorage.getItem('gdt.functional-layout.v2');if(!saved)return msg('No saved layout.');restore(parseLayout(saved));past=[];future=[];render();msg('Saved layout loaded.');}catch(error){msg('Load failed: '+error.message);}});
$('export').addEventListener('click',()=>download('.layout.json',serializeLayout(doc)));
$('package-current').addEventListener('click',()=>{
 try{
  sessionStorage.setItem('gdt.package.draft.v2',serializeLayout(doc));
  location.href='../package/index.html';
 }catch(error){msg('Browser storage unavailable. Export JSON and import it in the Package Builder: '+error.message);}
});
$('contract-export').addEventListener('click',()=>download('.contract.json',JSON.stringify(getContract(doc),null,2)));
$('import').addEventListener('change',async ev=>{
 const file=ev.target.files?.[0];if(!file)return;
 try{if(file.size>250000)throw Error('File too large');restore(parseLayout(await file.text()));past=[];future=[];render();msg('Imported functional layout.');}
 catch(error){msg('Import failed: '+error.message);}ev.target.value='';
});
$('preview').addEventListener('click',()=>{
 if(preview){preview.destroy();preview=null;$('preview').textContent='Test actions';$('event-log').hidden=true;render();return;}
 preview=mountLayout({container:canvas,layout:doc,data:SAMPLE_DATA,onAction:(id,payload)=>{$('event-output').textContent=JSON.stringify({actionId:id,payload},null,2);}});
 $('preview').textContent='Back to editing';$('event-log').hidden=false;msg('Test mode: click a control to inspect emitted actions.');
});
document.addEventListener('keydown',ev=>{
 if(editable(ev.target))return;
 const key=ev.key.toLowerCase(),mod=ev.ctrlKey||ev.metaKey;
 if(mod&&key==='z'){ev.preventDefault();historyMove(ev.shiftKey);}
 else if(mod&&key==='y'){ev.preventDefault();historyMove(true);}
 else if(mod&&key==='c'){ev.preventDefault();copy();}
 else if(mod&&key==='v'){ev.preventDefault();paste();}
 else if(!preview&&(ev.key==='Delete'||ev.key==='Backspace')){ev.preventDefault();remove();}
 else if(!preview&&active()&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(ev.key)){
  ev.preventDefault();const d=ev.shiftKey?10:1;
  const [x,y]=ev.key==='ArrowLeft'?[-d,0]:ev.key==='ArrowRight'?[d,0]:ev.key==='ArrowUp'?[0,-d]:[0,d];
  const node=active();commit(modifyNode(doc,selected,{x:node.x+x,y:node.y+y}),'Control moved');
 }
});
const requestedPreset=new URLSearchParams(location.search).get('preset');
if(requestedPreset && Object.hasOwn(PRESETS,requestedPreset)) {
 doc=getPreset(requestedPreset);
 $('template').value=requestedPreset;
}
render();fit();
if(typeof ResizeObserver!=='undefined')new ResizeObserver(fit).observe(scroll);
window.addEventListener('resize',fit);
