import {normalizeLayout} from './schema.js';
import {PHASE3_PRESETS} from './phase3-presets.js';
/** Wireframes intentionally describe role and behavior, never artwork or game-specific data. */
const N=(type,id,x,y,w,h,label='',role='',actionId='',bindingKey='')=>({type,id,x,y,w,h,label,role,actionId,bindingKey});
export const CORE_PRESETS=Object.freeze({
 'main-menu':{name:'Main Menu',nodes:[
  N('panel','menu_container',230,85,340,345,'','main_menu'),
  N('label','game_title',275,115,250,56,'GAME TITLE','screen_title','','game.title'),
  N('button','start_game',290,210,220,55,'Start','primary_action','game.start'),
  N('button','open_settings',290,279,220,52,'Settings','secondary_action','nav.settings'),
  N('button','exit_game',290,345,220,52,'Exit','tertiary_action','game.exit')
 ]},
 'pause-menu':{name:'Pause Menu',nodes:[
  N('panel','pause_overlay',205,78,390,352,'','pause_overlay'),
  N('label','pause_heading',295,110,210,52,'PAUSED','screen_title'),
  N('button','resume',286,202,228,55,'Resume','primary_action','game.resume'),
  N('button','settings',286,268,228,52,'Settings','secondary_action','nav.settings'),
  N('button','main_menu',286,332,228,52,'Main menu','danger_action','nav.main_menu')
 ]},
 inventory:{name:'Inventory',nodes:[
  N('label','inventory_heading',40,27,320,50,'INVENTORY','screen_title'),
  N('panel','inventory_container',30,94,490,370,'','inventory_container'),
  N('panel','item_detail_container',537,94,233,370,'','item_details'),
  N('input','search_items',48,112,265,45,'Search','filter_search','inventory.search','inventory.search'),
  N('button','sort_items',329,112,168,45,'Sort','sort_action','inventory.sort'),
  N('grid','item_grid',48,177,450,271,'Items','item_grid','inventory.select','inventory.items'),
  N('label','selected_item',558,124,188,46,'Selected item','detail_title','','inventory.selected.name'),
  N('label','item_description',558,190,188,80,'Description','detail_description','','inventory.selected.description'),
  N('button','equip',558,359,188,52,'Equip','primary_action','inventory.equip')
 ]},
 upgrades:{name:'Upgrades',nodes:[
  N('label','upgrades_heading',45,23,340,56,'UPGRADES','screen_title'),
  N('panel','category_panel',32,100,220,365,'','categories'),
  N('list','upgrade_categories',50,121,186,312,'Categories','category_list','upgrades.select_category','upgrades.categories'),
  N('panel','details_panel',267,100,500,365,'','upgrade_details'),
  N('label','upgrade_name',293,133,340,48,'Selected upgrade','detail_title','','upgrades.selected.name'),
  N('progress','upgrade_level',293,199,430,25,'Level','progress_indicator','','upgrades.selected.level_percent'),
  N('label','upgrade_comparison',293,250,430,66,'Stat comparison','comparison','','upgrades.selected.comparison'),
  N('button','upgrade_purchase',466,372,254,54,'Upgrade','primary_action','upgrades.purchase')
 ]},
 shop:{name:'Shop',nodes:[
  N('label','shop_heading',42,24,320,54,'SHOP','screen_title'),
  N('label','currency',551,34,208,42,'Currency','balance','','shop.balance'),
  N('panel','catalog_panel',30,102,487,364,'','catalog'),
  N('grid','shop_items',47,122,454,324,'Items','product_grid','shop.select','shop.items'),
  N('panel','product_detail_panel',534,102,238,364,'','product_details'),
  N('label','product_name',551,128,203,51,'Selected product','detail_title','','shop.selected.name'),
  N('label','price',551,235,203,50,'Price','price','','shop.selected.price'),
  N('button','buy',552,369,200,56,'Purchase','primary_action','shop.purchase')
 ]},
 settings:{name:'Settings',nodes:[
  N('panel','settings_panel',143,40,514,420,'','settings_container'),
  N('label','settings_heading',225,74,351,54,'SETTINGS','screen_title'),
  N('toggle','music_toggle',220,157,358,47,'Music','setting_toggle','settings.music_changed','settings.music'),
  N('toggle','sfx_toggle',220,215,358,47,'Sound effects','setting_toggle','settings.sfx_changed','settings.sfx'),
  N('slider','volume_slider',220,275,358,49,'Volume','setting_slider','settings.volume_changed','settings.volume'),
  N('button','back',295,378,210,54,'Back','back_action','nav.back')
 ]},
 hud:{name:'Game HUD',nodes:[
  N('panel','top_left_hud',20,18,295,96,'','hud_top_left'),
  N('label','score_value',37,36,254,50,'Score','stat_value','','hud.score'),
  N('panel','top_right_hud',565,18,216,96,'','hud_top_right'),
  N('label','timer',585,40,173,50,'Time','timer','','hud.time'),
  N('panel','bottom_hud',20,410,760,70,'','hud_bottom'),
  N('progress','health_bar',42,436,285,22,'Health','health_indicator','','hud.health'),
  N('button','pause',670,424,86,43,'Pause','hud_action','game.pause')
 ]}
  ,
 equipment:{name:'Equipment',nodes:[
  N('label','equipment_title',40,25,360,54,'EQUIPMENT','screen_title'),
  N('panel','inventory_panel',30,95,420,360,'','inventory_panel'),
  N('input','equipment_search',48,115,230,45,'Search items','filter_search','inventory.search','inventory.search'),
  N('grid','equipment_items',48,183,382,235,'Inventory','item_grid','inventory.select','inventory.items'),
  N('panel','equipment_panel',470,95,300,360,'','equipment_panel'),
  N('label','equipment_selected',486,111,258,46,'Selected item','detail_title','','inventory.selected.name'),
  N('slot','primary_slot',489,180,114,100,'Primary slot','primary_slot','equipment.slot_primary','equipment.primary'),
  N('slot','secondary_slot',620,180,114,100,'Secondary slot','secondary_slot','equipment.slot_secondary','equipment.secondary'),
  N('button','equip_primary',488,305,120,55,'Equip','primary_action','inventory.equip'),
  N('button','unequip',622,305,116,55,'Unequip','secondary_action','equipment.unequip'),
  N('button','back_equipment',621,390,110,43,'Back','back_action','nav.back')
 ]},
 'search-list':{name:'Searchable List',nodes:[
  N('label','list_title',50,35,340,60,'LIST','screen_title'),
  N('input','list_search',50,115,470,50,'Search','filter_search','inventory.search','inventory.search'),
  N('button','list_sort',540,115,202,50,'Sort','sort_action','inventory.sort'),
  N('list','list_results',50,185,690,260,'Results','result_list','inventory.select','inventory.items'),
  N('label','list_count',50,451,310,34,'Count','status','','inventory.visibleCount')
 ]},
 confirmation:{name:'Confirmation Dialog',nodes:[
  N('panel','confirm_backdrop',185,83,430,340,'','modal_region'),
  N('label','confirm_heading',232,126,336,55,'Confirm action','modal_title','','confirmation.title'),
  N('label','confirm_message',232,194,336,76,'Are you sure?','modal_message','','confirmation.message'),
  N('button','confirm_cancel',236,309,147,56,'Cancel','secondary_action','ui.cancel'),
  N('button','confirm_approve',416,309,147,56,'Confirm','primary_action','ui.confirm')
 ]}
});
/** All presets share the same layout contract and can be imported by either engine. */
export const PRESETS=Object.freeze({...CORE_PRESETS,...PHASE3_PRESETS});
export function getPreset(name) {
 const raw=PRESETS[name];
 if(!raw)throw new Error('Unknown layout preset');
 return normalizeLayout({version:2,name:raw.name,viewport:{width:800,height:500},nodes:structuredClone(raw.nodes),edges:structuredClone(raw.edges??[])});
}
