import {PRESETS,getPreset} from './presets.js';
import {FAMILY_VARIANT_NAMES} from './variant-presets.js';
import {getContract} from './schema.js';

/** Browsable metadata only: games and Codex can replace every visual detail. */
export const CATEGORIES=Object.freeze({
 core:['main-menu','pause-menu','settings','hud','confirmation'],
 items:['inventory','equipment','search-list','crafting','shop','upgrades'],
 progression:['character-stats','skill-tree','quest-log','career-events','leaderboard'],
 racing:['garage','dealership','race-selection']
});
const DESCRIPTIONS=Object.freeze({
 'main-menu':'Start, navigate and exit',
 'pause-menu':'Resume and navigate',
 settings:'Settings controls and value bindings',
 hud:'Game state indicators',
 confirmation:'Action approval and cancellation',
 inventory:'Search, selection and item details',
 equipment:'Equipment slots and item selection',
 'search-list':'Reusable searchable collection',
 crafting:'Recipe categories, ingredients and craft requests',
 shop:'Catalog and purchasing requests',
 upgrades:'Categories and upgrade requests',
 'character-stats':'Attribute list, XP and point allocation requests',
 'skill-tree':'Branches, skill nodes and unlock requests',
 'quest-log':'Quest filters, objectives and tracking',
 'career-events':'Event progression and entry',
 leaderboard:'Ranking filters and refresh',
 garage:'Vehicle preview, stats and garage navigation',
 dealership:'Vehicle catalog, comparison and purchase request',
 'race-selection':'Event filters, opponents and race entry'
});
export function templateCatalog(){
 return Object.entries(CATEGORIES).flatMap(([category,families])=>
  families.flatMap(family=>[family,family+'-reverse',family+'-focus'].map((key,index)=>{
   if(!Object.hasOwn(PRESETS,key))throw new Error('Unknown template in catalog: '+key);
   const template=getPreset(key),contract=getContract(template);
   const variant=['original','reverse','focus'][index];
   const variantLabel=index===0?'Original':FAMILY_VARIANT_NAMES[family][index-1];
   const description=index===0?DESCRIPTIONS[family]:
    (index===1?'Reversed composition':'Alternative focal composition')+' for '+DESCRIPTIONS[family].toLowerCase();
   return {key,category,family,variant,variantLabel,name:template.name,description,
    nodeCount:template.nodes.length,actionCount:contract.actions.length,bindingCount:contract.bindings.length};
  }))
 );
}
export function catalogFor(category='all',family='all'){
 return templateCatalog().filter(entry=>
  (category==='all'||entry.category===category) &&
  (family==='all'||entry.family===family)
 );
}
export function familiesFor(category='all'){
 return Object.entries(CATEGORIES).filter(([key])=>category==='all'||category===key)
  .flatMap(([,families])=>families.map(key=>({key,name:getPreset(key).name})));
}
