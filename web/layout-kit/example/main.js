import {getPreset} from '../presets.js';
import {mountLayout} from '../runtime.js';
const target=document.querySelector('#target'),output=document.querySelector('#last-event');
const data={
 game:{title:'Your game title'},inventory:{items:[{name:'Item A'},{name:'Item B'},{name:'Item C'}],selected:{name:'Item A',description:'Replace with game data'}},
 settings:{music:true,sfx:true,volume:65},
 shop:{items:[{name:'Product A'},{name:'Product B'}],selected:{name:'Product A',price:'100'},balance:500},
 upgrades:{categories:['Category A','Category B'],selected:{name:'Upgrade',level_percent:50,comparison:'Stat placeholder'}},
 hud:{score:'1200',time:'01:30',health:76}
};
let view=null;
function show(name){
 view?.destroy();
 view=mountLayout({container:target,layout:getPreset(name),data,onAction:(actionId,payload)=>{
  output.textContent=JSON.stringify({actionId,payload},null,2);
  if(actionId==='inventory.select'&&payload.item){
   data.inventory.selected={name:payload.item.name,description:'Selected through runtime event'};
   view.setData(data);
  }
  if(actionId==='settings.volume_changed'){data.settings.volume=payload.value;view.setData(data);}
 }});
}
document.querySelector('#screen').addEventListener('change',ev=>show(ev.target.value));
show('inventory');
