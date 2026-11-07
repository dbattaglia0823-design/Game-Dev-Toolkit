import {PRESETS,getPreset} from './presets.js';
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
 return Object.entries(CATEGORIES).flatMap(([category,keys])=>
  keys.map(key=>{
   if(!Object.hasOwn(PRESETS,key))throw new Error('Unknown template in catalog: '+key);
   const template=getPreset(key),contract=getContract(template);
   return {key,category,name:template.name,description:DESCRIPTIONS[key],
    nodeCount:template.nodes.length,actionCount:contract.actions.length,bindingCount:contract.bindings.length};
  })
 );
}
export function catalogFor(category='all'){
 return templateCatalog().filter(entry=>category==='all'||entry.category===category);
}
