/** Phase 3 reusable, function-first screens. No visual theme, gameplay data or mechanics. */
const N=(type,id,x,y,w,h,label='',role='',actionId='',bindingKey='')=>({type,id,x,y,w,h,label,role,actionId,bindingKey});
export const PHASE3_PRESETS=Object.freeze({
 'character-stats':{name:'Character Stats',nodes:[
  N('label','heading',35,25,340,52,'CHARACTER','screen_title'),
  N('panel','overview_panel',30,90,265,368,'','character_overview'),
  N('label','character_name',47,112,230,46,'Character','character_name','','character.name'),
  N('label','character_class',47,159,230,44,'Class','character_class','','character.class_name'),
  N('progress','experience',47,219,228,23,'Experience','experience_progress','','character.xp_percent'),
  N('label','available_points',47,267,225,42,'Available points','available_points','','character.available_points'),
  N('button','reset_attributes',48,380,223,53,'Reset attributes','secondary_action','character.reset_request'),
  N('panel','stats_panel',313,90,454,368,'','attributes_panel'),
  N('list','attributes',332,113,415,210,'Attributes','attribute_list','character.select_attribute','character.attributes'),
  N('label','selected_attribute',332,337,270,46,'Attribute details','detail_title','','character.selected.name'),
  N('button','allocate_point',601,337,145,53,'Allocate','primary_action','character.allocate_point')
 ]},
 'crafting':{name:'Crafting',nodes:[
  N('label','heading',36,22,320,52,'CRAFTING','screen_title'),
  N('input','recipe_search',36,91,256,47,'Search recipes','filter_search','crafting.search','crafting.search'),
  N('list','categories',36,158,181,290,'Categories','category_list','crafting.select_category','crafting.categories'),
  N('list','recipes',230,158,275,290,'Recipes','recipe_list','crafting.select_recipe','crafting.recipes'),
  N('panel','recipe_details',518,91,248,357,'','recipe_details'),
  N('label','recipe_name',535,119,214,48,'Recipe','detail_title','','crafting.selected.name'),
  N('list','ingredients',535,179,214,107,'Ingredients','ingredients_list','','crafting.selected.ingredients'),
  N('label','craft_quantity',535,300,213,41,'Quantity','craft_quantity','','crafting.quantity'),
  N('button','decrease_quantity',534,352,54,54,'−','quantity_decrease','crafting.quantity_decrease'),
  N('button','increase_quantity',596,352,54,54,'+','quantity_increase','crafting.quantity_increase'),
  N('button','craft',658,352,95,54,'Craft','primary_action','crafting.craft_request')
 ]},
 'skill-tree':{name:'Skill Tree',nodes:[
  N('label','heading',35,25,345,54,'SKILLS','screen_title'),
  N('label','points',521,29,244,44,'Available points','points_balance','','skills.points'),
  N('list','branches',35,98,179,138,'Branches','branch_list','skills.select_branch','skills.branches'),
  N('list','skill_nodes',35,254,179,182,'Skills','skill_list','skills.select_node','skills.nodes'),
  N('panel','tree_region',230,97,329,339,'','skill_tree_region'),
  {...N('button','skill_root',351,123,72,72,'1','skill_node','skills.select_node'),shape:'circle'},
  {...N('button','skill_left',273,237,70,70,'2','skill_node','skills.select_node'),shape:'circle'},
  {...N('button','skill_right',433,237,70,70,'3','skill_node','skills.select_node'),shape:'circle'},
  {...N('button','skill_final_left',258,341,64,64,'4','skill_node','skills.select_node'),shape:'circle'},
  {...N('button','skill_final_right',455,341,64,64,'5','skill_node','skills.select_node'),shape:'circle'},
  N('panel','skill_details',573,97,194,339,'','skill_details'),
  N('label','skill_name',585,122,171,60,'Skill','detail_title','','skills.selected.name'),
  N('label','skill_description',585,196,171,98,'Description','skill_description','','skills.selected.description'),
  N('button','unlock',583,347,175,57,'Unlock','primary_action','skills.unlock_request')
 ],edges:[
  {from:'skill_root',to:'skill_left'},
  {from:'skill_root',to:'skill_right'},
  {from:'skill_left',to:'skill_final_left'},
  {from:'skill_right',to:'skill_final_right'}
 ]},
 'quest-log':{name:'Quest Log',nodes:[
  N('label','heading',35,24,350,52,'QUESTS','screen_title'),
  N('list','quest_filters',33,98,170,346,'Categories','quest_filter_list','quests.select_filter','quests.filters'),
  N('list','quest_list',219,98,280,346,'Quest list','quest_list','quests.select','quests.items'),
  N('panel','quest_detail_panel',516,98,255,346,'','quest_details'),
  N('label','quest_title',533,120,217,50,'Quest','detail_title','','quests.selected.title'),
  N('label','quest_description',533,181,218,78,'Objectives','objectives','','quests.selected.objective'),
  N('progress','quest_progress',534,280,215,22,'Progress','quest_progress','','quests.selected.progress'),
  N('button','track_quest',536,356,212,54,'Track quest','primary_action','quests.track_request')
 ]},
 'garage':{name:'Garage',nodes:[
  N('label','heading',35,24,350,52,'GARAGE','screen_title'),
  N('panel','vehicle_stage',32,92,470,326,'','vehicle_preview_region'),
  N('label','vehicle_preview',78,205,375,92,'Vehicle preview','vehicle_preview_placeholder','','garage.selected.display_name'),
  N('button','previous_vehicle',49,356,86,53,'Previous','previous_item','garage.previous'),
  N('button','next_vehicle',399,356,85,53,'Next','next_item','garage.next'),
  N('panel','vehicle_info',519,92,251,326,'','vehicle_info_panel'),
  N('label','vehicle_name',534,112,220,51,'Vehicle','detail_title','','garage.selected.name'),
  N('list','vehicle_stats',536,173,218,125,'Vehicle stats','stats_list','','garage.selected.stats'),
  N('button','open_upgrades',536,311,218,47,'Upgrades','navigation_action','nav.upgrades'),
  N('button','customize_vehicle',536,365,218,47,'Customize','navigation_action','nav.customize'),
  N('button','change_vehicle',276,435,242,49,'Change vehicle','secondary_action','garage.change_vehicle')
 ]},
 'dealership':{name:'Dealership',nodes:[
  N('label','heading',35,22,340,52,'DEALERSHIP','screen_title'),
  N('label','currency',555,28,203,46,'Currency','balance','','dealership.balance'),
  N('input','search',35,94,256,47,'Search vehicles','filter_search','dealership.search','dealership.search'),
  N('button','filter',308,94,177,47,'Filters','filter_action','dealership.filter'),
  N('list','vehicles',34,154,336,296,'Vehicles','vehicle_catalog','dealership.select','dealership.vehicles'),
  N('panel','vehicle_details',385,154,382,296,'','vehicle_details_panel'),
  N('label','vehicle_name',400,174,345,53,'Vehicle name','detail_title','','dealership.selected.name'),
  N('list','vehicle_stats',401,239,342,124,'Specs','specs_list','','dealership.selected.stats'),
  N('label','vehicle_price',403,375,166,46,'Price','price','','dealership.selected.price'),
  N('button','purchase',578,383,166,56,'Purchase','primary_action','dealership.purchase_request')
 ]},
 'race-selection':{name:'Race Selection',nodes:[
  N('label','heading',32,25,378,54,'RACE SELECTION','screen_title'),
  N('list','race_filters',31,96,172,351,'Event types','event_filters','races.select_filter','races.filters'),
  N('list','races',219,96,288,351,'Races','race_list','races.select','races.items'),
  N('panel','race_detail',522,96,247,352,'','race_details_panel'),
  N('label','race_name',536,118,214,55,'Race name','detail_title','','races.selected.name'),
  N('label','distance',538,189,214,43,'Distance','distance','','races.selected.distance'),
  N('label','opponent',538,245,214,44,'Opponent','opponent','','races.selected.opponent'),
  N('label','reward',538,298,214,42,'Reward','reward','','races.selected.reward'),
  N('button','start_race',538,374,213,56,'Race','primary_action','races.start_request')
 ]},
 'leaderboard':{name:'Leaderboard',nodes:[
  N('label','heading',34,26,376,54,'LEADERBOARD','screen_title'),
  N('list','rank_filters',31,100,183,350,'Categories','category_filters','leaderboard.select_category','leaderboard.categories'),
  N('panel','ranking_panel',231,100,539,351,'','ranking_panel'),
  N('list','rankings',249,118,501,251,'Rankings','ranking_list','leaderboard.select_entry','leaderboard.entries'),
  N('label','your_rank',250,390,276,47,'Your rank','player_rank','','leaderboard.player_rank'),
  N('button','refresh',557,383,190,55,'Refresh','secondary_action','leaderboard.refresh')
 ]},
 'career-events':{name:'Career Events',nodes:[
  N('label','heading',35,26,350,54,'CAREER','screen_title'),
  N('list','event_categories',32,102,185,349,'Categories','category_list','career.select_category','career.categories'),
  N('list','event_list',232,102,290,349,'Events','event_list','career.select_event','career.events'),
  N('panel','event_details',538,102,230,349,'','event_details'),
  N('label','event_title',551,127,202,52,'Event','detail_title','','career.selected.title'),
  N('label','event_requirements',551,196,202,85,'Requirements','requirements','','career.selected.requirements'),
  N('progress','event_progress',553,298,194,24,'Progress','event_progress','','career.selected.progress'),
  N('button','event_enter',551,365,199,56,'Enter','primary_action','career.enter_request')
 ]}
});
