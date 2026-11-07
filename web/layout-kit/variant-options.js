import {CATEGORIES} from './catalog.js';
import {PRESETS} from './presets.js';

/** Adds variant choices without duplicating the existing original options. */
export function appendVariantOptions(select){
 const titles={core:'Main menus & core',items:'Inventory & economy',progression:'RPG & progression',racing:'Racing & vehicles'};
 for(const [category,families] of Object.entries(CATEGORIES)){
  const group=document.createElement('optgroup');
  group.label=titles[category]+' — alternative layouts';
  for(const family of families){
   for(const suffix of ['reverse','focus']){
    const key=family+'-'+suffix;
    const option=document.createElement('option');
    option.value=key;option.textContent=PRESETS[key].name;
    group.append(option);
   }
  }
  select.append(group);
 }
}
