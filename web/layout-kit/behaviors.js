/** Game-agnostic, headless UI behaviors. These own transient interface state,
 * not inventory persistence, purchases, progression, or gameplay outcomes.
 */
const asId = item => item && typeof item === 'object' ? item.id : null;
const nameOf = item => String(item?.name ?? item?.label ?? item?.title ?? '');
const clone = value => structuredClone(value);
const assertName = value => {
 if (typeof value !== 'string' || !/^[A-Za-z][\w.-]{0,79}$/.test(value)) throw new TypeError('Invalid identifier');
 return value;
};

export class SearchableCollection {
 constructor({items=[], getId=asId, getText=nameOf, onChange=()=>{}}={}) {
  this.getId=getId;this.getText=getText;this.onChange=onChange;
  this.query='';this.sort='original';this.selectedId=null;this.setItems(items);
 }
 setItems(items) {
  if(!Array.isArray(items))throw new TypeError('Items must be an array');
  const ids=new Set();
  for(const item of items){
   const id=this.getId(item);
   if(id===null||id===undefined||ids.has(id))throw new Error('Items require unique stable IDs');
   ids.add(id);
  }
  this.items=items.slice();
  if(!ids.has(this.selectedId))this.selectedId=null;
  this.onChange(this.snapshot());
  return this.snapshot();
 }
 setQuery(query) {this.query=String(query??'').slice(0,200);this.onChange(this.snapshot());return this.snapshot();}
 setSort(sort) {
  if(!['original','name-asc','name-desc'].includes(sort))throw new Error('Unknown sort mode');
  this.sort=sort;this.onChange(this.snapshot());return this.snapshot();
 }
 select(id){
  if(!this.items.some(item=>this.getId(item)===id))return false;
  this.selectedId=id;this.onChange(this.snapshot());return true;
 }
 clearSelection(){this.selectedId=null;this.onChange(this.snapshot());}
 selected(){return this.items.find(item=>this.getId(item)===this.selectedId)??null;}
 visible(){
  const term=this.query.trim().toLocaleLowerCase();
  const result=this.items.map((item,index)=>({item,index}))
   .filter(({item})=>this.getText(item).toLocaleLowerCase().includes(term));
  if(this.sort!=='original')result.sort((a,b)=>{
   const cmp=this.getText(a.item).localeCompare(this.getText(b.item));
   return (this.sort==='name-asc'?cmp:-cmp) || a.index-b.index;
  });
  return result.map(({item,index})=>({item,index,id:this.getId(item)}));
 }
 snapshot(){return {query:this.query,sort:this.sort,selectedId:this.selectedId,selected:this.selected(),visible:this.visible(),count:this.visible().length,total:this.items.length};}
}

export class EquipmentSlots {
 constructor({slots=[],onChange=()=>{}}={}) {
  this.slots=new Map();this.onChange=onChange;
  for(const name of slots){assertName(name);if(this.slots.has(name))throw new Error('Duplicate slot');this.slots.set(name,null);}
 }
 get(slot){if(!this.slots.has(slot))throw new Error('Unknown slot: '+slot);return this.slots.get(slot);}
 assign(slot,item,{canEquip=()=>true}={}){
  if(!this.slots.has(slot))return {ok:false,reason:'unknown_slot'};
  if(item==null)return {ok:false,reason:'missing_item'};
  if(!canEquip(item,slot))return {ok:false,reason:'rejected'};
  const previous=this.slots.get(slot);
  this.slots.set(slot,item);this.onChange(this.snapshot());
  return {ok:true,slot,item,previous};
 }
 unequip(slot){
  if(!this.slots.has(slot))return {ok:false,reason:'unknown_slot'};
  const previous=this.slots.get(slot);
  if(previous===null)return {ok:false,reason:'empty'};
  this.slots.set(slot,null);this.onChange(this.snapshot());return {ok:true,slot,previous};
 }
 snapshot(){return Object.fromEntries(this.slots);}
}

export class NavigationHistory {
 constructor({initial='main-menu',knownScreens=null,onChange=()=>{}}={}){
  assertName(initial);
  this.knownScreens=knownScreens===null?null:new Set(knownScreens.map(assertName));
  if(this.knownScreens&&!this.knownScreens.has(initial))throw new Error('Unknown initial screen');
  this.current=initial;this.stack=[];this.onChange=onChange;
 }
 allowed(screen){assertName(screen);return !this.knownScreens||this.knownScreens.has(screen);}
 go(screen,{replace=false}={}){
  if(!this.allowed(screen)||this.current===screen)return false;
  const from=this.current;
  if(!replace)this.stack.push(from);
  this.current=screen;this.onChange(this.snapshot(),{from,to:screen});return true;
 }
 back(){
  if(!this.stack.length)return false;
  const from=this.current;this.current=this.stack.pop();
  this.onChange(this.snapshot(),{from,to:this.current});return true;
 }
 reset(screen){
  if(!this.allowed(screen))return false;
  const from=this.current;this.stack=[];this.current=screen;
  this.onChange(this.snapshot(),{from,to:screen});return true;
 }
 snapshot(){return {screen:this.current,canGoBack:this.stack.length>0,history:[...this.stack]};}
}

/** Explicit two-step confirmation; never executes irreversible game actions itself. */
export class ConfirmationQueue {
 constructor({onChange=()=>{}}={}){this.pending=null;this.onChange=onChange;}
 request(actionId,payload={}){
  assertName(actionId);
  if(this.pending)return false;
  this.pending={actionId,payload:clone(payload)};
  this.onChange(this.snapshot());return true;
 }
 confirm(){
  if(!this.pending)return null;
  const approved=clone(this.pending);this.pending=null;this.onChange(this.snapshot());return approved;
 }
 cancel(){
  if(!this.pending)return false;
  this.pending=null;this.onChange(this.snapshot());return true;
 }
 snapshot(){return this.pending?clone(this.pending):null;}
}
