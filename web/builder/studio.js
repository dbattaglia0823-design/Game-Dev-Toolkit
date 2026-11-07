import { normalizeDocument, normalizeElement } from './model.js';
/** Undo history is explicit; UI code commits only completed edits. */
export class History {
  constructor(initial, limit=60) { this.past=[]; this.future=[]; this.current=normalizeDocument(initial); this.limit=limit; }
  commit(next) {
    const clean=normalizeDocument(next);
    if (JSON.stringify(clean)===JSON.stringify(this.current)) return false;
    this.past.push(structuredClone(this.current));
    if(this.past.length>this.limit)this.past.shift();
    this.current=clean;this.future=[];return true;
  }
  undo(){if(!this.past.length)return false;this.future.push(this.current);this.current=this.past.pop();return true;}
  redo(){if(!this.future.length)return false;this.past.push(this.current);this.current=this.future.pop();return true;}
}
export const LIBRARY = Object.freeze([
 {name:'Glass panel',type:'panel',w:310,h:195,fill:'#233044',radius:24},
 {name:'Dark panel',type:'panel',w:300,h:175,fill:'#111827',radius:12},
 {name:'Primary button',type:'button',w:215,h:56,label:'CONTINUE',fill:'#fb8c35',radius:14},
 {name:'Secondary button',type:'button',w:215,h:56,label:'BACK',fill:'#36445a',radius:14},
 {name:'Title',type:'text',w:360,h:65,label:'GAME TITLE',fill:'#f4f6fc',fontSize:42},
 {name:'Subtitle',type:'text',w:300,h:36,label:'Choose an option',fill:'#a5b5c9',fontSize:21},
 {name:'Navigation bar',type:'panel',w:690,h:64,fill:'#202f42',radius:20},
 {name:'Icon — star',type:'text',w:64,h:64,label:'★',fill:'#ffcf6b',fontSize:44},
 {name:'Icon — settings',type:'text',w:64,h:64,label:'⚙',fill:'#a5c8ef',fontSize:44},
 {name:'Icon — home',type:'text',w:64,h:64,label:'⌂',fill:'#a5c8ef',fontSize:44},
 {name:'Health bar',type:'progress',w:290,h:20,value:80,fill:'#4cce91',radius:10},
 {name:'Artwork placeholder',type:'image',w:235,h:170,label:'Artwork',fill:'#3c5269',radius:16}
]);
export const BACKGROUNDS = Object.freeze([
 {name:'Midnight',color:'#101722'},
 {name:'Deep navy',color:'#101d31'},
 {name:'Graphite',color:'#20242d'},
 {name:'Indigo',color:'#211c38'},
 {name:'Forest',color:'#12251f'},
 {name:'Warm charcoal',color:'#29211f'}
]);
const e=(type,x,y,w,h,label='',fill='#26354a',extra={})=>({type,x,y,w,h,label,fill,...extra});
export const SCREENS = Object.freeze({
 inventory:{title:'Inventory',background:'#101722',elements:[
  e('panel',25,25,750,450,'','#1e293b',{radius:20}),e('text',56,47,300,56,'INVENTORY','#ffffff',{fontSize:34}),
  e('panel',55,122,445,308,'','#29374a',{radius:16}),e('panel',522,122,223,308,'','#29374a',{radius:16}),
  ...Array.from({length:8},(_,i)=>e('panel',73+i%4*104,144+Math.floor(i/4)*111,89,91,'','#43536b',{radius:11})),
  e('text',543,147,180,32,'ITEM DETAILS','#ffffff',{fontSize:20}),e('button',546,351,174,54,'EQUIP','#fb8c35')
 ]},
 upgrades:{title:'Upgrades',background:'#101722',elements:[
  e('text',65,35,400,60,'UPGRADES','#ffffff',{fontSize:38}),
  ...Array.from({length:3},(_,i)=>e('panel',45+i*252,133,226,286,'','#26374d',{radius:20})),
  ...['ENGINE','ARMOR','HANDLING'].map((label,i)=>e('text',62+i*252,169,192,50,label,'#ffffff',{fontSize:24})),
  ...Array.from({length:3},(_,i)=>e('progress',65+i*252,282,180,16,'','#fb8c35',{value:45+i*20})),
  ...Array.from({length:3},(_,i)=>e('button',66+i*252,330,181,56,'UPGRADE','#fb8c35'))
 ]},
 shop:{title:'Shop',background:'#111827',elements:[
  e('text',48,27,500,68,'ITEM SHOP','#ffffff',{fontSize:38}),
  ...Array.from({length:3},(_,i)=>e('panel',42+i*251,130,222,320,'','#28394b',{radius:18})),
  ...Array.from({length:3},(_,i)=>e('image',61+i*251,153,186,145,'PREVIEW','#3d5064',{radius:12})),
  ...['STARTER KIT','RARE DROP','BOOSTER'].map((label,i)=>e('text',55+i*251,308,197,44,label,'#ffffff',{fontSize:21})),
  ...Array.from({length:3},(_,i)=>e('button',64+i*251,376,178,52,'PURCHASE','#fb8c35'))
 ]},
 settings:{title:'Settings',background:'#101722',elements:[
  e('panel',145,38,510,426,'','#202d40',{radius:22}),e('text',203,75,398,65,'SETTINGS','#ffffff',{fontSize:39}),
  ...['SOUND','MUSIC','CONTROLS'].map((label,i)=>e('text',194,164+i*71,225,39,label,'#ffffff',{fontSize:23})),
  ...Array.from({length:3},(_,i)=>e('button',470,162+i*71,142,43,'EDIT','#364b61')),
  e('button',270,389,260,52,'BACK','#fb8c35')
 ]}
});
export function screenPreset(key) {
  if(!Object.hasOwn(SCREENS,key))throw new Error('Unknown screen');
  return normalizeDocument(structuredClone(SCREENS[key]));
}
export function applyLibraryItem(doc,index) {
  if(!Number.isInteger(index)||index<0||index>=LIBRARY.length)throw new RangeError('Invalid asset');
  if(doc.elements.length>=100)return doc;
  const sample=LIBRARY[index];
  const seq=doc.elements.length;
  const id='asset'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
  return {...doc,elements:[...doc.elements,normalizeElement({...sample,id,x:65+seq%8*13,y:60+seq%8*13},seq)]};
}
export function reorder(doc,id,direction) {
  const items=[...doc.elements], i=items.findIndex(x=>x.id===id);
  if(i<0||!Number.isInteger(direction)||Math.abs(direction)!==1)return doc;
  const next=i+direction;if(next<0||next>=items.length)return doc;
  [items[i],items[next]]=[items[next],items[i]];
  return {...doc,elements:items};
}
export function moveElement(doc,id,dx,dy,{snap=0}={}) {
  const item=doc.elements.find(e=>e.id===id);if(!item)return doc;
  const quantize=x=>snap>0?Math.round(x/snap)*snap:x;
  return {...doc,elements:doc.elements.map(e=>e.id===id?normalizeElement({...e,x:quantize(e.x+dx),y:quantize(e.y+dy)}):e)};
}
export function duplicate(doc,id) {
  const item=doc.elements.find(e=>e.id===id);if(!item||doc.elements.length>=100)return doc;
  const clone=normalizeElement({...item,id:'copy'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),x:item.x+16,y:item.y+16},doc.elements.length);
  return {...doc,elements:[...doc.elements,clone]};
}
