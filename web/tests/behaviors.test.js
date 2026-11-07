import test from 'node:test';
import assert from 'node:assert/strict';
import {SearchableCollection,EquipmentSlots,NavigationHistory,ConfirmationQueue} from '../layout-kit/behaviors.js';
import {UIWorkflow} from '../layout-kit/workflow.js';

const items=[{id:'a',name:'Sword'},{id:'b',name:'Shield'},{id:'c',name:'Potion'}];

test('search, sorted results and stable selection across source updates',()=>{
 const collection=new SearchableCollection({items});
 assert.equal(collection.select('b'),true);
 collection.setQuery('s');
 assert.deepEqual(collection.visible().map(x=>x.id),['a','b']);
 collection.setSort('name-asc');
 assert.deepEqual(collection.visible().map(x=>x.id),['b','a']);
 assert.equal(collection.selectedId,'b');
 collection.setItems([{id:'b',name:'Shield+'},{id:'c',name:'Potion'}]);
 assert.equal(collection.selected().name,'Shield+');
 assert.equal(collection.select('missing'),false);
 collection.setItems([{id:'c',name:'Potion'}]);
 assert.equal(collection.selected(),null);
 assert.throws(()=>collection.setItems([{id:1},{id:1}]),/unique/);
});

test('equipment UI slots do not silently change game inventory',()=>{
 const slots=new EquipmentSlots({slots:['main','off']});
 assert.deepEqual(slots.assign('main',items[0],{canEquip:()=>false}),{ok:false,reason:'rejected'});
 const result=slots.assign('main',items[0]);
 assert.equal(result.ok,true);
 assert.equal(slots.get('main'),items[0]);
 assert.equal(slots.unequip('main').previous,items[0]);
 assert.equal(slots.get('main'),null);
 assert.equal(slots.unequip('main').ok,false);
 assert.equal(slots.assign('invalid',items[0]).ok,false);
});

test('navigation history supports back, replace and reset',()=>{
 const nav=new NavigationHistory({initial:'main-menu',knownScreens:['main-menu','inventory','settings']});
 assert.equal(nav.go('inventory'),true);
 assert.equal(nav.go('settings'),true);
 assert.equal(nav.back(),true);
 assert.equal(nav.current,'inventory');
 assert.equal(nav.go('settings',{replace:true}),true);
 assert.equal(nav.back(),true);
 assert.equal(nav.current,'main-menu');
 assert.equal(nav.go('not-a-screen'),false);
 assert.equal(nav.reset('main-menu'),true);
 assert.equal(nav.back(),false);
});

test('confirmation queue allows one pending request, approve or cancel once',()=>{
 const dialog=new ConfirmationQueue();
 assert.equal(dialog.request('shop.purchase',{itemId:'a'}),true);
 assert.equal(dialog.request('shop.purchase',{itemId:'b'}),false);
 const payload=dialog.confirm();
 assert.deepEqual(payload,{actionId:'shop.purchase',payload:{itemId:'a'}});
 assert.equal(dialog.confirm(),null);
 dialog.request('upgrades.purchase',{});
 assert.equal(dialog.cancel(),true);
 assert.equal(dialog.cancel(),false);
});

test('workflow routes selection, search, equip and gated purchase without mutating game data',()=>{
 const requests=[],changes=[];
 const workflow=new UIWorkflow({items,onGameAction:(action,payload)=>requests.push({action,payload}),onChange:state=>changes.push(state)});
 assert.equal(workflow.handle('inventory.select',{item:items[1]}),true);
 assert.equal(workflow.handle('inventory.search',{value:'sh'}),true);
 assert.deepEqual(workflow.snapshot().inventory.items.map(x=>x.id),['b']);
 assert.equal(workflow.handle('inventory.equip',{}),true);
 assert.equal(requests[0].action,'inventory.equip');
 assert.equal(requests[0].payload.item.id,'b');
 assert.equal(workflow.equipment.get('primary'),null,'Host must commit equipment state explicitly');
 assert.equal(workflow.syncEquipment('primary',items[1]).ok,true);
 assert.equal(workflow.handle('shop.purchase',{itemId:'a'}),true);
 assert.equal(requests.length,1,'Purchase must await confirmation');
 assert.equal(workflow.handle('ui.cancel'),true);
 assert.equal(requests.length,1);
 workflow.handle('shop.purchase',{itemId:'b'});
 assert.equal(workflow.handle('ui.confirm'),true);
 assert.equal(requests.length,2);
 assert.equal(requests[1].action,'shop.purchase');
 assert.ok(changes.length>2);
});
