/** Additional functional layouts. Shape and data/action IDs remain game-agnostic.
 * Every family has an original layout, reversed composition and a separately
 * arranged spotlight composition, not merely different text or colors.
 * Geometry is authored in 800 × 500 design coordinates in base node order.
 */
const rects=spec=>spec.split('|').map(rect=>{
 const values=rect.trim().split(',').map(Number);
 if(values.length!==4||values.some(x=>!Number.isFinite(x)))throw new Error('Invalid variant rectangle '+rect);
 return values;
});
export const FAMILY_VARIANT_NAMES=Object.freeze({
 'main-menu':['Right Rail','Hero Split'],
 'pause-menu':['Reversed Dialog','Action Dock'],
 settings:['Reversed Settings','Side Preferences'],
 hud:['Reversed HUD','Combat HUD'],
 confirmation:['Reversed Dialog','Compact Prompt'],
 inventory:['Reversed Inventory','Detail First'],
 equipment:['Reversed Equipment','Loadout Focus'],
 'search-list':['Reversed List','Finder'],
 crafting:['Reversed Crafting','Recipe Workspace'],
 shop:['Reversed Shop','Product Spotlight'],
 upgrades:['Reversed Upgrades','Tuning Workspace'],
 'character-stats':['Reversed Character','Attribute Dashboard'],
 'skill-tree':['Reversed Tree','Horizontal Branches'],
 'quest-log':['Reversed Quests','Quest Focus'],
 'career-events':['Reversed Career','Event Spotlight'],
 leaderboard:['Reversed Rankings','Ranking Focus'],
 garage:['Reversed Garage','Vehicle Spotlight'],
 dealership:['Reversed Dealership','Showroom Focus'],
 'race-selection':['Reversed Races','Event Focus']
});
/** Purposeful alternatives authored per screen family (base order). */
const SPOTLIGHT_RECTS=Object.freeze({
 'main-menu':rects('430,40,335,418|48,150,335,75|470,140,255,62|470,230,255,62|470,320,255,62'),
 'pause-menu':rects('35,292,730,165|55,84,650,70|55,338,214,65|293,338,214,65|531,338,214,65'),
 inventory:rects('30,20,340,57|245,99,525,360|30,99,200,360|265,116,326,48|607,116,140,48|265,184,484,255|47,125,166,52|47,198,166,121|47,371,166,62'),
 upgrades:rects('35,26,350,52|566,100,203,357|584,121,165,314|30,100,522,357|50,134,462,54|50,210,462,27|50,274,462,73|290,376,216,57'),
 shop:rects('36,24,350,55|545,31,220,46|283,102,485,358|304,125,443,307|30,102,237,358|47,135,205,61|47,254,205,54|47,377,205,56'),
 settings:rects('30,43,739,413|53,85,320,65|423,130,305,55|423,210,305,55|423,290,305,54|63,358,275,62'),
 hud:rects('20,366,220,112|37,393,180,60|561,366,219,112|579,390,181,58|229,18,344,80|250,48,230,24|626,35,124,54'),
 equipment:rects('35,23,340,53|332,99,435,358|352,121,263,49|352,186,395,246|30,99,285,358|49,118,250,53|51,192,110,95|176,192,110,95|50,309,111,56|177,309,109,56|183,400,107,45'),
 'search-list':rects('38,38,315,59|39,132,301,55|39,209,301,55|369,85,385,364|39,381,294,55'),
 confirmation:rects('60,142,680,213|91,175,312,64|91,246,312,64|443,188,233,59|443,273,233,59'),
 'character-stats':rects('34,22,345,58|30,96,737,360|51,127,330,54|51,195,330,53|51,268,316,27|50,321,315,52|51,393,313,51|411,110,341,333|430,134,307,185|430,335,189,45|622,380,117,58'),
 crafting:rects('35,21,339,53|37,95,300,48|34,162,210,288|259,162,238,288|515,91,252,361|530,116,219,50|530,186,218,112|530,300,205,43|529,354,58,56|597,354,58,56|663,354,91,56'),
 'skill-tree':rects('35,20,310,55|548,23,213,50|30,101,178,139|30,256,178,176|226,100,328,335|248,228,69,69|357,155,68,68|357,319,68,68|460,153,64,64|460,322,64,64|566,101,201,337|583,130,166,53|583,210,166,93|583,365,166,54'),
 'quest-log':rects('35,22,345,59|35,102,730,61|35,181,318,274|373,181,393,274|393,196,350,54|393,260,350,98|393,371,351,25|527,404,214,43'),
 garage:rects('35,25,350,57|293,99,475,324|333,186,401,113|313,357,109,55|639,357,111,55|30,99,249,324|48,130,211,59|48,197,211,117|48,325,101,51|158,325,101,51|50,434,213,48'),
 dealership:rects('36,23,349,56|551,28,210,46|35,99,269,48|319,99,179,48|472,164,293,293|29,165,426,294|48,183,380,54|48,242,380,125|48,378,182,51|247,380,178,59'),
 'race-selection':rects('34,23,360,58|32,101,735,63|33,183,343,267|394,184,374,266|412,200,336,57|412,265,335,44|412,320,335,43|413,370,175,46|603,387,148,52'),
 leaderboard:rects('36,22,370,58|34,101,732,57|32,176,735,279|52,194,697,176|51,395,276,50|547,391,199,54'),
 'career-events':rects('36,24,355,56|35,100,732,62|34,182,324,278|375,182,391,278|394,199,352,56|394,269,352,92|394,375,351,25|538,405,204,45')
});
function positionNodes(base,positions){
 if(base.nodes.length!==positions.length)throw new Error('Variant geometry mismatch for '+base.name+': '+base.nodes.length+' vs '+positions.length);
 return base.nodes.map((node,index)=>{
  const [x,y,w,h]=positions[index];
  return {...node,x,y,w,h, ...(node.shape==='circle'?{h:w}:{})};
 });
}
function reversed(base,key){
 // Symmetric center dialogs would remain unchanged if mathematically mirrored.
 // Give those screens a purposefully offset side-dock composition instead.
 const dockOffset={'main-menu':180,'pause-menu':150,settings:-112,confirmation:150}[key];
 return base.nodes.map(node=>({...node,x:dockOffset===undefined?800-node.x-node.w:node.x+dockOffset}));
}
/** Generated layouts retain stable node IDs, bindings, actions and graph edges. */
export function createVariantPresets(basePresets){
 const variants={};
 for(const [key,base] of Object.entries(basePresets)){
  if(!Object.hasOwn(FAMILY_VARIANT_NAMES,key)||!Object.hasOwn(SPOTLIGHT_RECTS,key))throw new Error('Missing authored variants for '+key);
  const [reverseName,spotlightName]=FAMILY_VARIANT_NAMES[key];
  variants[key+'-reverse']={name:base.name+' — '+reverseName,nodes:reversed(base,key),edges:structuredClone(base.edges??[])};
  variants[key+'-focus']={name:base.name+' — '+spotlightName,nodes:positionNodes(base,SPOTLIGHT_RECTS[key]),edges:structuredClone(base.edges??[])};
 }
 return variants;
}
