import {
  createMap, createDemoMap, parseMap, serializeMap, normalizeMap,
  paintCells, paintCollision, floodFill, lineCells, rectangleCells, resizeMap,
  addLayer, updateLayer, moveLayer, removeLayer, addTileset, addObject, updateObject, removeObject,
  inBounds, cellIndex
} from './model.js';
import {createStarterAtlas, STARTER_NAMES} from './starter-tiles.js';
import {portableMap, buildGodotZip, slugMap} from './export.js';

const $ = id => document.getElementById(id);
const canvas = $('map-canvas'), viewport = $('map-viewport');
const ctx = canvas.getContext('2d');
const STORAGE = 'gdt.topdown-map.manual.v1', AUTOSAVE = 'gdt.topdown-map.autosave.v1';
const TOOLS = new Set(['brush','erase','fill','line','rectangle','eyedropper','block','unblock','object','pan']);
let doc = createDemoMap();
let activeLayer = 'ground', activeSet = 'starter', activeTile = 2, tool = 'brush';
let selectedObject = null, hover = null, gesture = null, spaceHeld = false;
let zoom = 1, offsetX = 0, offsetY = 0;
let undoStack = [], redoStack = [], saveTimer = null, dirty = false;
let imageCache = new Map();
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const status = message => {$('status').textContent = message;};
const safeError = error => status(error?.message || 'Could not complete that action.');
function getStarter() {return getImage(doc.tilesets.find(s => s.src === 'builtin') || {id:'starter',src:'builtin'});}
function getImage(set) {
  const cache = imageCache.get(set.id);
  if (cache && cache.src === set.src && cache.tileSize === doc.tileSize) return cache.image;
  if (set.src === 'builtin') {
    const image = createStarterAtlas(doc.tileSize);
    imageCache.set(set.id,{src:set.src,tileSize:doc.tileSize,image});
    return image;
  }
  const image = new Image();
  image.onload = () => {render();if ($('tileset-select').value === set.id) drawPalette();};
  image.onerror = () => status('A tileset could not be decoded. Reimport its PNG or JPEG.');
  imageCache.set(set.id,{src:set.src,tileSize:doc.tileSize,image});
  image.src = set.src;
  return image;
}
function tileSource(tile) {
  if (!tile) return null;
  const set = doc.tilesets.find(t => t.id === tile.set);
  if (!set) return null;
  const img = getImage(set), cols = set.width / doc.tileSize;
  if (!img || (img instanceof HTMLImageElement && !img.complete)) return null;
  return {img, sx:(tile.index % cols)*doc.tileSize, sy:Math.floor(tile.index / cols)*doc.tileSize};
}
function tileAt(layer, x, y) {return inBounds(doc,x,y) ? layer.tiles[cellIndex(doc,x,y)] : null;}
function drawTile(context, tile, x, y, tileSize = doc.tileSize) {
  const source = tileSource(tile);
  if (source) context.drawImage(source.img,source.sx,source.sy,doc.tileSize,doc.tileSize,x*tileSize,y*tileSize,tileSize,tileSize);
}
function drawMap(context, showEditor = false) {
  const ts = doc.tileSize, maxX = doc.width, maxY = doc.height;
  const minX = showEditor ? clamp(Math.floor(-offsetX / zoom / ts),0,maxX) : 0;
  const minY = showEditor ? clamp(Math.floor(-offsetY / zoom / ts),0,maxY) : 0;
  const endX = showEditor ? clamp(Math.ceil((viewport.clientWidth-offsetX)/zoom/ts)+1,0,maxX) : maxX;
  const endY = showEditor ? clamp(Math.ceil((viewport.clientHeight-offsetY)/zoom/ts)+1,0,maxY) : maxY;
  context.fillStyle = '#24462c';
  context.fillRect(0,0,maxX*ts,maxY*ts);
  for(const layer of doc.layers) {
    if(!layer.visible || layer.opacity <= 0) continue;
    context.save();
    context.globalAlpha = layer.opacity;
    for(let y=minY;y<endY;y++) for(let x=minX;x<endX;x++) {
      const tile=tileAt(layer,x,y);
      if(tile) drawTile(context,tile,x,y);
    }
    context.restore();
  }
  if(!showEditor) return;
  if($('show-collision').checked) {
    context.fillStyle='rgba(249,86,93,.31)';
    for(let y=minY;y<endY;y++) for(let x=minX;x<endX;x++)
      if(doc.collision[cellIndex(doc,x,y)]) context.fillRect(x*ts,y*ts,ts,ts);
  }
  if($('show-grid').checked) {
    context.beginPath();
    for(let x=minX;x<=endX;x++){context.moveTo(x*ts+.5,minY*ts);context.lineTo(x*ts+.5,endY*ts);}
    for(let y=minY;y<=endY;y++){context.moveTo(minX*ts,y*ts+.5);context.lineTo(endX*ts,y*ts+.5);}
    context.strokeStyle='rgba(226,237,255,.22)';context.lineWidth=1/zoom;context.stroke();
  }
  if($('show-objects').checked) for(const o of doc.objects) {
    const cx=(o.x+.5)*ts,cy=(o.y+.5)*ts, radius=Math.max(5,ts*.28);
    context.fillStyle=o.id===selectedObject?'#ffb070':'#5ce1ce';
    context.strokeStyle='#122533';context.lineWidth=2/zoom;
    context.beginPath();context.arc(cx,cy,radius,0,Math.PI*2);context.fill();context.stroke();
    context.font=Math.max(9,ts*.32)+'px system-ui,sans-serif';context.textAlign='center';context.textBaseline='middle';
    context.fillStyle='#14202c';
    context.fillText((o.type==='player_spawn'?'P':o.type==='enemy_spawn'?'E':o.type==='exit'?'X':o.type==='npc'?'N':'●'),cx,cy);
  }
  let preview=[];
  if(gesture?.mode==='line' || gesture?.mode==='rectangle') {
    preview=gesture.mode==='line' ? lineCells(gesture.start.x,gesture.start.y,gesture.last.x,gesture.last.y) : rectangleCells(gesture.start.x,gesture.start.y,gesture.last.x,gesture.last.y);
  } else if(hover && !gesture && ['brush','erase','block','unblock','object'].includes(tool)) preview=[hover];
  for(const cell of preview) {
    if(!inBounds(doc,cell.x,cell.y)) continue;
    const x=cell.x*ts, y=cell.y*ts;
    context.fillStyle=tool==='block'?'#ff5d6580':tool==='unblock'?'#56e7c65e':'#ffc17d51';
    context.fillRect(x,y,ts,ts);
    context.strokeStyle='#ffd0a3';context.lineWidth=2/zoom;context.strokeRect(x+1/zoom,y+1/zoom,ts-2/zoom,ts-2/zoom);
    if(['brush','line','rectangle'].includes(tool)) {
      context.save();context.globalAlpha=.8;drawTile(context,{set:activeSet,index:activeTile},cell.x,cell.y);context.restore();
    }
  }
}
function render() {
  const dpr=clamp(window.devicePixelRatio||1,1,2);
  const width=Math.max(1,Math.floor(viewport.clientWidth)),height=Math.max(1,Math.floor(viewport.clientHeight));
  if(canvas.width!==Math.round(width*dpr)||canvas.height!==Math.round(height*dpr)) {
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
  }
  ctx.imageSmoothingEnabled=false;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.fillStyle='#090f19';ctx.fillRect(0,0,width,height);
  ctx.save();
  ctx.setTransform(zoom*dpr,0,0,zoom*dpr,offsetX*dpr,offsetY*dpr);
  ctx.beginPath();ctx.rect(0,0,doc.width*doc.tileSize,doc.height*doc.tileSize);ctx.clip();
  drawMap(ctx,true);
  ctx.restore();
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.strokeStyle='#e7ab6c';ctx.lineWidth=1;
  ctx.strokeRect(offsetX+.5,offsetY+.5,doc.width*doc.tileSize*zoom,doc.height*doc.tileSize*zoom);
  $('map-size-label').textContent=doc.width+'×'+doc.height+' tiles · '+doc.tileSize+'px';
  $('zoom-label').textContent=Math.round(zoom*100)+'%';
  $('zoom').value=Math.round(zoom*100);
}
function fitMap() {
  const w=doc.width*doc.tileSize,h=doc.height*doc.tileSize;
  zoom=clamp(Math.min((viewport.clientWidth-42)/w,(viewport.clientHeight-42)/h),.25,3);
  offsetX=(viewport.clientWidth-w*zoom)/2;
  offsetY=(viewport.clientHeight-h*zoom)/2;
  render();
}
function setZoom(next,px=viewport.clientWidth/2,py=viewport.clientHeight/2) {
  next=clamp(next,.25,3);
  const worldX=(px-offsetX)/zoom,worldY=(py-offsetY)/zoom;
  zoom=next;offsetX=px-worldX*zoom;offsetY=py-worldY*zoom;render();
}
function pointerPos(event) {
  const box=canvas.getBoundingClientRect();
  const sx=event.clientX-box.left,sy=event.clientY-box.top;
  return {sx,sy,x:Math.floor((sx-offsetX)/zoom/doc.tileSize),y:Math.floor((sy-offsetY)/zoom/doc.tileSize)};
}
function updateCursor(cell) {
  hover=inBounds(doc,cell.x,cell.y)?{x:cell.x,y:cell.y}:null;
  $('cursor-position').textContent=hover?'Cell '+hover.x+', '+hover.y:'Outside map';
  render();
}
function scheduleAutosave() {
  dirty=true;
  clearTimeout(saveTimer);
  saveTimer=setTimeout(()=>{
    try {localStorage.setItem(AUTOSAVE,serializeMap(doc));}
    catch {status('Autosave unavailable (browser storage full). Export map JSON to avoid losing changes.');}
  },700);
}
function addHistory(before, message) {
  if(before===doc) return;
  undoStack.push(before);
  if(undoStack.length>35) undoStack.shift();
  redoStack=[];
  scheduleAutosave();
  refreshSidebars();
  render();
  if(message) status(message);
}
function updateDoc(edit,message) {
  const before=doc;
  try {doc=edit(doc);addHistory(before,message);}
  catch(error){doc=before;safeError(error);}
}
function undo() {
  if(!undoStack.length) {status('Nothing to undo.');return;}
  redoStack.push(doc);doc=undoStack.pop();afterHistory('Undid last edit.');
}
function redo() {
  if(!redoStack.length) {status('Nothing to redo.');return;}
  undoStack.push(doc);doc=redoStack.pop();afterHistory('Redid edit.');
}
function afterHistory(message) {
  if(!doc.layers.some(l=>l.id===activeLayer))activeLayer=doc.layers[0].id;
  if(!doc.tilesets.some(t=>t.id===activeSet))activeSet=doc.tilesets[0].id;
  if(!doc.objects.some(o=>o.id===selectedObject))selectedObject=null;
  imageCache.clear();scheduleAutosave();refreshSidebars();render();status(message);
}
function setTool(next) {
  if(!TOOLS.has(next))return;
  tool=next;
  document.querySelectorAll('[data-tool]').forEach(btn=>{
    const active=btn.dataset.tool===next;
    btn.classList.toggle('active',active);btn.setAttribute('aria-pressed',String(active));
  });
  status(next==='object'?'Click a cell to add a marker or select an existing one.':next==='block'?'Paint blocked cells (collision overlay is red).':next==='unblock'?'Paint walkable cells.':'Tool: '+next+'.');
  render();
}
function updatePaletteSelection() {
  document.querySelectorAll('.tile-choice').forEach((node,i)=>{
    node.classList.toggle('selected',i===activeTile);node.setAttribute('aria-pressed',String(i===activeTile));
  });
}
function drawPalette() {
  const container=$('tile-palette');
  container.replaceChildren();
  const set=doc.tilesets.find(s=>s.id===activeSet);
  if(!set)return;
  const img=getImage(set),count=(set.width/doc.tileSize)*(set.height/doc.tileSize);
  if(activeTile>=count)activeTile=0;
  $('tile-count').textContent=count+' tiles';
  for(let index=0;index<count;index++) {
    const button=document.createElement('button');button.type='button';button.className='tile-choice';button.title=(set.id==='starter'?STARTER_NAMES[index]:set.name+' #'+(index+1))||('Tile '+index);
    button.setAttribute('aria-label',button.title);
    button.setAttribute('aria-pressed',String(index===activeTile));
    button.classList.toggle('selected',index===activeTile);
    const preview=document.createElement('canvas');preview.width=doc.tileSize;preview.height=doc.tileSize;
    const pctx=preview.getContext('2d');pctx.imageSmoothingEnabled=false;
    if(img && (!(img instanceof HTMLImageElement)||img.complete && img.naturalWidth)) {
      pctx.drawImage(img,(index%(set.width/doc.tileSize))*doc.tileSize,Math.floor(index/(set.width/doc.tileSize))*doc.tileSize,doc.tileSize,doc.tileSize,0,0,doc.tileSize,doc.tileSize);
    }
    button.append(preview);
    button.addEventListener('click',()=>{activeTile=index;updatePaletteSelection();if(tool==='erase'||tool==='fill'||tool==='object'||tool==='block'||tool==='unblock')setTool('brush');render();});
    container.append(button);
  }
}
function refreshLayers() {
  const list=$('layers-list');list.replaceChildren();
  for(const layer of doc.layers) {
    const row=document.createElement('div');row.className='layer-row'+(layer.id===activeLayer?' selected':'');
    const button=document.createElement('button');button.type='button';button.className='layer-select';button.textContent=layer.name;
    button.setAttribute('aria-pressed',String(layer.id===activeLayer));
    button.addEventListener('click',()=>{activeLayer=layer.id;refreshLayers();render();});
    const visible=document.createElement('button');visible.type='button';visible.className='layer-icon';visible.textContent=layer.visible?'◉':'○';visible.title='Toggle visibility';visible.setAttribute('aria-pressed',String(layer.visible));
    visible.addEventListener('click',()=>updateDoc(d=>updateLayer(d,layer.id,{visible:!layer.visible}),'Layer visibility updated.'));
    const locked=document.createElement('button');locked.type='button';locked.className='layer-icon';locked.textContent=layer.locked?'▣':'◇';locked.title='Toggle editing lock';locked.setAttribute('aria-pressed',String(layer.locked));
    locked.addEventListener('click',()=>updateDoc(d=>updateLayer(d,layer.id,{locked:!layer.locked}),'Layer lock updated.'));
    row.append(visible,button,locked);list.append(row);
  }
  const layer=doc.layers.find(l=>l.id===activeLayer);
  $('layer-name').value=layer?.name||'';
  $('layer-opacity').value=Math.round((layer?.opacity??1)*100);
  $('opacity-label').textContent=$('layer-opacity').value+'%';
}
function refreshObjects() {
  const list=$('objects-list');list.replaceChildren();
  if(!doc.objects.length) {const hint=document.createElement('p');hint.className='hint';hint.textContent='No markers yet. Choose Marker and click a tile.';list.append(hint);}
  for(const marker of doc.objects) {
    const button=document.createElement('button');button.type='button';button.className='object-row'+(marker.id===selectedObject?' selected':'');
    button.textContent=marker.name+' · '+marker.type+' ('+marker.x+','+marker.y+')';
    button.addEventListener('click',()=>{selectedObject=marker.id;setTool('object');refreshObjects();render();});
    list.append(button);
  }
  const marker=doc.objects.find(o=>o.id===selectedObject);
  $('object-properties').hidden=!marker;
  if(marker){
    $('object-name').value=marker.name;
    $('object-x').value=marker.x;$('object-y').value=marker.y;
    $('object-x').max=doc.width-1;$('object-y').max=doc.height-1;
    $('object-json').value=JSON.stringify(marker.properties,null,2);
    $('object-type').value=Array.from($('object-type').options).some(o=>o.value===marker.type)?marker.type:'custom';
  }
}
function refreshSidebars() {
  $('map-name').value=doc.name;$('map-width').value=doc.width;$('map-height').value=doc.height;
  $('tile-size-label').textContent=doc.tileSize+' px';
  const selector=$('tileset-select');selector.replaceChildren();
  for(const set of doc.tilesets){const option=document.createElement('option');option.value=set.id;option.textContent=set.name;selector.append(option);}
  selector.value=activeSet;
  refreshLayers();refreshObjects();drawPalette();
}
function startDocument(next,message) {
  clearTimeout(saveTimer);
  doc=normalizeMap(next);undoStack=[];redoStack=[];gesture=null;hover=null;selectedObject=null;
  activeLayer=doc.layers[0].id;activeSet=doc.tilesets[0].id;activeTile=0;imageCache.clear();
  dirty=false;refreshSidebars();fitMap();status(message);
  scheduleAutosave();
}
function paintAction(positions) {
  if(tool==='brush'||tool==='erase') doc=paintCells(doc,activeLayer,positions,tool==='erase'?null:{set:activeSet,index:activeTile});
  else if(tool==='block'||tool==='unblock') doc=paintCollision(doc,positions,tool==='block');
}
function selectAt(x,y) {
  if(!inBounds(doc,x,y))return;
  let layer=doc.layers.find(l=>l.id===activeLayer),tile=layer?tileAt(layer,x,y):null;
  if(!tile)for(let i=doc.layers.length-1;i>=0;i--){const l=doc.layers[i];const found=l.visible?tileAt(l,x,y):null;if(found){layer=l;tile=found;break;}}
  if(!tile) {status('No tile at this cell.');return;}
  activeLayer=layer.id;activeSet=tile.set;activeTile=tile.index;refreshSidebars();setTool('brush');status('Picked tile from '+layer.name+'.');
}
function objectAt(x,y) {
  return doc.objects.findLast(o=>o.x===x&&o.y===y);
}
canvas.addEventListener('contextmenu',event=>event.preventDefault());
canvas.addEventListener('pointerdown',event=>{
  if(event.button!==0 && event.button!==1 && event.button!==2)return;
  event.preventDefault();canvas.focus({preventScroll:true});
  const p=pointerPos(event);
  if(event.button===2){selectAt(p.x,p.y);return;}
  canvas.setPointerCapture(event.pointerId);
  if(event.button===1 || spaceHeld || tool==='pan') {
    gesture={mode:'pan',sx:p.sx,sy:p.sy,x:offsetX,y:offsetY};return;
  }
  if(!inBounds(doc,p.x,p.y))return;
  const start={x:p.x,y:p.y};
  gesture={mode:tool,before:doc,start,last:start};
  if(['brush','erase','block','unblock'].includes(tool)) {
    if(['brush','erase'].includes(tool)&&doc.layers.find(l=>l.id===activeLayer)?.locked){status('Unlock this layer before painting.');gesture=null;return;}
    paintAction([start]);
  } else if(tool==='fill') {
    doc=floodFill(doc,activeLayer,p.x,p.y,{set:activeSet,index:activeTile});
    const before=gesture.before;gesture=null;addHistory(before,'Flood fill complete.');
  } else if(tool==='eyedropper') {
    gesture=null;selectAt(p.x,p.y);return;
  } else if(tool==='object') {
    let found=objectAt(p.x,p.y);
    if(!found) {
      try {doc=addObject(doc,{x:p.x,y:p.y,type:$('object-type').value});found=doc.objects.at(-1);}
      catch(error){gesture=null;safeError(error);return;}
    }
    selectedObject=found.id;gesture.mode='object-drag';refreshObjects();
  }
  render();
});
canvas.addEventListener('pointermove',event=>{
  const p=pointerPos(event);
  if(!gesture){updateCursor(p);return;}
  if(gesture.mode==='pan') {offsetX=gesture.x+p.sx-gesture.sx;offsetY=gesture.y+p.sy-gesture.sy;render();return;}
  if(!inBounds(doc,p.x,p.y)) {hover=null;render();return;}
  const next={x:p.x,y:p.y};
  if(['brush','erase','block','unblock'].includes(gesture.mode) && (gesture.last.x!==next.x||gesture.last.y!==next.y)) {
    paintAction(lineCells(gesture.last.x,gesture.last.y,next.x,next.y));
  } else if(gesture.mode==='object-drag') {
    const marker=doc.objects.find(o=>o.id===selectedObject);
    if(marker && (marker.x!==next.x||marker.y!==next.y))doc=updateObject(doc,marker.id,{x:next.x,y:next.y});
  }
  gesture.last=next;hover=next;render();
});
function finishPointer(event) {
  if(!gesture)return;
  const active=gesture;gesture=null;
  if(active.mode==='line'||active.mode==='rectangle'){
    const cells=active.mode==='line'?lineCells(active.start.x,active.start.y,active.last.x,active.last.y):rectangleCells(active.start.x,active.start.y,active.last.x,active.last.y);
    if(!doc.layers.find(l=>l.id===activeLayer)?.locked)doc=paintCells(doc,activeLayer,cells,{set:activeSet,index:activeTile});
  }
  if(active.mode!=='pan')addHistory(active.before,'Map updated.');
  else render();
  if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);
}
canvas.addEventListener('pointerup',finishPointer);
canvas.addEventListener('pointercancel',event=>{
  if(gesture&&gesture.mode!=='pan'&&gesture.before){doc=gesture.before;refreshSidebars();}
  gesture=null;render();
  if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);
});
viewport.addEventListener('wheel',event=>{
  event.preventDefault();const box=canvas.getBoundingClientRect();
  setZoom(zoom*(event.deltaY<0?1.12:.89),event.clientX-box.left,event.clientY-box.top);
},{passive:false});
window.addEventListener('keydown',event=>{
  const target=event.target;
  if(target instanceof HTMLElement && (['INPUT','TEXTAREA','SELECT'].includes(target.tagName)||target.isContentEditable))return;
  if(event.code==='Space'){event.preventDefault();spaceHeld=true;return;}
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){event.preventDefault();event.shiftKey?redo():undo();return;}
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='y'){event.preventDefault();redo();return;}
  if(event.ctrlKey||event.metaKey||event.altKey)return;
  if(event.key==='Delete'&&selectedObject){event.preventDefault();deleteSelectedObject();return;}
  const shortcuts={b:'brush',e:'erase',f:'fill',l:'line',r:'rectangle',i:'eyedropper',c:'block',x:'unblock',o:'object',h:'pan'};
  const found=shortcuts[event.key.toLowerCase()];
  if(found){event.preventDefault();setTool(found);}
});
window.addEventListener('keyup',event=>{if(event.code==='Space')spaceHeld=false;});
window.addEventListener('blur',()=>{spaceHeld=false;});
document.querySelectorAll('[data-tool]').forEach(b=>b.addEventListener('click',()=>setTool(b.dataset.tool)));
$('undo-map').addEventListener('click',undo);$('redo-map').addEventListener('click',redo);
$('fit-map').addEventListener('click',fitMap);
$('zoom').addEventListener('input',e=>setZoom(Number(e.target.value)/100));
for(const field of ['show-grid','show-collision','show-objects'])$(field).addEventListener('change',render);
$('tileset-select').addEventListener('change',e=>{activeSet=e.target.value;activeTile=0;drawPalette();render();});
$('add-layer').addEventListener('click',()=>updateDoc(d=>{const next=addLayer(d);activeLayer=next.layers.at(-1).id;return next;},'Added a layer.'));
$('remove-layer').addEventListener('click',()=>{
  const layer=doc.layers.find(l=>l.id===activeLayer);
  if(doc.layers.length===1){status('At least one layer is required.');return;}
  if(layer.tiles.some(Boolean)&&!window.confirm('Delete '+layer.name+' and all its tiles?'))return;
  updateDoc(d=>{const next=removeLayer(d,activeLayer);activeLayer=next.layers.at(-1).id;return next;},'Layer removed.');
});
$('layer-up').addEventListener('click',()=>updateDoc(d=>moveLayer(d,activeLayer,1),'Layer order updated.'));
$('layer-down').addEventListener('click',()=>updateDoc(d=>moveLayer(d,activeLayer,-1),'Layer order updated.'));
$('layer-name').addEventListener('change',e=>updateDoc(d=>updateLayer(d,activeLayer,{name:e.target.value}),'Layer renamed.'));
$('layer-opacity').addEventListener('change',e=>updateDoc(d=>updateLayer(d,activeLayer,{opacity:Number(e.target.value)/100}),'Layer opacity updated.'));
$('layer-opacity').addEventListener('input',e=>{$('opacity-label').textContent=e.target.value+'%';});
$('map-name').addEventListener('change',e=>updateDoc(d=>normalizeMap({...d,name:e.target.value}),'Map renamed.'));
$('resize-map').addEventListener('click',()=>{
  const width=Number($('map-width').value),height=Number($('map-height').value);
  if((width<doc.width||height<doc.height) && !window.confirm('Shrinking the map will discard out-of-bounds tiles and markers. Continue?'))return;
  updateDoc(d=>resizeMap(d,width,height),'Map resized.');fitMap();
});
function deleteSelectedObject() {
  if(!selectedObject)return;
  updateDoc(d=>removeObject(d,selectedObject),'Marker removed.');selectedObject=null;refreshObjects();render();
}
$('delete-object').addEventListener('click',deleteSelectedObject);
$('apply-object').addEventListener('click',()=>{
  if(!selectedObject)return;
  try {
    const props=JSON.parse($('object-json').value);
    const patch={name:$('object-name').value,x:Number($('object-x').value),y:Number($('object-y').value),properties:props};
    updateDoc(d=>updateObject(d,selectedObject,patch),'Marker updated.');
  } catch(error){safeError(error);}
});
$('new-map').addEventListener('click',()=>$('new-dialog').showModal());
$('cancel-new').addEventListener('click',()=>$('new-dialog').close());
$('confirm-new').addEventListener('click',()=>{
  try {
    const next=createMap({name:$('new-name').value,width:Number($('new-width').value),height:Number($('new-height').value),tileSize:Number($('new-tile-size').value)});
    startDocument(next,'New blank map created.');$('new-dialog').close();
  } catch(error){safeError(error);}
});
function download(data,name,type) {
  const blob=data instanceof Blob?data:new Blob([data],{type});
  const url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download=name;document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function portable() {
  // The starter atlas is converted to PNG for use outside this editor.
  return portableMap(doc,createStarterAtlas(doc.tileSize).toDataURL('image/png'));
}
$('save-map').addEventListener('click',()=>{
  try {localStorage.setItem(STORAGE,serializeMap(doc));dirty=false;status('Saved in this browser. Export Map JSON for a portable backup.');}
  catch{status('Browser storage is full/unavailable. Export Map JSON instead.');}
});
$('load-map').addEventListener('click',()=>{
  try {
    const data=localStorage.getItem(STORAGE);
    if(!data){status('No manually saved map found.');return;}
    if(dirty&&!window.confirm('Load saved map and replace current unsaved changes?'))return;
    startDocument(parseMap(data),'Loaded your saved map.');
  }catch(error){safeError(error);}
});
$('import-map').addEventListener('change',async event=>{
  const file=event.target.files?.[0];if(!file)return;
  try {
    if(file.size>8_000_000)throw new RangeError('Map exceeds 8 MB');
    startDocument(parseMap(await file.text()),'Map imported.');
  }catch(error){safeError(error);}
  event.target.value='';
});
$('import-tileset').addEventListener('change',async event=>{
  const file=event.target.files?.[0];if(!file)return;
  try {
    if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw new TypeError('Use PNG, JPG or WebP');
    if(file.size>1_300_000)throw new RangeError('Tileset images must be under 1.3 MB. Optimize the image first.');
    const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('Could not read image'));reader.readAsDataURL(file);});
    const image=new Image();image.src=data;await image.decode();
    const width=image.naturalWidth,height=image.naturalHeight,ts=doc.tileSize;
    if(!width||!height||width>4096||height>4096||width%ts||height%ts||(width/ts)*(height/ts)>512)throw new RangeError('Image must be divisible by '+ts+' px, at most 4096 px per side and 512 tiles.');
    updateDoc(d=>{const next=addTileset(d,{name:file.name.slice(0,80),src:data,width,height});activeSet=next.tilesets.at(-1).id;activeTile=0;return next;},'Imported tileset '+file.name+'.');
  }catch(error){safeError(error);}
  event.target.value='';
});
$('export-json').addEventListener('click',()=>{
  try {download(serializeMap(portable()),slugMap(doc.name)+'.map.json','application/json');status('Portable map JSON downloaded.');}
  catch(error){safeError(error);}
});
$('export-png').addEventListener('click',()=>{
  try {
    const width=doc.width*doc.tileSize,height=doc.height*doc.tileSize;
    if(width*height>20_000_000)throw new RangeError('Preview exceeds 20 megapixels. Use a smaller map or export JSON.');
    const output=document.createElement('canvas');output.width=width;output.height=height;
    const context=output.getContext('2d');context.imageSmoothingEnabled=false;
    drawMap(context,false);
    output.toBlob(blob=>{if(!blob){status('PNG encoding failed.');return;}download(blob,slugMap(doc.name)+'.png','image/png');status('PNG preview downloaded.');},'image/png');
  }catch(error){safeError(error);}
});
$('export-godot').addEventListener('click',async()=>{
  const button=$('export-godot');button.disabled=true;
  try {
    const response=await fetch('../../godot/map-kit/map_loader.gd');
    if(!response.ok)throw new Error('Could not load Godot runtime file; serve the toolkit from a web server.');
    const adapter=await response.text();
    const result=buildGodotZip(doc,createStarterAtlas(doc.tileSize).toDataURL('image/png'),adapter);
    download(result.bytes,slugMap(doc.name)+'-godot4.zip','application/zip');
    status('Godot ZIP ready. Follow CODEX_IMPORT.md in the archive.');
  }catch(error){safeError(error);}
  finally{button.disabled=false;}
});
const observer=new ResizeObserver(()=>render());observer.observe(viewport);
window.addEventListener('resize',render);
try {
  const stored=localStorage.getItem(AUTOSAVE);
  if(stored){doc=parseMap(stored);status('Recovered browser autosave.');}
}catch{status('Could not restore autosave; loaded example map.');}
activeLayer=doc.layers[0].id;activeSet=doc.tilesets[0].id;
refreshSidebars();requestAnimationFrame(fitMap);
