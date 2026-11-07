import {getPreset} from '../presets.js';
import {mountLayout} from '../runtime.js';
import {UIWorkflow} from '../workflow.js';

const $=id=>document.getElementById(id);
const items=[
 {id:'item-01',name:'Iron sword',type:'weapon'},
 {id:'item-02',name:'Travel shield',type:'shield'},
 {id:'item-03',name:'Healing potion',type:'consumable'},
 {id:'item-04',name:'Leather armor',type:'armor'},
 {id:'item-05',name:'Steel sword',type:'weapon'},
 {id:'item-06',name:'Torch',type:'tool'}
];
let view=null,workflow=null,requests=[];
let settings={music:true,sfx:true,volume:75};
const onGameAction=(action,payload)=>{
 if(action==='inventory.equip'){
  // Demonstration only: host simulates accepting equip. A real game must validate item and update its inventory.
  workflow.syncEquipment(payload.slot,payload.item);
 }
 if(action==='equipment.unequip')workflow.clearEquipment(payload.slot);
 if(action==='settings.volume_changed')settings.volume=payload.value;
 if(action==='settings.music_changed')settings.music=payload.value;
 if(action==='settings.sfx_changed')settings.sfx=payload.value;
 requests.unshift({action,payload});requests=requests.slice(0,6);
 $('events').textContent=JSON.stringify(requests,null,2);
 render();
};
workflow=new UIWorkflow({items,onGameAction,onChange:()=>{if(workflow)render();}});
function render(){
 const snapshot=workflow.snapshot(),pending=snapshot.confirmation;
 const screen=pending?'confirmation':snapshot.navigation.screen;
 const data={
  game:{title:'UI Layout Demo'},
  inventory:{...snapshot.inventory,selected:snapshot.inventory.selected??{name:'None',description:'Select an item'}},
  equipment:{primary:snapshot.equipment.primary,secondary:snapshot.equipment.secondary},
  confirmation:{title:'Confirm action',message:pending?'Approve '+pending.actionId+'?':'No pending action'},
  shop:{items:[{id:'product-01',name:'Sample product'}],selected:{name:'Sample product',price:'100'},balance:'500'},
  settings
 };
 view?.destroy();
 view=mountLayout({container:$('canvas'),layout:getPreset(screen),data,onAction:(id,payload)=>{
  if(id==='equipment.slot_primary'||id==='equipment.slot_secondary'){
   const slot=id.endsWith('primary')?'primary':'secondary';
   const item=workflow.equipment.get(slot);
   if(item)workflow.handle('equipment.unequip',{slot});
   return;
  }
  workflow.handle(id,payload);
 }});
 $('hint').textContent=pending?'A purchase is awaiting confirmation. Confirm or cancel it in the layout.':
  'Showing '+screen+'. Select items, filter, sort, equip or navigate without changing any real game data.';
 $('state').textContent=JSON.stringify({
  screen:snapshot.navigation.screen,selectedId:snapshot.inventory.selected?.id??null,
  query:snapshot.inventory.search,sort:snapshot.inventory.sort,
  visible:snapshot.inventory.items.map(x=>x.name),equipment:snapshot.equipment,
  pendingAction:pending?.actionId??null
 },null,2);
 for(const button of $('nav').querySelectorAll('[data-screen]')){
  button.setAttribute('aria-pressed',String(button.dataset.screen===snapshot.navigation.screen));
 }
}
$('nav').addEventListener('click',event=>{
 const screen=event.target.closest('[data-screen]')?.dataset.screen;
 if(screen)workflow.navigation.go(screen);
});
$('back').addEventListener('click',()=>workflow.navigation.back());
render();
