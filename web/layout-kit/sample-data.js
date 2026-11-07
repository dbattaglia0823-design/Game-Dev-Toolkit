/** Neutral demo values for testing bindings; never use as game content or saved state. */
const options=(prefix,count=4)=>Array.from({length:count},(_,i)=>({id:prefix+'-'+(i+1),name:prefix+' '+(i+1)}));
export const SAMPLE_DATA=Object.freeze({
 game:{title:'Game Title'},
 inventory:{search:'',items:options('Item'),selected:{name:'Selected item',description:'Item detail'},visibleCount:4},
 equipment:{primary:{name:'Primary'},secondary:{name:'Secondary'}},
 settings:{music:true,sfx:true,volume:65},
 hud:{health:85,time:'01:30',score:'1,250'},
 confirmation:{title:'Confirm action',message:'Review action before proceeding'},
 upgrades:{categories:options('Category'),selected:{name:'Upgrade',level_percent:45,comparison:'Comparison'}},
 shop:{balance:'1,000',items:options('Product'),selected:{name:'Product',price:'100'}},
 character:{name:'Character',class_name:'Class',xp_percent:60,available_points:3,
  attributes:options('Attribute'),selected:{name:'Attribute'}},
 crafting:{search:'',categories:options('Category'),recipes:options('Recipe'),selected:{
  name:'Recipe',ingredients:options('Ingredient',3)},quantity:1},
 skills:{points:3,branches:options('Branch'),nodes:options('Skill',7),selected:{name:'Skill',description:'Skill details'}},
 quests:{filters:options('Filter'),items:options('Quest'),selected:{title:'Quest',objective:'Objective',progress:40}},
 garage:{selected:{display_name:'Vehicle preview',name:'Vehicle',stats:options('Stat',4)}},
 dealership:{search:'',balance:'1,000',vehicles:options('Vehicle'),selected:{name:'Vehicle',stats:options('Spec',4),price:'1,000'}},
 races:{filters:options('Type'),items:options('Race'),selected:{name:'Race',distance:'Distance',opponent:'Opponent',reward:'Reward'}},
 leaderboard:{categories:options('Category'),entries:options('Rank',9),player_rank:'Player rank'},
 career:{categories:options('Category'),events:options('Event'),selected:{title:'Event',requirements:'Requirements',progress:55}}
});
