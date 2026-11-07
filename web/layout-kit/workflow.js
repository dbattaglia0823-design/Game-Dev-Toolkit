import {SearchableCollection,EquipmentSlots,NavigationHistory,ConfirmationQueue} from './behaviors.js';

/** Converts semantic actions from a v2 layout into reusable UI behavior.
 * The host game always owns game-state mutations and decides whether to accept a request.
 */
export class UIWorkflow {
 constructor({
  items=[],slots=['primary','secondary'],screens=['main-menu','inventory','equipment','shop','settings','confirm'],
  initialScreen='inventory',onGameAction=()=>{},onChange=()=>{},confirmationActions=['shop.purchase','upgrades.purchase']
 }={}){
  if(typeof onGameAction!=='function'||typeof onChange!=='function')throw new TypeError('Callbacks must be functions');
  this.onGameAction=onGameAction;this.onChange=onChange;
  this.confirmActions=new Set(confirmationActions);
  this.collection=new SearchableCollection({items,onChange:()=>this.notify()});
  this.equipment=new EquipmentSlots({slots,onChange:()=>this.notify()});
  this.navigation=new NavigationHistory({initial:initialScreen,knownScreens:screens,onChange:()=>this.notify()});
  this.confirmation=new ConfirmationQueue({onChange:()=>this.notify()});
  this.notify();
 }
 notify(){this.onChange?.(this.snapshot());}
 snapshot(){
  const current=this.collection.snapshot();
  return {
   navigation:this.navigation.snapshot(),
   inventory:{
    items:current.visible.map(x=>x.item),selected:current.selected,
    search:current.query,sort:current.sort,visibleCount:current.count,totalCount:current.total
   },
   equipment:this.equipment.snapshot(),
   confirmation:this.confirmation.snapshot()
  };
 }
 setItems(items){this.collection.setItems(items);}
 /** Handle an adapter's named action. Event payload is never trusted as game state. */
 handle(actionId,payload={}){
  switch(actionId){
   case 'inventory.search':this.collection.setQuery(payload.value??'');return true;
   case 'inventory.sort':
    this.collection.setSort(this.collection.sort==='name-asc'?'name-desc':'name-asc');return true;
   case 'inventory.select':{
    const id=payload.item?.id;
    return id!==undefined?this.collection.select(id):false;
   }
   case 'inventory.equip':{
    const item=this.collection.selected();
    if(!item)return false;
    this.onGameAction(actionId,{...payload,item,slot:payload.slot??'primary'});
    return true;
   }
   case 'equipment.unequip':{
    const slot=payload.slot;
    if(typeof slot!=='string'||!Object.hasOwn(this.equipment.snapshot(),slot))return false;
    this.onGameAction(actionId,{slot});return true;
   }
   case 'nav.back':return this.navigation.back();
   case 'nav.main_menu':return this.navigation.reset('main-menu');
   case 'nav.settings':return this.navigation.go('settings');
   case 'nav.inventory':return this.navigation.go('inventory');
   case 'nav.equipment':return this.navigation.go('equipment');
   case 'nav.shop':return this.navigation.go('shop');
   case 'ui.confirm':{
    const approved=this.confirmation.confirm();
    if(!approved)return false;
    this.onGameAction(approved.actionId,approved.payload);return true;
   }
   case 'ui.cancel':return this.confirmation.cancel();
   default:
    if(this.confirmActions.has(actionId))return this.confirmation.request(actionId,payload);
    this.onGameAction(actionId,payload);return true;
  }
 }
 /** Call from host only after its own equip operation succeeds. */
 syncEquipment(slot,item){return this.equipment.assign(slot,item);}
 clearEquipment(slot){return this.equipment.unequip(slot);}
}
