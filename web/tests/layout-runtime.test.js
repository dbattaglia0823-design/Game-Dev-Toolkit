import test from 'node:test';
import assert from 'node:assert/strict';
import {mountLayout} from '../layout-kit/runtime.js';
import {getPreset} from '../layout-kit/presets.js';

class Element {
 constructor(tag='div') {
  this.tagName=tag;this.style={};this.dataset={};this.children=[];this.attributes={};
  this.classList={add:()=>{}};this.events=new Map();this.textContent='';this.value='';this.checked=false;this.className='';
 }
 setAttribute(name,value){this.attributes[name]=value;}
 append(...children){this.children.push(...children);}
 replaceChildren(...children){this.children=[...children];}
 addEventListener(name,fn){this.events.set(name,fn);}
 querySelector(name){return this.children.find(child=>child.tagName===name)??null;}
 remove(){this.removed=true;}
 fire(name){this.events.get(name)?.({target:this});}
}
test('browser runtime binds data and dispatches inventory actions',()=>{
 const previous=globalThis.document;
 globalThis.document={createElement:tag=>new Element(tag),createElementNS:(_,tag)=>new Element(tag),activeElement:null};
 try{
  const target=new Element(),events=[];
  const ui=mountLayout({
   container:target,layout:getPreset('inventory'),
   data:{inventory:{items:[{name:'Sword'},{name:'Shield'}],selected:{name:'Sword',description:'Equipment'}}},
   onAction:(actionId,payload)=>events.push({actionId,payload})
  });
  const root=target.children[0];
  assert.equal(root.children.length,10);
  const grid=root.children.find(child=>child.dataset.nodeId==='item_grid');
  assert.equal(grid.children[0].textContent,'Sword');
  grid.children[1].fire('click');
  assert.equal(events[0].actionId,'inventory.select');
  assert.equal(events[0].payload.index,1);
  assert.equal(events[0].payload.item.name,'Shield');
  const equip=root.children.find(child=>child.dataset.nodeId==='equip');
  equip.fire('click');
  assert.equal(events[1].actionId,'inventory.equip');
  ui.setData({inventory:{items:[{name:'Potion'}],selected:{name:'Potion'}}});
  assert.equal(grid.children.length,1);
  assert.equal(grid.children[0].textContent,'Potion');
  ui.destroy();
  assert.equal(root.removed,true);
 } finally {globalThis.document=previous;}
});
test('browser runtime handles toggle and slider events',()=>{
 const previous=globalThis.document;
 globalThis.document={createElement:tag=>new Element(tag),activeElement:null};
 try{
  const target=new Element(),events=[];
  const ui=mountLayout({container:target,layout:getPreset('settings'),
   data:{settings:{music:true,sfx:false,volume:35}},
   onAction:(id,payload)=>events.push([id,payload.value])});
  const nodes=target.children[0].children;
  const music=nodes.find(x=>x.dataset.nodeId==='music_toggle');
  assert.equal(music.querySelector('input').checked,true);
  music.querySelector('input').checked=false;music.querySelector('input').fire('change');
  const slider=nodes.find(x=>x.dataset.nodeId==='volume_slider');
  assert.equal(slider.querySelector('input').value,'35');
  slider.querySelector('input').value='45';slider.querySelector('input').fire('change');
  assert.deepEqual(events,[['settings.music_changed',false],['settings.volume_changed',45]]);
  ui.destroy();
 } finally {globalThis.document=previous;}
});
