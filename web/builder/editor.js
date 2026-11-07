import {makePreset,normalizeDocument,addElement,updateElement,removeElement,importJSON,exportJSON} from './model.js';
import {History,LIBRARY,SCREENS,screenPreset,applyLibraryItem,reorder,moveElement,duplicate,BACKGROUNDS} from './studio.js';
import {exportHTML,exportGodot} from './exporters.js';
import {calculateCanvasScale} from './viewport.js';
const $=id=>document.getElementById(id);
const canvas=$('canvas'),stage=$('canvas-stage'),scroll=$('canvas-scroll');
let history=new History(makePreset('blank')),doc=history.current,selected=null,clipboard=null,gesture=null,inspectorBefore=null;
const numeric=new Set(['x','y','w','h','radius','fontSize','value']);
const editableTarget=target=>target?.closest?.('input, textarea, select, [contenteditable="true"]');
const snapshot=()=>structuredClone(doc);
function tell(s){$('message').textContent=s;}
function active(){return doc.elements.find(e=>e.id===selected);}
function commit(next,label='Updated'){
 if(history.commit(next)){doc=history.current;render();tell(label);}
}
function fit(){
 const styles=getComputedStyle(scroll);
 const w=Math.max(1,scroll.clientWidth-parseFloat(styles.paddingLeft)-parseFloat(styles.paddingRight)-2);
 const h=Math.max(1,scroll.clientHeight-parseFloat(styles.paddingTop)-parseFloat(styles.paddingBottom)-2);
 const scale=calculateCanvasScale(w,h);
 canvas.style.transform='scale('+scale+')';
 stage.style.width=Math.ceil(800*scale)+'px';stage.style.height=Math.ceil(500*scale)+'px';
}
function syncInspector(){
 const e=active();$('properties').hidden=!e;
 $('selection-info').textContent=e?e.type.toUpperCase()+' · '+e.id:'Select a component to edit it.';
 if(!e)return;
 for(const name of ['label','x','y','w','h','fill','radius','fontSize','value'])$('prop-'+name).value=e[name];
 $('prop-fontSize').disabled=!['text','button'].includes(e.type);
 $('prop-value').disabled=e.type!=='progress';$('prop-radius').disabled=e.type==='text';
}
function select(id,focus=false){
 selected=id;syncInspector();
 for(const el of canvas.querySelectorAll('.canvas-item')){
  const on=el.dataset.id===id;el.classList.toggle('selected',on);el.setAttribute('aria-pressed',String(on));
  if(on&&focus)el.focus({preventScroll:true});
 }
 for(const el of $('layers').children)el.classList.toggle('active-layer',el.dataset.id===id);
}
function guide(axis,position){
 const line=document.createElement('div');
 line.className='alignment-guide '+axis;
 line.style[axis==='x'?'left':'top']=position+'px';canvas.append(line);
}
function findGuides(e){
 canvas.querySelectorAll('.alignment-guide').forEach(el=>el.remove());
 if(!$('snap').checked)return;
 const cx=e.x+e.w/2,cy=e.y+e.h/2;
 const xs=[400],ys=[250];
 for(const other of doc.elements)if(other.id!==e.id){
   xs.push(other.x,other.x+other.w/2,other.x+other.w);
   ys.push(other.y,other.y+other.h/2,other.y+other.h);
 }
 const gx=xs.find(x=>Math.abs(x-cx)<5),gy=ys.find(y=>Math.abs(y-cy)<5);
 if(gx!==undefined)guide('x',gx);
 if(gy!==undefined)guide('y',gy);
}
function buildNode(e){
 const node=document.createElement('div');node.className='canvas-item';node.dataset.id=e.id;node.dataset.type=e.type;
 node.tabIndex=0;node.setAttribute('role','button');node.setAttribute('aria-label',e.type+': '+(e.label||'untitled'));
 node.style.cssText=`left:${e.x}px;top:${e.y}px;width:${e.w}px;height:${e.h}px;border-radius:${e.radius}px;font-size:${e.fontSize}px;`;
 if(e.type==='progress'){
   const bar=document.createElement('span');bar.className='progress-fill';
   bar.style.width=e.value+'%';bar.style.background=e.fill;node.append(bar);
 }else{
   node.textContent=e.label||(e.type==='image'?'Image':'');
   if(e.type==='text')node.style.color=e.fill;else node.style.background=e.fill;
 }
 const handle=document.createElement('span');handle.className='resize-handle';handle.title='Drag to resize';handle.setAttribute('aria-hidden','true');node.append(handle);
 node.addEventListener('click',event=>{event.stopPropagation();select(e.id);});
 node.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();select(e.id);}});
 node.addEventListener('pointerdown',event=>{
   if(event.button!==0)return;
   event.preventDefault();event.stopPropagation();select(e.id);
   const rect=canvas.getBoundingClientRect(),item=active();
   gesture={id:e.id,mode:event.target===handle?'resize':'move',x:event.clientX,y:event.clientY,origin:snapshot(),item:structuredClone(item),scaleX:canvas.offsetWidth/rect.width,scaleY:canvas.offsetHeight/rect.height};
   node.setPointerCapture(event.pointerId);
 });
 node.addEventListener('pointermove',event=>{
   if(!gesture||gesture.id!==e.id||!node.hasPointerCapture(event.pointerId))return;
   const dx=(event.clientX-gesture.x)*gesture.scaleX,dy=(event.clientY-gesture.y)*gesture.scaleY;
   const snap=v=>$('snap').checked?Math.round(v/10)*10:Math.round(v);
   const changes=gesture.mode==='move'?{x:snap(gesture.item.x+dx),y:snap(gesture.item.y+dy)}:{w:snap(gesture.item.w+dx),h:snap(gesture.item.h+dy)};
   doc=updateElement(gesture.origin,e.id,changes);
   const current=active();
   node.style.left=current.x+'px';node.style.top=current.y+'px';
   node.style.width=current.w+'px';node.style.height=current.h+'px';
   if(gesture.mode==='move')findGuides(current);
   syncInspector();
 });
 const end=event=>{
  if(!gesture||gesture.id!==e.id)return;
  const before=gesture.origin;gesture=null;
  canvas.querySelectorAll('.alignment-guide').forEach(el=>el.remove());
  history.current=before;commit(doc,'Component updated');
  if(node.hasPointerCapture(event.pointerId))node.releasePointerCapture(event.pointerId);
 };
 node.addEventListener('pointerup',end);node.addEventListener('pointercancel',end);
 return node;
}
function renderLayers(){
 const list=$('layers');list.replaceChildren();
 for(const item of [...doc.elements].reverse()){
   const b=document.createElement('button');b.type='button';b.className='layer-button';b.dataset.id=item.id;
   b.textContent=item.type.toUpperCase()+' · '+(item.label||item.id).slice(0,28);
   b.addEventListener('click',()=>select(item.id,true));list.append(b);
 }
}
function render(){
 canvas.style.background=doc.background;$('background').value=doc.background;
 $('background-preset').value=BACKGROUNDS.find(x=>x.color===doc.background)?.color||'';
 $('title').value=doc.title;$('count').textContent=doc.elements.length+' components';
 $('undo').disabled=!history.past.length;$('redo').disabled=!history.future.length;
 canvas.replaceChildren();for(const item of doc.elements)canvas.append(buildNode(item));
 renderLayers();select(selected&&active()?selected:null);
}
function add(type,point){
 if(doc.elements.length>=100){tell('Maximum 100 components.');return;}
 let next=addElement(doc,type),id=next.elements.at(-1).id;
 if(point)next=updateElement(next,id,point);
 selected=id;commit(next,'Component added');
}
function addAsset(i){if(doc.elements.length>=100)return;const next=applyLibraryItem(doc,i);selected=next.elements.at(-1).id;commit(next,'Asset added');}
function del(){if(!selected)return;const next=removeElement(doc,selected);selected=null;commit(next,'Component deleted');}
function copy(){const item=active();if(item){clipboard=structuredClone(item);tell('Component copied.');}}
function paste(){
 if(!clipboard||doc.elements.length>=100)return;
 let next=addElement(doc,clipboard.type),id=next.elements.at(-1).id;
 next=updateElement(next,id,{...clipboard,id,x:clipboard.x+20,y:clipboard.y+20});
 selected=id;commit(next,'Component pasted');
}
function loadDocument(next){history=new History(normalizeDocument(next));doc=history.current;selected=null;render();}
function doUndo(redo=false){
 if(redo?history.redo():history.undo()){doc=history.current;selected=null;render();tell(redo?'Redone':'Undone');}
}
function download(name,data,mime){
 const url=URL.createObjectURL(new Blob([data],{type:mime}));
 const a=document.createElement('a');a.href=url;a.download=(doc.title.trim().replace(/[^a-z0-9_-]+/gi,'-').replace(/^-+|-+$/g,'').slice(0,50)||'game-ui')+name;
 document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 tell('Exported '+name);
}
document.querySelectorAll('#palette [data-type]').forEach(button=>{
 button.addEventListener('click',()=>add(button.dataset.type));
 button.addEventListener('dragstart',event=>{event.dataTransfer.setData('text/plain','type:'+button.dataset.type);});
});
LIBRARY.forEach((asset,i)=>{
 const b=document.createElement('button');b.type='button';b.className='library-item';
 b.textContent=asset.name;b.title='Add '+asset.name;b.draggable=true;
 b.addEventListener('click',()=>addAsset(i));
 b.addEventListener('dragstart',ev=>ev.dataTransfer.setData('text/plain','asset:'+i));
 $('library').append(b);
});
canvas.addEventListener('dragover',ev=>{ev.preventDefault();ev.dataTransfer.dropEffect='copy';});
canvas.addEventListener('drop',ev=>{
 ev.preventDefault();const data=ev.dataTransfer.getData('text/plain'),rect=canvas.getBoundingClientRect();
 const point={x:(ev.clientX-rect.left)*canvas.offsetWidth/rect.width,y:(ev.clientY-rect.top)*canvas.offsetHeight/rect.height};
 if(data.startsWith('type:'))add(data.slice(5),point);
 else if(data.startsWith('asset:')){
  const i=Number(data.slice(6));if(!Number.isInteger(i)||i<0||i>=LIBRARY.length)return;
  const next=applyLibraryItem(doc,i),id=next.elements.at(-1)?.id;
  if(id){selected=id;commit(updateElement(next,id,point),'Asset dropped');}
 }
});
canvas.addEventListener('click',ev=>{if(ev.target===canvas)select(null);});
for(const field of ['label','x','y','w','h','fill','radius','fontSize','value']){
 const input=$('prop-'+field);
 input.addEventListener('focus',()=>{inspectorBefore=snapshot();});
 input.addEventListener('input',ev=>{
  if(!active())return;
  const value=numeric.has(field)?Number(ev.target.value):ev.target.value;
  if(numeric.has(field)&&!Number.isFinite(value))return;
  doc=updateElement(doc,selected,{[field]:value});
  const item=active(),node=[...canvas.querySelectorAll('.canvas-item')].find(x=>x.dataset.id===selected);
  if(node){
   Object.assign(node.style,{left:item.x+'px',top:item.y+'px',width:item.w+'px',height:item.h+'px',borderRadius:item.radius+'px',fontSize:item.fontSize+'px'});
   if(item.type==='progress'){node.querySelector('.progress-fill').style.width=item.value+'%';node.querySelector('.progress-fill').style.background=item.fill;}
   else{node.firstChild.textContent=item.label;node.style[item.type==='text'?'color':'background']=item.fill;}
  }
 });
 input.addEventListener('change',()=>{
  if(!inspectorBefore)return;
  const current=snapshot();history.current=inspectorBefore;inspectorBefore=null;commit(current,'Property updated');
 });
 input.addEventListener('blur',()=>{
  if(!inspectorBefore)return;
  const current=snapshot();history.current=inspectorBefore;inspectorBefore=null;commit(current,'Property updated');
 });
}
$('preset').addEventListener('change',ev=>{
 const name=ev.target.value;const next=['blank','menu','hud'].includes(name)?makePreset(name):screenPreset(name);
 selected=null;commit(next,'Preset applied');
});
$('background').addEventListener('change',ev=>commit({...doc,background:ev.target.value},'Background updated'));
$('background-preset').addEventListener('change',ev=>{if(ev.target.value)commit({...doc,background:ev.target.value},'Background preset applied');});
$('title').addEventListener('change',ev=>commit({...doc,title:ev.target.value.slice(0,100)},'Title updated'));
$('clear').addEventListener('click',()=>{selected=null;commit({...doc,elements:[]},'Canvas cleared');});
$('duplicate').addEventListener('click',()=>{if(!selected)return;const next=duplicate(doc,selected);selected=next.elements.at(-1).id;commit(next,'Duplicated');});
$('delete').addEventListener('click',del);
$('copy').addEventListener('click',copy);$('paste').addEventListener('click',paste);
$('layer-up').addEventListener('click',()=>commit(reorder(doc,selected,1),'Layer moved'));
$('layer-down').addEventListener('click',()=>commit(reorder(doc,selected,-1),'Layer moved'));
$('undo').addEventListener('click',()=>doUndo(false));$('redo').addEventListener('click',()=>doUndo(true));
$('save').addEventListener('click',()=>{try{localStorage.setItem('gdt.visual-builder.v1',exportJSON(doc));tell('Saved in this browser.');}catch{tell('Local storage unavailable. Export JSON instead.');}});
$('load').addEventListener('click',()=>{try{const data=localStorage.getItem('gdt.visual-builder.v1');if(data){loadDocument(importJSON(data));tell('Loaded local layout.');}else tell('No saved layout found.');}catch(e){tell('Load error: '+e.message);}});
$('download').addEventListener('click',()=>download('.json',exportJSON(doc),'application/json'));
$('export-web').addEventListener('click',()=>download('.html',exportHTML(doc),'text/html'));
$('export-godot').addEventListener('click',()=>download('.tscn',exportGodot(doc),'text/plain'));
$('import').addEventListener('change',async ev=>{const file=ev.target.files?.[0];if(!file)return;try{if(file.size>100000)throw Error('File too large');loadDocument(importJSON(await file.text()));tell('Imported JSON layout.');}catch(e){tell('Import failed: '+e.message);}ev.target.value='';});
document.addEventListener('keydown',ev=>{
 if(editableTarget(ev.target)||ev.altKey)return;
 const key=ev.key.toLowerCase(),mod=ev.ctrlKey||ev.metaKey;
 if(mod&&key==='z'){ev.preventDefault();doUndo(ev.shiftKey);}
 else if(mod&&key==='y'){ev.preventDefault();doUndo(true);}
 else if(mod&&key==='c'){ev.preventDefault();copy();}
 else if(mod&&key==='v'){ev.preventDefault();paste();}
 else if((ev.key==='Delete'||ev.key==='Backspace')&&selected){ev.preventDefault();del();}
 else if(selected&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(ev.key)){
  ev.preventDefault();const amount=ev.shiftKey?10:1;
  const [dx,dy]=ev.key==='ArrowLeft'?[-amount,0]:ev.key==='ArrowRight'?[amount,0]:ev.key==='ArrowUp'?[0,-amount]:[0,amount];
  commit(moveElement(doc,selected,dx,dy),'Moved');
 }
});
render();fit();
if(typeof ResizeObserver!=='undefined')new ResizeObserver(fit).observe(scroll);
window.addEventListener('resize',fit);
